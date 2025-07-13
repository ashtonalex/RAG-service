from typing import List, Dict, Any, Optional
from backend.hybrid_chunking import (
    HybridChunker,
    ChunkingStrategy,
    Chunk,
    ChunkMetadata,
)
import hashlib
from datetime import datetime
from pathlib import Path


class ChunkingService:
    """
    Unified chunking service that integrates HybridChunker with the embedding pipeline.
    Provides clean interfaces for chunking text with proper metadata preservation.
    """

    def __init__(self, default_chunk_size: int = 1000, default_overlap: int = 200):
        self.chunker = HybridChunker(default_chunk_size, default_overlap)
        self.default_chunk_size = default_chunk_size
        self.default_overlap = default_overlap

    def chunk_text(
        self,
        text: str,
        strategy: ChunkingStrategy = ChunkingStrategy.FIXED_SIZE,
        chunk_size: Optional[int] = None,
        overlap: Optional[int] = None,
        file_metadata: Optional[Dict[str, Any]] = None,
    ) -> List[Chunk]:
        """
        Chunk text using the specified strategy and return chunks with metadata.

        Args:
            text: Input text to chunk
            strategy: Chunking strategy to use
            chunk_size: Override default chunk size
            overlap: Override default overlap
            file_metadata: Additional metadata to attach to chunks

        Returns:
            List of Chunk objects with metadata
        """
        if not text.strip():
            return []

        # Use hybrid chunking with single strategy
        results = self.chunker.hybrid_chunk(
            text,
            strategies=[strategy],
            custom_params={
                strategy.value: {
                    "chunk_size": chunk_size or self.default_chunk_size,
                    "overlap": overlap or self.default_overlap,
                }
            },
        )

        chunks = results.get(strategy, [])

        # Enhance metadata with file information if provided
        if file_metadata:
            for chunk in chunks:
                chunk.metadata.file_id = file_metadata.get("file_id")
                chunk.metadata.project_id = file_metadata.get("project_id")
                # Add any additional metadata
                for key, value in file_metadata.items():
                    if key not in ["file_id", "project_id"]:
                        chunk.metadata.extra[key] = value

        return chunks

    def chunk_file(
        self,
        file_path: str,
        project_id: str,
        file_id: str,
        strategy: ChunkingStrategy = ChunkingStrategy.FIXED_SIZE,
        chunk_size: Optional[int] = None,
        overlap: Optional[int] = None,
    ) -> List[Chunk]:
        """
        Chunk a file and return chunks with file-specific metadata.

        Args:
            file_path: Path to the file
            project_id: Project ID
            file_id: File ID
            strategy: Chunking strategy
            chunk_size: Override default chunk size
            overlap: Override default overlap

        Returns:
            List of Chunk objects with file metadata
        """
        # Extract text from file (this would need to be implemented based on file type)
        # For now, we'll assume text extraction is handled elsewhere

        file_metadata = {
            "file_id": file_id,
            "project_id": project_id,
            "file_path": file_path,
            "file_name": Path(file_path).name,
            "file_hash": hashlib.md5(file_path.encode()).hexdigest(),
            "chunked_at": datetime.now().isoformat(),
        }

        # This method would need to be called with extracted text
        # For now, return empty list as placeholder
        return []

    def prepare_chunks_for_embedding(self, chunks: List[Chunk]) -> Dict[str, Any]:
        """
        Prepare chunks for embedding and storage in vector database.

        Args:
            chunks: List of Chunk objects

        Returns:
            Dictionary with prepared data for ChromaDB
        """
        chunk_ids = []
        chunk_texts = []
        chunk_metadatas = []

        for i, chunk in enumerate(chunks):
            # Generate unique chunk ID
            chunk_id = f"{chunk.metadata.extra.get('file_hash', 'unknown')}_{i}"
            chunk_ids.append(chunk_id)
            chunk_texts.append(chunk.text)

            # Prepare metadata for ChromaDB
            metadata = {
                "chunk_id": chunk_id,
                "chunk_index": chunk.metadata.chunk_index,
                "start_pos": chunk.metadata.start_pos,
                "end_pos": chunk.metadata.end_pos,
                "total_chunks": chunk.metadata.total_chunks,
                "file_id": chunk.metadata.file_id,
                "project_id": chunk.metadata.project_id,
                "chunk_size": len(chunk.text),
                "strategy": "hybrid",  # Could be made configurable
                "created_at": datetime.now().isoformat(),
            }

            # Add any extra metadata
            metadata.update(chunk.metadata.extra)
            chunk_metadatas.append(metadata)

        return {"ids": chunk_ids, "texts": chunk_texts, "metadatas": chunk_metadatas}

    def get_chunking_stats(self, chunks: List[Chunk]) -> Dict[str, Any]:
        """
        Get statistics about the chunking process.

        Args:
            chunks: List of Chunk objects

        Returns:
            Dictionary with chunking statistics
        """
        if not chunks:
            return {
                "total_chunks": 0,
                "total_text_length": 0,
                "average_chunk_size": 0,
                "min_chunk_size": 0,
                "max_chunk_size": 0,
            }

        chunk_sizes = [len(chunk.text) for chunk in chunks]
        total_length = sum(chunk_sizes)

        return {
            "total_chunks": len(chunks),
            "total_text_length": total_length,
            "average_chunk_size": total_length / len(chunks),
            "min_chunk_size": min(chunk_sizes),
            "max_chunk_size": max(chunk_sizes),
        }


# Global instance
chunking_service = ChunkingService()
