from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import Optional, List
import uvicorn
import os
import asyncio

from backend.services.embedding_pipeline import embed_and_store_chunks
from backend.hybrid_chunking import HybridChunker, ChunkingStrategy
from backend.metadata_store import add_file, load_metadata, save_metadata, list_projects, list_files, delete_project, delete_file, update_file_status
from backend.file_conversion import convert_to_pdf
import pdfplumber
from sentence_transformers import SentenceTransformer, CrossEncoder
import chromadb
import openai

app = FastAPI()

# CORS support for local frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

chunker = HybridChunker()

# Load models and ChromaDB client
bi_encoder = SentenceTransformer("all-MiniLM-L6-v2")
cross_encoder = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")
chroma_client = chromadb.Client()

async def save_upload_file(upload_file, destination):
    with open(destination, "wb") as buffer:
        content = await upload_file.read()
        buffer.write(content)
    return destination

def extract_text_from_pdf(pdf_path):
    text = ""
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            text += page.extract_text() or ""
    return text

@app.get("/api/test")
def test_endpoint():
    return {"message": "Server is working!", "status": "ok"}

@app.post("/api/test-chunk")
async def test_chunk_simple(text: str = Form(...)):
    """Simple test endpoint for chunking"""
    try:
        # Simple chunking without strategy
        chunks = text.split('. ')
        return {"chunks": chunks, "count": len(chunks)}
    except Exception as e:
        return {"error": str(e)}

@app.post("/api/chunk")
async def chunk_text_or_file(
    text: str = Form(...),
    strategy: str = Form("fixed_size"),
    chunk_size: Optional[int] = Form(1000),
    overlap: Optional[int] = Form(200),
):
    """
    Advanced chunking endpoint using the unified chunking service.
    Returns chunks with rich metadata for embedding pipeline.
    """
    try:
        # Select chunking strategy
        strategy_enum = ChunkingStrategy(strategy)
        
        # Use unified chunking service
        from backend.services.chunking_service import chunking_service
        chunks = chunking_service.chunk_text(
            text=text,
            strategy=strategy_enum,
            chunk_size=chunk_size,
            overlap=overlap
        )
        
        # Get chunking statistics
        stats = chunking_service.get_chunking_stats(chunks)
        
        # Return chunks with metadata and statistics
        return JSONResponse({
            "chunks": [
                {
                    "text": chunk.text,
                    "metadata": {
                        "chunk_index": chunk.metadata.chunk_index,
                        "start_pos": chunk.metadata.start_pos,
                        "end_pos": chunk.metadata.end_pos,
                        "total_chunks": chunk.metadata.total_chunks,
                        "chunk_size": len(chunk.text)
                    }
                }
                for chunk in chunks
            ],
            "stats": stats,
            "strategy": strategy_enum.value
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chunking failed: {str(e)}")

@app.post("/api/batch-upload")
async def batch_upload(
    projectId: str = Form(...),
    files: List[UploadFile] = File(...),
    strategy: Optional[str] = Form("fixed_size"),
):
    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded.")
    strategy_enum = ChunkingStrategy(strategy) if strategy in ChunkingStrategy._value2member_map_ else ChunkingStrategy.FIXED_SIZE

    results = []
    errors = []

    async def process_file(file: UploadFile):
        temp_path = f"/tmp/{file.filename}"
        pdf_path = None
        file_id = None
        try:
            # Save uploaded file
            await save_upload_file(file, temp_path)
            # Register file as 'uploading'
            file_id = add_file(projectId, file.filename, file.content_type or "txt", file.size if hasattr(file, 'size') else os.path.getsize(temp_path))
            update_file_status(file_id, "processing")
            # Convert to PDF
            pdf_path = convert_to_pdf(temp_path)
            # Extract text from PDF
            text = extract_text_from_pdf(pdf_path)
            # Process file through embedding pipeline with strategy
            result = await embed_and_store_chunks(
                temp_path, 
                projectId, 
                strategy=strategy_enum,
                file_id=file_id
            )
            if not result["success"]:
                raise Exception(result["error"])
            update_file_status(file_id, "completed")
            results.append({
                "fileId": file_id,
                "filename": file.filename,
                "chunks_created": result["chunks_created"],
                "total_text_length": result["total_text_length"]
            })
        except Exception as e:
            if file_id:
                update_file_status(file_id, "failed")
            errors.append({"filename": file.filename, "error": str(e)})
        finally:
            # Clean up temp files
            try:
                if os.path.exists(temp_path):
                    os.remove(temp_path)
                if pdf_path and pdf_path != temp_path and os.path.exists(pdf_path):
                    os.remove(pdf_path)
            except Exception:
                pass

    await asyncio.gather(*(process_file(file) for file in files))

    return {"results": results, "errors": errors}

@app.post("/api/ask")
async def ask_question(payload: dict):
    project_id = payload.get("projectId")
    question = payload.get("question")
    if not project_id or not question:
        raise HTTPException(status_code=400, detail="projectId and question are required.")

    # 1. Embed the question
    question_emb = bi_encoder.encode([question])[0]

    # 2. Query ChromaDB for top-k chunks
    collection = chroma_client.get_collection("documents")
    results = collection.query(
        query_embeddings=[question_emb],
        n_results=20,
        include=["documents", "metadatas"]
    )
    candidate_chunks = [
        {"text": doc, "metadata": meta}
        for doc, meta in zip(results["documents"][0], results["metadatas"][0])
    ]

    # 3. Rerank with cross-encoder
    cross_inp = [[question, chunk["text"]] for chunk in candidate_chunks]
    rerank_scores = cross_encoder.predict(cross_inp)
    reranked = sorted(zip(candidate_chunks, rerank_scores), key=lambda x: x[1], reverse=True)
    top_chunks = [chunk for chunk, score in reranked[:5]]

    # 4. Assemble context
    context = "\n\n".join([chunk["text"] for chunk in top_chunks])

    # 5. Generate answer with OpenAI LLM (placeholder for API key)
    openai.api_key = os.getenv("OPENAI_API_KEY", "sk-...your-key...")
    prompt = (
        f"You are a helpful assistant. Use ONLY the context below to answer the question.\n"
        f"If the answer is not in the context, say 'I don't know.'\n"
        f"Context:\n{context}\n\nQuestion: {question}\nAnswer:"
    )
    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=512,
        temperature=0.2,
    )
    answer = response["choices"][0]["message"]["content"].strip()

    return {
        "answer": answer,
        "sources": top_chunks
    }

@app.get("/api/projects")
def get_projects(limit: int = 20, offset: int = 0, search: str = ""):
    all_projects = list_projects()
    if search:
        all_projects = [p for p in all_projects if search.lower() in p["name"].lower() or search.lower() in p["description"].lower()]
    return {
        "projects": all_projects[offset:offset+limit],
        "total": len(all_projects)
    }

@app.get("/api/projects/{project_id}/files")
def get_project_files(project_id: str, limit: int = 20, offset: int = 0, search: str = "", status: str = ""):
    all_files = list_files(project_id)
    if search:
        all_files = [f for f in all_files if search.lower() in f["filename"].lower()]
    if status:
        all_files = [f for f in all_files if f["status"] == status]
    return {
        "files": all_files[offset:offset+limit],
        "total": len(all_files)
    }

@app.delete("/api/projects/{project_id}")
def remove_project(project_id: str):
    delete_project(project_id)
    return {"status": "deleted", "projectId": project_id}

@app.delete("/api/files/{file_id}")
def remove_file(file_id: str):
    delete_file(file_id)
    return {"status": "deleted", "fileId": file_id}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
