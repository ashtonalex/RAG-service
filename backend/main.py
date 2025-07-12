from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import os
from typing import Optional

from hybrid_chunking import HybridChunker, ChunkingStrategy

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


@app.post("/api/chunk")
async def chunk_text_or_file(
    text: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    strategy: Optional[str] = Form("fixed_size"),
):
    if not text and not file:
        raise HTTPException(
            status_code=400, detail="Either text or file must be provided."
        )

    if file:
        content = await file.read()
        try:
            text = content.decode("utf-8")
        except Exception:
            raise HTTPException(
                status_code=400, detail="File must be UTF-8 encoded text."
            )

    if not text:
        raise HTTPException(status_code=400, detail="No text to chunk.")

    # Select chunking strategy
    try:
        strategy_enum = ChunkingStrategy(strategy)
    except Exception:
        strategy_enum = ChunkingStrategy.FIXED_SIZE

    # Chunk the text
    try:
        results = chunker.hybrid_chunk(text, strategies=[strategy_enum])
        chunks = results[strategy_enum]
        # Return chunk text and metadata (not embeddings)
        return JSONResponse(
            [
                {"text": chunk.text, "metadata": chunk.metadata.__dict__}
                for chunk in chunks
            ]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chunking failed: {str(e)}")


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
