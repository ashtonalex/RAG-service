"""
Configuration settings for the RAG service.
Centralizes all service parameters, model configurations, and chunking settings.
"""

import os
from typing import Dict, Any

class Config:
    """Centralized configuration for the RAG service."""
    
    # ChromaDB Configuration
    CHROMA_PERSIST_DIRECTORY = os.getenv("CHROMA_PERSIST_DIRECTORY", "./chroma_db")
    CHROMA_COLLECTION_NAME = os.getenv("CHROMA_COLLECTION_NAME", "documents")
    
    # Chunking Configuration
    DEFAULT_CHUNK_SIZE = int(os.getenv("DEFAULT_CHUNK_SIZE", "1000"))
    DEFAULT_OVERLAP = int(os.getenv("DEFAULT_OVERLAP", "200"))
    DEFAULT_STRATEGY = os.getenv("DEFAULT_STRATEGY", "fixed_size")
    
    # Embedding Model Configuration
    EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
    CROSS_ENCODER_MODEL = os.getenv("CROSS_ENCODER_MODEL", "cross-encoder/ms-marco-MiniLM-L-6-v2")
    
    # Retrieval Configuration
    DEFAULT_TOP_K = int(os.getenv("DEFAULT_TOP_K", "20"))
    SIMILARITY_THRESHOLD = float(os.getenv("SIMILARITY_THRESHOLD", "0.7"))
    
    # OpenAI Configuration
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
    OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-3.5-turbo")
    OPENAI_MAX_TOKENS = int(os.getenv("OPENAI_MAX_TOKENS", "512"))
    OPENAI_TEMPERATURE = float(os.getenv("OPENAI_TEMPERATURE", "0.2"))
    
    # File Processing Configuration
    SUPPORTED_FILE_TYPES = [".pdf", ".docx", ".txt", ".md"]
    MAX_FILE_SIZE = int(os.getenv("MAX_FILE_SIZE", "50")) * 1024 * 1024  # 50MB default
    
    # API Configuration
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
    
    @classmethod
    def get_chunking_config(cls) -> Dict[str, Any]:
        """Get chunking configuration parameters."""
        return {
            "default_chunk_size": cls.DEFAULT_CHUNK_SIZE,
            "default_overlap": cls.DEFAULT_OVERLAP,
            "default_strategy": cls.DEFAULT_STRATEGY
        }
    
    @classmethod
    def get_embedding_config(cls) -> Dict[str, Any]:
        """Get embedding configuration parameters."""
        return {
            "embedding_model": cls.EMBEDDING_MODEL,
            "cross_encoder_model": cls.CROSS_ENCODER_MODEL
        }
    
    @classmethod
    def get_retrieval_config(cls) -> Dict[str, Any]:
        """Get retrieval configuration parameters."""
        return {
            "default_top_k": cls.DEFAULT_TOP_K,
            "similarity_threshold": cls.SIMILARITY_THRESHOLD
        }
    
    @classmethod
    def get_openai_config(cls) -> Dict[str, Any]:
        """Get OpenAI configuration parameters."""
        return {
            "api_key": cls.OPENAI_API_KEY,
            "model": cls.OPENAI_MODEL,
            "max_tokens": cls.OPENAI_MAX_TOKENS,
            "temperature": cls.OPENAI_TEMPERATURE
        } 