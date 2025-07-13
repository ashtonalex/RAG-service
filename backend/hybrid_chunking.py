from enum import Enum
import logging
from sentence_transformers import SentenceTransformer
import numpy as np
from sklearn.cluster import KMeans
from sklearn.metrics.pairwise import cosine_similarity
import tiktoken
import hashlib
import traceback

# Download required NLTK data
try:
    nltk.data.find("tokenizers/punkt")
except LookupError:
    nltk.download("punkt")

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)


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

    def structural_chunking(self, text: str) -> List[Chunk]:
        """
        Chunking based on document structure (headers, paragraphs, etc.)
        """
        chunks = []

        # Split by double newlines (paragraphs)
        paragraphs = re.split(r"\n\s*\n", text)
        current_position = 0

        for paragraph in paragraphs:
            paragraph = paragraph.strip()
            if not paragraph:
                continue

            # Check if it's a header (simple heuristic)
            is_header = (
                len(paragraph.split("\n")) == 1
                and len(paragraph) < 100
                and (paragraph.isupper() or paragraph.startswith("#"))
            )

            # Find actual position in original text
            start_pos = text.find(paragraph, current_position)
            end_pos = start_pos + len(paragraph)

            metadata = ChunkMetadata(
                chunk_id=self.generate_chunk_id(paragraph, ChunkingStrategy.STRUCTURAL),
                strategy=ChunkingStrategy.STRUCTURAL,
                start_position=start_pos,
                end_position=end_pos,
                token_count=self.count_tokens(paragraph),
                sentence_count=len(nltk.sent_tokenize(paragraph)),
                overlap_info={"is_header": is_header},
            )

            chunks.append(Chunk(text=paragraph, metadata=metadata))
            current_position = end_pos

        return chunks

    def sliding_window_chunking(
        self, text: str, window_size: int = 256, stride: int = 128
    ) -> List[Chunk]:
        """
        Sliding window chunking with configurable stride
        """
        tokens = self.tokenizer.encode(text)
        chunks = []

        for i in range(0, len(tokens), stride):
            window_tokens = tokens[i : i + window_size]
            if len(window_tokens) < window_size // 2:  # Skip very small chunks
                break

            chunk_text = self.tokenizer.decode(window_tokens)

            # Calculate positions
            start_pos = len(self.tokenizer.decode(tokens[:i]))
            end_pos = len(self.tokenizer.decode(tokens[: i + len(window_tokens)]))

            metadata = ChunkMetadata(
                chunk_id=self.generate_chunk_id(
                    chunk_text, ChunkingStrategy.SLIDING_WINDOW
                ),
                strategy=ChunkingStrategy.SLIDING_WINDOW,
                start_position=start_pos,
                end_position=end_pos,
                token_count=len(window_tokens),
                sentence_count=len(nltk.sent_tokenize(chunk_text)),
                overlap_info={"window_size": window_size, "stride": stride},
            )

            chunks.append(Chunk(text=chunk_text, metadata=metadata))

        return chunks

    def topic_based_chunking(
        self, text: str, num_topics: int = 5, min_chunk_size: int = 200
    ) -> List[Chunk]:
        """
        Topic-based chunking using sentence embeddings and clustering
        """
        sentences = nltk.sent_tokenize(text)
        if len(sentences) < num_topics:
            return self.sentence_boundary_chunking(text)

        # Generate embeddings
        embeddings = self.sentence_transformer.encode(sentences)

        # Cluster sentences
        kmeans = KMeans(n_clusters=min(num_topics, len(sentences)), random_state=42)
        clusters = kmeans.fit_predict(embeddings)

        # Group sentences by cluster
        clustered_sentences = {}
        for i, cluster_id in enumerate(clusters):
            if cluster_id not in clustered_sentences:
                clustered_sentences[cluster_id] = []
            clustered_sentences[cluster_id].append((i, sentences[i]))

        chunks = []
        for cluster_id, sentence_list in clustered_sentences.items():
            # Sort by original order
            sentence_list.sort(key=lambda x: x[0])
            cluster_text = " ".join([s[1] for s in sentence_list])

            if len(cluster_text) < min_chunk_size:
                continue

            # Calculate approximate position
            first_sentence_idx = sentence_list[0][0]
            approx_start = sum(len(s) for s in sentences[:first_sentence_idx])

            metadata = ChunkMetadata(
                chunk_id=self.generate_chunk_id(
                    cluster_text, ChunkingStrategy.TOPIC_BASED
                ),
                strategy=ChunkingStrategy.TOPIC_BASED,
                start_position=approx_start,
                end_position=approx_start + len(cluster_text),
                token_count=self.count_tokens(cluster_text),
                sentence_count=len(sentence_list),
                topic_cluster=cluster_id,
            )

            chunk = Chunk(text=cluster_text, metadata=metadata)
            chunk.embedding = np.mean([embeddings[i] for i, _ in sentence_list], axis=0)
            chunks.append(chunk)

        return chunks

    def hybrid_chunk(
        self,
        text: str,
        strategies: Optional[List[ChunkingStrategy]] = None,
        custom_params: Optional[Dict[str, Dict]] = None,
    ) -> Dict[ChunkingStrategy, List[Chunk]]:
        """
        Apply multiple chunking strategies to the same text

        Args:
            text: Input text to chunk
            strategies: List of strategies to apply
            custom_params: Custom parameters for each strategy

        Returns:
            Dictionary mapping strategies to their chunks
        """
        if strategies is None:
            strategies = [
                ChunkingStrategy.FIXED_SIZE,
                ChunkingStrategy.SENTENCE_BOUNDARY,
                ChunkingStrategy.SEMANTIC_SIMILARITY,
            ]

        if custom_params is None:
            custom_params = {}

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
