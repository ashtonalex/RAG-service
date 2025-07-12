from enum import Enum
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional
import re

class ChunkingStrategy(str, Enum):
    FIXED_SIZE = "fixed_size"
    SEMANTIC = "semantic"
    HYBRID = "hybrid"

@dataclass
class ChunkMetadata:
    chunk_index: int
    start_pos: int
    end_pos: int
    total_chunks: int
    file_id: Optional[str] = None
    project_id: Optional[str] = None
    extra: Dict[str, Any] = field(default_factory=dict)

@dataclass
class Chunk:
    text: str
    metadata: ChunkMetadata

class HybridChunker:
    def __init__(self, default_chunk_size: int = 1000, overlap: int = 200):
        self.default_chunk_size = default_chunk_size
        self.overlap = overlap

    def fixed_size_chunk(self, text: str, chunk_size: int = None, overlap: int = None) -> List[Chunk]:
        chunk_size = chunk_size or self.default_chunk_size
        overlap = overlap or self.overlap
        chunks = []
        start = 0
        end = 0
        text_length = len(text)
        chunk_index = 0
        while start < text_length:
            end = min(start + chunk_size, text_length)
            chunk_text = text[start:end]
            chunks.append(Chunk(
                text=chunk_text,
                metadata=ChunkMetadata(
                    chunk_index=chunk_index,
                    start_pos=start,
                    end_pos=end,
                    total_chunks=0  # will update later
                )
            ))
            chunk_index += 1
            start = end - overlap if end - overlap > start else end
        # Update total_chunks
        total = len(chunks)
        for c in chunks:
            c.metadata.total_chunks = total
        return chunks

    def semantic_chunk(self, text: str) -> List[Chunk]:
        # Split by paragraphs or sentences for semantic boundaries
        paragraphs = [p.strip() for p in re.split(r'\n\s*\n', text) if p.strip()]
        chunks = []
        pos = 0
        for idx, para in enumerate(paragraphs):
            start = text.find(para, pos)
            end = start + len(para)
            chunks.append(Chunk(
                text=para,
                metadata=ChunkMetadata(
                    chunk_index=idx,
                    start_pos=start,
                    end_pos=end,
                    total_chunks=0  # will update later
                )
            ))
            pos = end
        total = len(chunks)
        for c in chunks:
            c.metadata.total_chunks = total
        return chunks

    def hybrid_chunk(self, text: str, strategies: List[ChunkingStrategy] = None, chunk_size: int = None, overlap: int = None) -> Dict[ChunkingStrategy, List[Chunk]]:
        if not text.strip():
            return {s: [] for s in (strategies or [ChunkingStrategy.FIXED_SIZE])}
        strategies = strategies or [ChunkingStrategy.FIXED_SIZE]
        results = {}
        for strategy in strategies:
            if strategy == ChunkingStrategy.FIXED_SIZE:
                results[strategy] = self.fixed_size_chunk(text, chunk_size, overlap)
            elif strategy == ChunkingStrategy.SEMANTIC:
                results[strategy] = self.semantic_chunk(text)
            elif strategy == ChunkingStrategy.HYBRID:
                # First semantic, then split large chunks by fixed size
                semantic_chunks = self.semantic_chunk(text)
                hybrid_chunks = []
                for chunk in semantic_chunks:
                    if len(chunk.text) > (chunk_size or self.default_chunk_size) * 1.5:
                        hybrid_chunks.extend(self.fixed_size_chunk(chunk.text, chunk_size, overlap))
                    else:
                        hybrid_chunks.append(chunk)
                # Update total_chunks
                total = len(hybrid_chunks)
                for c in hybrid_chunks:
                    c.metadata.total_chunks = total
                results[strategy] = hybrid_chunks
            else:
                results[strategy] = []
        return results
