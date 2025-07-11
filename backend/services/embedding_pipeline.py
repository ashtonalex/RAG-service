# embedding_pipeline.py

from typing import List
import chromadb
from sentence_transformers import SentenceTransformer
from hybrid_chunking import Chunk

# ✅ Load model once at module level to avoid repeated loading
model = SentenceTransformer("all-MiniLM-L6-v2")

# ✅ Initialize ChromaDB client once (you can move this elsewhere if needed)
client = chromadb.Client()

def embed_and_store_chunks(chunks: List[Chunk], collection_name: str = "pdf_chunks"):
    collection = client.get_or_create_collection(name=collection_name)

    documents = []
    metadatas = []
    ids = []
    embeddings = []

    for chunk in chunks:
        # Compute embedding if not already present
        if chunk.embedding is None:
            chunk.embedding = model.encode(chunk.text)

        # ✅ Ensure unique chunk_id (optional, safe for repeated uploads)
        chunk_id = f"{collection_name}_{chunk.metadata.chunk_id}"

        documents.append(chunk.text)
        metadatas.append(chunk.metadata.__dict__)
        ids.append(chunk_id)
        embeddings.append(chunk.embedding)

    # ✅ Batch insert all chunks at once
    collection.add(
        documents=documents,
        metadatas=metadatas,
        ids=ids,
        embeddings=embeddings,
    )

    print(f"✅ Stored {len(chunks)} chunks in ChromaDB collection '{collection_name}'")
