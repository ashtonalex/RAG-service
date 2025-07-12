# RAG Service Integration Guide

## Overview

This document describes the integration of the hybrid chunking system with the vector embedding pipeline in the RAG service. The integration provides a unified, modular approach to document processing, chunking, and embedding.

## Architecture

### Components

1. **ChunkingService** (`backend/services/chunking_service.py`)
   - Unified interface for all chunking operations
   - Integrates with `HybridChunker` for multiple strategies
   - Preserves rich metadata for embedding pipeline

2. **EmbeddingPipeline** (`backend/services/embedding_pipeline.py`)
   - Handles document processing and embedding generation
   - Uses `ChunkingService` for text chunking
   - Stores embeddings and metadata in ChromaDB

3. **HybridChunker** (`backend/hybrid_chunking.py`)
   - Core chunking algorithms (fixed-size, semantic, hybrid)
   - Rich metadata preservation
   - Multiple strategy support

4. **Configuration** (`backend/config.py`)
   - Centralized configuration management
   - Environment variable support
   - Service parameter configuration

## Integration Flow

### Document Upload Process

```
1. File Upload → 2. Text Extraction → 3. Chunking → 4. Embedding → 5. Storage
```

**Detailed Steps:**

1. **File Upload** (`/api/batch-upload`)
   - Accepts files with project ID and chunking strategy
   - Validates file types and sizes

2. **Text Extraction**
   - Converts files to PDF if needed
   - Extracts text using appropriate methods

3. **Chunking** (via `ChunkingService`)
   - Uses specified strategy (fixed-size, semantic, hybrid)
   - Generates chunks with rich metadata
   - Preserves file and project information

4. **Embedding Generation**
   - Uses sentence-transformers for embedding generation
   - Creates embeddings for each chunk

5. **Vector Storage**
   - Stores embeddings, text, and metadata in ChromaDB
   - Maintains chunk relationships and source information

### Question Answering Process

```
1. Question → 2. Embedding → 3. Vector Search → 4. Reranking → 5. Answer Generation
```

**Detailed Steps:**

1. **Question Processing**
   - Embeds the question using the same model as chunks

2. **Vector Search**
   - Queries ChromaDB for similar chunks
   - Returns top-k candidates

3. **Reranking** (via cross-encoder)
   - Uses cross-encoder to rerank candidates
   - Improves retrieval accuracy

4. **Answer Generation**
   - Assembles context from top chunks
   - Generates answer using OpenAI LLM
   - Includes source attribution

## API Endpoints

### `/api/chunk` (POST)
Advanced chunking endpoint with rich metadata.

**Parameters:**
- `text` (str): Text to chunk
- `strategy` (str): Chunking strategy (fixed_size, semantic, hybrid)
- `chunk_size` (int, optional): Override default chunk size
- `overlap` (int, optional): Override default overlap

**Response:**
```json
{
  "chunks": [
    {
      "text": "chunk text",
      "metadata": {
        "chunk_index": 0,
        "start_pos": 0,
        "end_pos": 100,
        "total_chunks": 5,
        "chunk_size": 100
      }
    }
  ],
  "stats": {
    "total_chunks": 5,
    "total_text_length": 500,
    "average_chunk_size": 100,
    "min_chunk_size": 80,
    "max_chunk_size": 120
  },
  "strategy": "fixed_size"
}
```

### `/api/batch-upload` (POST)
File upload with integrated chunking and embedding.

**Parameters:**
- `projectId` (str): Project identifier
- `files` (List[File]): Files to upload
- `strategy` (str, optional): Chunking strategy

**Response:**
```json
{
  "results": [
    {
      "fileId": "uuid",
      "filename": "document.pdf",
      "chunks_created": 15,
      "total_text_length": 5000,
      "strategy": "hybrid",
      "stats": {
        "total_chunks": 15,
        "average_chunk_size": 333
      }
    }
  ],
  "errors": []
}
```

### `/api/ask` (POST)
Question answering with retrieval and generation.

**Parameters:**
```json
{
  "projectId": "project-123",
  "question": "What is the main topic?"
}
```

**Response:**
```json
{
  "answer": "The main topic is...",
  "sources": [
    {
      "text": "source chunk text",
      "metadata": {
        "file_name": "document.pdf",
        "chunk_index": 2
      },
      "similarity_score": 0.85
    }
  ]
}
```

## Configuration

### Environment Variables

```bash
# Chunking Configuration
DEFAULT_CHUNK_SIZE=1000
DEFAULT_OVERLAP=200
DEFAULT_STRATEGY=fixed_size

# Embedding Configuration
EMBEDDING_MODEL=all-MiniLM-L6-v2
CROSS_ENCODER_MODEL=cross-encoder/ms-marco-MiniLM-L-6-v2

# Retrieval Configuration
DEFAULT_TOP_K=20
SIMILARITY_THRESHOLD=0.7

# OpenAI Configuration
OPENAI_API_KEY=your-api-key
OPENAI_MODEL=gpt-3.5-turbo
OPENAI_MAX_TOKENS=512
OPENAI_TEMPERATURE=0.2

# ChromaDB Configuration
CHROMA_PERSIST_DIRECTORY=./chroma_db
CHROMA_COLLECTION_NAME=documents
```

## Chunking Strategies

### 1. Fixed-Size Chunking
- Splits text into fixed-size chunks
- Configurable chunk size and overlap
- Good for consistent processing

### 2. Semantic Chunking
- Splits at paragraph boundaries
- Preserves semantic meaning
- Better for context preservation

### 3. Hybrid Chunking
- Combines semantic and fixed-size approaches
- Uses semantic boundaries first
- Splits large chunks with fixed-size method
- Best balance of context and consistency

## Metadata Preservation

Each chunk preserves rich metadata:

```python
@dataclass
class ChunkMetadata:
    chunk_index: int          # Position in document
    start_pos: int           # Start position in original text
    end_pos: int             # End position in original text
    total_chunks: int        # Total chunks in document
    file_id: Optional[str]   # Source file ID
    project_id: Optional[str] # Project ID
    extra: Dict[str, Any]    # Additional metadata
```

## Performance Considerations

### Chunking Performance
- **Fixed-size**: Fastest, predictable performance
- **Semantic**: Moderate speed, better quality
- **Hybrid**: Slower, best quality

### Embedding Performance
- Batch processing for multiple chunks
- Caching for repeated embeddings
- Configurable batch sizes

### Storage Optimization
- Efficient metadata storage
- Indexed queries for fast retrieval
- Compression for large datasets

## Error Handling

### Chunking Errors
- Invalid strategy handling
- Empty text handling
- Strategy fallback mechanisms

### Embedding Errors
- Model loading failures
- API rate limiting
- Memory management

### Storage Errors
- ChromaDB connection issues
- Duplicate handling
- Data validation

## Testing

### Unit Tests
- Chunking strategy validation
- Metadata preservation
- Error handling

### Integration Tests
- End-to-end document processing
- API endpoint functionality
- Performance benchmarks

### Load Tests
- Large document processing
- Concurrent uploads
- Query performance

## Future Enhancements

### Planned Features
1. **Advanced Chunking Strategies**
   - Topic-based chunking
   - Entity-aware chunking
   - Multi-language support

2. **Enhanced Metadata**
   - Semantic similarity scores
   - Content type classification
   - Temporal information

3. **Performance Optimizations**
   - Streaming chunking
   - Parallel processing
   - Caching layers

4. **Integration Points**
   - External chunking services
   - Multiple vector databases
   - Cross-encoder microservices

## Troubleshooting

### Common Issues

1. **Chunking Strategy Not Found**
   - Verify strategy enum values
   - Check configuration settings

2. **Embedding Generation Failures**
   - Verify model availability
   - Check memory constraints

3. **ChromaDB Connection Issues**
   - Verify database path
   - Check permissions

4. **Metadata Loss**
   - Verify chunking service integration
   - Check data serialization

### Debug Mode

Enable debug logging:

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review configuration settings
3. Verify environment setup
4. Contact the development team 