import os
import json
import asyncio
from typing import List, Dict, Any, Optional
from pathlib import Path
import chromadb
from chromadb.config import Settings
import hashlib
from datetime import datetime

# Import local modules
from backend.file_conversion import convert_to_pdf
from backend.metadata_store import add_file, update_file_status
from backend.services.chunking_service import chunking_service
from backend.hybrid_chunking import ChunkingStrategy

class EmbeddingPipeline:
    def __init__(self, chroma_persist_directory: str = "./chroma_db_new"):
        """Initialize the embedding pipeline with ChromaDB client."""
        self.chroma_persist_directory = chroma_persist_directory
        self.client = chromadb.Client(
            settings=Settings(anonymized_telemetry=False)
        )
        # Removed MetadataStore usage
        
        # Get or create collections
        self.documents_collection = self.client.get_or_create_collection(
            name="documents",
            metadata={"hnsw:space": "cosine"}
        )
        
    def _generate_chunk_id(self, file_path: str, chunk_index: int) -> str:
        """Generate a unique ID for a chunk."""
        file_hash = hashlib.md5(file_path.encode()).hexdigest()
        return f"{file_hash}_{chunk_index}"
    
    def _extract_text_from_pdf(self, pdf_path: str) -> str:
        """Extract text from PDF file."""
        try:
            import PyPDF2
            text = ""
            with open(pdf_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                for page in pdf_reader.pages:
                    text += page.extract_text() + "\n"
            return text
        except ImportError:
            raise ImportError("PyPDF2 is required for PDF text extraction. Install with: pip install PyPDF2")
        except Exception as e:
            raise Exception(f"Error extracting text from PDF: {e}")
    
    # Removed hybrid_chunk_text method - now using unified chunking service
    
    async def embed_and_store_chunks(
        self, 
        file_path: str, 
        project_id: str,
        strategy: ChunkingStrategy = ChunkingStrategy.FIXED_SIZE,
        chunk_size: int = 1000,
        overlap: int = 200,
        file_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Process a file: convert to PDF, extract text, chunk, embed, and store.
        
        Args:
            file_path: Path to the input file
            project_id: ID of the project this file belongs to
            strategy: Chunking strategy to use
            chunk_size: Target chunk size for text chunking
            overlap: Overlap between chunks
            file_id: Optional file ID for metadata
            
        Returns:
            Dictionary with processing results
        """
        try:
            # Convert file to PDF if needed
            pdf_path = await convert_to_pdf(file_path)
            
            # Extract text from PDF
            text = self._extract_text_from_pdf(pdf_path)
            
            if not text.strip():
                return {
                    "success": False,
                    "error": "No text content extracted from file",
                    "chunks_created": 0
                }
            
            # Prepare file metadata for chunking
            file_metadata = {
                'file_id': file_id,
                'project_id': project_id,
                'file_path': file_path,
                'file_name': Path(file_path).name,
                'file_hash': hashlib.md5(file_path.encode()).hexdigest(),
                'total_text_length': len(text)
            }
            
            # Use unified chunking service
            chunks = chunking_service.chunk_text(
                text=text,
                strategy=strategy,
                chunk_size=chunk_size,
                overlap=overlap,
                file_metadata=file_metadata
            )
            
            if not chunks:
                return {
                    "success": False,
                    "error": "No chunks created from text",
                    "chunks_created": 0
                }
            
            # Prepare chunks for embedding and storage
            chunk_data = chunking_service.prepare_chunks_for_embedding(chunks)
            
            # Generate embeddings for chunks (using sentence-transformers)
            from sentence_transformers import SentenceTransformer
            embedder = SentenceTransformer("all-MiniLM-L6-v2")
            embeddings = embedder.encode(chunk_data["texts"])
            
            # Store in ChromaDB with embeddings
            self.documents_collection.add(
                ids=chunk_data["ids"],
                embeddings=embeddings.tolist(),
                documents=chunk_data["texts"],
                metadatas=chunk_data["metadatas"]
            )
            
            # Get chunking statistics
            stats = chunking_service.get_chunking_stats(chunks)
            
            # Clean up temporary PDF if it was created
            if pdf_path != file_path and os.path.exists(pdf_path):
                os.remove(pdf_path)
            
            return {
                "success": True,
                "chunks_created": len(chunks),
                "total_text_length": len(text),
                "file_name": file_metadata['file_name'],
                "project_id": project_id,
                "strategy": strategy.value,
                "stats": stats
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "chunks_created": 0
            }
    
    def search_similar_chunks(
        self, 
        query: str, 
        project_id: Optional[str] = None,
        n_results: int = 10,
        similarity_threshold: float = 0.7
    ) -> List[Dict[str, Any]]:
        """
        Search for similar chunks using embedding similarity.
        
        Args:
            query: Search query
            project_id: Optional project ID to filter results
            n_results: Number of results to return
            similarity_threshold: Minimum similarity score
            
        Returns:
            List of similar chunks with metadata
        """
        try:
            # Prepare where clause for filtering
            where_clause = {}
            if project_id:
                where_clause["project_id"] = project_id
            
            # Search in ChromaDB
            results = self.documents_collection.query(
                query_texts=[query],
                n_results=n_results,
                where=where_clause if where_clause else None
            )
            
            # Process results
            similar_chunks = []
            if results['ids'] and results['ids'][0]:
                for i, chunk_id in enumerate(results['ids'][0]):
                    similarity_score = results['distances'][0][i] if results['distances'] else 0
                    
                    # Convert distance to similarity score (ChromaDB uses cosine distance)
                    similarity = 1 - similarity_score
                    
                    if similarity >= similarity_threshold:
                        chunk_data = {
                            "chunk_id": chunk_id,
                            "text": results['documents'][0][i],
                            "metadata": results['metadatas'][0][i],
                            "similarity_score": similarity
                        }
                        similar_chunks.append(chunk_data)
            
            # Sort by similarity score (descending)
            similar_chunks.sort(key=lambda x: x['similarity_score'], reverse=True)
            
            return similar_chunks
            
        except Exception as e:
            print(f"Error searching chunks: {e}")
            return []
    
    def get_collection_stats(self) -> Dict[str, Any]:
        """Get statistics about the ChromaDB collection."""
        try:
            count = self.documents_collection.count()
            return {
                "total_chunks": count,
                "collection_name": "documents"
            }
        except Exception as e:
            return {
                "error": str(e),
                "total_chunks": 0
            }

# Global instance
embedding_pipeline = EmbeddingPipeline()

# Convenience function for the main app
async def embed_and_store_chunks(file_path: str, project_id: str, **kwargs):
    """Convenience function to embed and store chunks."""
    return await embedding_pipeline.embed_and_store_chunks(file_path, project_id, **kwargs) 