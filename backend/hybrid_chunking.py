import re
import spacy
import nltk
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass
from enum import Enum
import logging
from sentence_transformers import SentenceTransformer
import numpy as np
from sklearn.cluster import KMeans
from sklearn.metrics.pairwise import cosine_similarity
import tiktoken
import hashlib

# Download required NLTK data
try:
    nltk.data.find("tokenizers/punkt")
except LookupError:
    nltk.download("punkt")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ChunkingStrategy(Enum):
    """Different chunking strategies"""

    FIXED_SIZE = "fixed_size"
    SENTENCE_BOUNDARY = "sentence_boundary"
    SEMANTIC_SIMILARITY = "semantic_similarity"
    STRUCTURAL = "structural"
    SLIDING_WINDOW = "sliding_window"
    PARAGRAPH = "paragraph"
    TOPIC_BASED = "topic_based"


@dataclass
class ChunkMetadata:
    """Metadata for each chunk"""

    chunk_id: str
    strategy: ChunkingStrategy
    start_position: int
    end_position: int
    token_count: int
    sentence_count: int
    semantic_score: Optional[float] = None
    topic_cluster: Optional[int] = None
    parent_chunk_id: Optional[str] = None
    overlap_info: Optional[Dict] = None


@dataclass
class Chunk:
    """Represents a text chunk with metadata"""

    text: str
    metadata: ChunkMetadata
    embedding: Optional[np.ndarray] = None


class HybridChunker:
    """
    Hybrid chunking system that combines multiple strategies
    Uses free, open-source models and libraries
    """

    def __init__(
        self,
        embedding_model: str = "all-MiniLM-L6-v2",
        spacy_model: str = "en_core_web_sm",
        encoding_name: str = "cl100k_base",
    ):
        """
        Initialize the hybrid chunker

        Args:
            embedding_model: SentenceTransformer model for semantic chunking
            spacy_model: SpaCy model for NLP processing
            encoding_name: Tiktoken encoding for token counting
        """
        self.embedding_model_name = embedding_model
        self.spacy_model_name = spacy_model
        self.encoding_name = encoding_name

        # Initialize models
        self._load_models()

        # Default chunking parameters
        self.default_params = {
            "fixed_size": {"chunk_size": 512, "overlap": 50},
            "sentence_boundary": {"max_sentences": 5, "min_chunk_size": 100},
            "semantic_similarity": {
                "similarity_threshold": 0.8,
                "max_chunk_size": 1000,
            },
            "sliding_window": {"window_size": 256, "stride": 128},
            "paragraph": {"min_paragraph_size": 50, "max_paragraph_size": 1000},
            "topic_based": {"num_topics": 5, "min_chunk_size": 200},
        }

    def _load_models(self):
        """Load required models"""
        try:
            # Load sentence transformer for embeddings
            self.sentence_transformer = SentenceTransformer(self.embedding_model_name)
            logger.info(f"Loaded embedding model: {self.embedding_model_name}")

            # Load SpaCy model for NLP
            self.nlp = spacy.load(self.spacy_model_name)
            logger.info(f"Loaded SpaCy model: {self.spacy_model_name}")

            # Load tiktoken for token counting
            self.tokenizer = tiktoken.get_encoding(self.encoding_name)
            logger.info(f"Loaded tokenizer: {self.encoding_name}")

        except Exception as e:
            logger.error(f"Error loading models: {e}")
            raise

    def count_tokens(self, text: str) -> int:
        """Count tokens in text"""
        return len(self.tokenizer.encode(text))

    def generate_chunk_id(self, text: str, strategy: ChunkingStrategy) -> str:
        """Generate unique chunk ID"""
        content_hash = hashlib.md5(text.encode()).hexdigest()[:8]
        return f"{strategy.value}_{content_hash}"

    def fixed_size_chunking(
        self, text: str, chunk_size: int = 512, overlap: int = 50
    ) -> List[Chunk]:
        """
        Fixed-size chunking with overlap
        """
        chunks = []
        tokens = self.tokenizer.encode(text)

        for i in range(0, len(tokens), chunk_size - overlap):
            chunk_tokens = tokens[i : i + chunk_size]
            chunk_text = self.tokenizer.decode(chunk_tokens)

            # Calculate positions in original text
            start_pos = len(self.tokenizer.decode(tokens[:i]))
            end_pos = len(self.tokenizer.decode(tokens[: i + len(chunk_tokens)]))

            metadata = ChunkMetadata(
                chunk_id=self.generate_chunk_id(
                    chunk_text, ChunkingStrategy.FIXED_SIZE
                ),
                strategy=ChunkingStrategy.FIXED_SIZE,
                start_position=start_pos,
                end_position=end_pos,
                token_count=len(chunk_tokens),
                sentence_count=len(nltk.sent_tokenize(chunk_text)),
                overlap_info={"overlap_size": overlap, "chunk_size": chunk_size},
            )

            chunks.append(Chunk(text=chunk_text, metadata=metadata))

        return chunks

    def sentence_boundary_chunking(
        self, text: str, max_sentences: int = 5, min_chunk_size: int = 100
    ) -> List[Chunk]:
        """
        Chunking based on sentence boundaries
        """
        sentences = nltk.sent_tokenize(text)
        chunks = []
        current_chunk = []
        current_position = 0

        for sentence in sentences:
            current_chunk.append(sentence)

            # Check if we should create a chunk
            chunk_text = " ".join(current_chunk)
            should_chunk = len(current_chunk) >= max_sentences or (
                len(chunk_text) >= min_chunk_size and len(current_chunk) > 1
            )

            if should_chunk:
                start_pos = current_position
                end_pos = current_position + len(chunk_text)

                metadata = ChunkMetadata(
                    chunk_id=self.generate_chunk_id(
                        chunk_text, ChunkingStrategy.SENTENCE_BOUNDARY
                    ),
                    strategy=ChunkingStrategy.SENTENCE_BOUNDARY,
                    start_position=start_pos,
                    end_position=end_pos,
                    token_count=self.count_tokens(chunk_text),
                    sentence_count=len(current_chunk),
                )

                chunks.append(Chunk(text=chunk_text, metadata=metadata))
                current_position = end_pos
                current_chunk = []

        # Handle remaining sentences
        if current_chunk:
            chunk_text = " ".join(current_chunk)
            metadata = ChunkMetadata(
                chunk_id=self.generate_chunk_id(
                    chunk_text, ChunkingStrategy.SENTENCE_BOUNDARY
                ),
                strategy=ChunkingStrategy.SENTENCE_BOUNDARY,
                start_position=current_position,
                end_position=current_position + len(chunk_text),
                token_count=self.count_tokens(chunk_text),
                sentence_count=len(current_chunk),
            )
            chunks.append(Chunk(text=chunk_text, metadata=metadata))

        return chunks

    def semantic_similarity_chunking(
        self, text: str, similarity_threshold: float = 0.8, max_chunk_size: int = 1000
    ) -> List[Chunk]:
        """
        Chunking based on semantic similarity between sentences
        """
        sentences = nltk.sent_tokenize(text)
        if len(sentences) <= 1:
            return self.fixed_size_chunking(text)

        # Generate embeddings for sentences
        embeddings = self.sentence_transformer.encode(sentences)

        chunks = []
        current_chunk = [sentences[0]]
        current_embedding = [embeddings[0]]
        start_position = 0

        for i in range(1, len(sentences)):
            # Calculate similarity with current chunk
            chunk_embedding = np.mean(current_embedding, axis=0)
            similarity = cosine_similarity([chunk_embedding], [embeddings[i]])[0][0]

            # Check if sentence should be added to current chunk
            potential_chunk = current_chunk + [sentences[i]]
            potential_text = " ".join(potential_chunk)

            should_add = (
                similarity >= similarity_threshold
                and len(potential_text) <= max_chunk_size
            )

            if should_add:
                current_chunk.append(sentences[i])
                current_embedding.append(embeddings[i])
            else:
                # Finalize current chunk
                chunk_text = " ".join(current_chunk)
                end_position = start_position + len(chunk_text)

                metadata = ChunkMetadata(
                    chunk_id=self.generate_chunk_id(
                        chunk_text, ChunkingStrategy.SEMANTIC_SIMILARITY
                    ),
                    strategy=ChunkingStrategy.SEMANTIC_SIMILARITY,
                    start_position=start_position,
                    end_position=end_position,
                    token_count=self.count_tokens(chunk_text),
                    sentence_count=len(current_chunk),
                    semantic_score=float(
                        np.mean(
                            [
                                cosine_similarity([current_embedding[0]], [emb])[0][0]
                                for emb in current_embedding[1:]
                            ]
                        )
                        if len(current_embedding) > 1
                        else 1.0
                    ),
                )

                chunk = Chunk(text=chunk_text, metadata=metadata)
                chunk.embedding = np.mean(current_embedding, axis=0)
                chunks.append(chunk)

                # Start new chunk
                start_position = end_position
                current_chunk = [sentences[i]]
                current_embedding = [embeddings[i]]

        # Handle remaining sentences
        if current_chunk:
            chunk_text = " ".join(current_chunk)
            metadata = ChunkMetadata(
                chunk_id=self.generate_chunk_id(
                    chunk_text, ChunkingStrategy.SEMANTIC_SIMILARITY
                ),
                strategy=ChunkingStrategy.SEMANTIC_SIMILARITY,
                start_position=start_position,
                end_position=start_position + len(chunk_text),
                token_count=self.count_tokens(chunk_text),
                sentence_count=len(current_chunk),
                semantic_score=1.0,
            )

            chunk = Chunk(text=chunk_text, metadata=metadata)
            chunk.embedding = np.mean(current_embedding, axis=0)
            chunks.append(chunk)

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
        strategies: List[ChunkingStrategy] = None,
        custom_params: Dict[str, Dict] = None,
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
            try:
                params = {
                    **self.default_params.get(strategy.value, {}),
                    **custom_params.get(strategy.value, {}),
                }

                if strategy == ChunkingStrategy.FIXED_SIZE:
                    chunks = self.fixed_size_chunking(text, **params)
                elif strategy == ChunkingStrategy.SENTENCE_BOUNDARY:
                    chunks = self.sentence_boundary_chunking(text, **params)
                elif strategy == ChunkingStrategy.SEMANTIC_SIMILARITY:
                    chunks = self.semantic_similarity_chunking(text, **params)
                elif strategy == ChunkingStrategy.STRUCTURAL:
                    chunks = self.structural_chunking(text)
                elif strategy == ChunkingStrategy.SLIDING_WINDOW:
                    chunks = self.sliding_window_chunking(text, **params)
                elif strategy == ChunkingStrategy.TOPIC_BASED:
                    chunks = self.topic_based_chunking(text, **params)
                else:
                    logger.warning(f"Unknown strategy: {strategy}")
                    continue

                results[strategy] = chunks
                logger.info(f"Applied {strategy.value}: {len(chunks)} chunks")

            except Exception as e:
                logger.error(f"Error applying {strategy.value}: {e}")
                continue

        return results

    def get_best_chunks(
        self,
        hybrid_results: Dict[ChunkingStrategy, List[Chunk]],
        selection_criteria: str = "balanced",
    ) -> List[Chunk]:
        """
        Select the best chunks from hybrid results

        Args:
            hybrid_results: Results from hybrid_chunk()
            selection_criteria: 'balanced', 'semantic', 'structural', or 'size'

        Returns:
            List of selected chunks
        """
        if selection_criteria == "balanced":
            # Take a mix of different strategies
            selected_chunks = []
            for strategy, chunks in hybrid_results.items():
                # Take top chunks from each strategy
                n_chunks = max(1, len(chunks) // 3)
                selected_chunks.extend(chunks[:n_chunks])
            return selected_chunks

        elif selection_criteria == "semantic":
            # Prefer semantic similarity chunks
            if ChunkingStrategy.SEMANTIC_SIMILARITY in hybrid_results:
                return hybrid_results[ChunkingStrategy.SEMANTIC_SIMILARITY]
            elif ChunkingStrategy.TOPIC_BASED in hybrid_results:
                return hybrid_results[ChunkingStrategy.TOPIC_BASED]
            else:
                return list(hybrid_results.values())[0]

        elif selection_criteria == "structural":
            # Prefer structural chunks
            if ChunkingStrategy.STRUCTURAL in hybrid_results:
                return hybrid_results[ChunkingStrategy.STRUCTURAL]
            else:
                return hybrid_results[ChunkingStrategy.SENTENCE_BOUNDARY]

        elif selection_criteria == "size":
            # Prefer fixed-size chunks
            if ChunkingStrategy.FIXED_SIZE in hybrid_results:
                return hybrid_results[ChunkingStrategy.FIXED_SIZE]
            elif ChunkingStrategy.SLIDING_WINDOW in hybrid_results:
                return hybrid_results[ChunkingStrategy.SLIDING_WINDOW]
            else:
                return list(hybrid_results.values())[0]

        else:
            # Default: return first available strategy
            return list(hybrid_results.values())[0]
