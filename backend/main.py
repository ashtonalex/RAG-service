from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import Optional
import uvicorn

# ✅ Correct: Import only from services if that's your intended folder structure
from services.embedding_pipeline import embed_and_store_chunks
from hybrid_chunking import HybridChunker, ChunkingStrategy

app = FastAPI()

# ✅ CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # update if needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

chunker = HybridChunker()

@app.post("/api/chunk")
async def chunk_text_or_file(
    text: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    strategy: Optional[str] = Form("fixed_size"),
):
    if not text and not file:
        raise HTTPException(status_code=400, detail="Either text or file must be provided.")

    if file:
        content = await file.read()
        try:
            text = content.decode("utf-8")
        except Exception:
            raise HTTPException(status_code=400, detail="File must be UTF-8 encoded text.")

    if not text:
        raise HTTPException(status_code=400, detail="No text to chunk.")

    # ✅ Parse strategy
    try:
        strategy_enum = ChunkingStrategy(strategy)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid strategy: {strategy}")

    try:
        # ✅ Chunk
        results = chunker.hybrid_chunk(text, strategies=[strategy_enum])
        chunks = results[strategy_enum]

        # ✅ Embed and store
        embed_and_store_chunks(chunks, collection_name="rag_chunks")

        # ✅ Return metadata only
        return JSONResponse([
            {"text": chunk.text, "metadata": chunk.metadata.__dict__}
            for chunk in chunks
        ])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chunking or embedding failed: {str(e)}")


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
