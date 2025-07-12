#!/usr/bin/env python3
"""
Direct Component Test Script for RAG Pipeline
Tests individual components directly (chunking, embedding, storage, retrieval)
Use this for testing core logic without API endpoints
"""

import asyncio
import json
import os
from backend.services.embedding_pipeline import embed_and_store_chunks
from backend.services.chunking_service import chunking_service
from backend.hybrid_chunking import ChunkingStrategy

class DirectComponentTester:
    """Direct component testing without API endpoints"""
    
    def __init__(self):
        self.test_doc_path = "test_direct_components.txt"
        
    def create_test_document(self):
        """Create a test document for direct component testing"""
        content = """
        Introduction to Machine Learning

        Machine learning is a subset of artificial intelligence that enables computers to learn and make decisions without being explicitly programmed. It focuses on developing algorithms that can access data and use it to learn for themselves.

        Types of Machine Learning

        There are three main types of machine learning: supervised learning, unsupervised learning, and reinforcement learning. Supervised learning uses labeled training data to learn patterns and make predictions. Unsupervised learning finds hidden patterns in unlabeled data. Reinforcement learning learns through interaction with an environment.

        Applications of Machine Learning

        Machine learning has numerous applications across various industries. In healthcare, it's used for disease diagnosis and drug discovery. In finance, it helps with fraud detection and risk assessment. In transportation, it powers self-driving cars and traffic prediction systems.
        """
        
        with open(self.test_doc_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"✅ Created test document: {self.test_doc_path}")
    
    def test_chunking(self):
        """Test chunking functionality directly"""
        print("\n1️⃣ Testing Chunking Component...")
        try:
            with open(self.test_doc_path, 'r', encoding='utf-8') as f:
                test_content = f.read()
            
            chunks = chunking_service.chunk_text(
                text=test_content,
                strategy=ChunkingStrategy.HYBRID,
                chunk_size=200,
                overlap=50,
                file_metadata={
                    'file_id': 'test-file-1',
                    'project_id': 'test-project',
                    'file_name': self.test_doc_path
                }
            )
            
            print(f"   ✅ Created {len(chunks)} chunks")
            print(f"   📊 Chunk sizes: {[len(chunk.text) for chunk in chunks[:3]]}...")
            return True, len(chunks)
            
        except Exception as e:
            print(f"   ❌ Chunking failed: {e}")
            return False, 0
    
    async def test_embedding_pipeline(self):
        """Test embedding pipeline directly"""
        print("\n2️⃣ Testing Embedding Pipeline...")
        try:
            result = await embed_and_store_chunks(
                file_path=self.test_doc_path,
                project_id='test-project',
                strategy=ChunkingStrategy.HYBRID,
                chunk_size=200,
                overlap=50,
                file_id='test-file-1'
            )
            
            if result["success"]:
                print(f"   ✅ Successfully processed file")
                print(f"   📊 Created {result['chunks_created']} chunks")
                print(f"   📏 Total text length: {result['total_text_length']}")
                print(f"   🎯 Strategy used: {result['strategy']}")
                return True, result
            else:
                print(f"   ❌ Embedding pipeline failed: {result['error']}")
                return False, result
                
        except Exception as e:
            print(f"   ❌ Error: {e}")
            return False, {"error": str(e)}
    
    def test_vector_search(self):
        """Test vector search functionality"""
        print("\n3️⃣ Testing Vector Search...")
        try:
            from backend.services.embedding_pipeline import embedding_pipeline
            
            search_results = embedding_pipeline.search_similar_chunks(
                query="What are the three main types of machine learning?",
                project_id='test-project',
                n_results=3
            )
            
            if search_results:
                print(f"   ✅ Found {len(search_results)} relevant chunks")
                print(f"   🎯 Top result similarity: {search_results[0]['similarity_score']:.3f}")
                print(f"   📝 Top chunk preview: {search_results[0]['text'][:100]}...")
                return True, len(search_results)
            else:
                print("   ❌ No search results found")
                return False, 0
                
        except Exception as e:
            print(f"   ❌ Vector search failed: {e}")
            return False, 0
    
    def test_chromadb_query(self):
        """Test direct ChromaDB query"""
        print("\n4️⃣ Testing ChromaDB Query...")
        try:
            from sentence_transformers import SentenceTransformer
            import chromadb
            
            # Get the question embedding
            bi_encoder = SentenceTransformer("all-MiniLM-L6-v2")
            question = "What are the three main types of machine learning?"
            question_emb = bi_encoder.encode([question])[0]
            
            # Query ChromaDB
            chroma_client = chromadb.PersistentClient(path="./chroma_db_test")
            collection = chroma_client.get_collection("documents")
            results = collection.query(
                query_embeddings=[question_emb],
                n_results=3,
                include=["documents", "metadatas"]
            )
            
            if results['documents'] and results['documents'][0] and results['metadatas'] and results['metadatas'][0]:
                candidate_chunks = [
                    {"text": doc, "metadata": meta}
                    for doc, meta in zip(results["documents"][0], results["metadatas"][0])
                ]
                
                print(f"   ✅ Retrieved {len(candidate_chunks)} chunks from ChromaDB")
                print(f"   📝 Context: {candidate_chunks[0]['text'][:150]}...")
                return True, len(candidate_chunks)
            else:
                print("   ❌ No results found in ChromaDB")
                return False, 0
                
        except Exception as e:
            print(f"   ❌ ChromaDB query failed: {e}")
            return False, 0
    
    async def run_complete_test(self):
        """Run complete direct component test"""
        print("🧪 Testing RAG Pipeline Components (Direct)")
        print("=" * 60)
        
        # Create test document
        self.create_test_document()
        
        test_results = []
        
        # Test 1: Chunking
        chunking_success, chunk_count = self.test_chunking()
        test_results.append(chunking_success)
        
        # Test 2: Embedding Pipeline
        embedding_success, embedding_result = await self.test_embedding_pipeline()
        test_results.append(embedding_success)
        
        # Test 3: Vector Search
        search_success, search_count = self.test_vector_search()
        test_results.append(search_success)
        
        # Test 4: ChromaDB Query
        chroma_success, chroma_count = self.test_chromadb_query()
        test_results.append(chroma_success)
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 DIRECT COMPONENT TEST SUMMARY")
        print("=" * 60)
        
        tests = [
            "Chunking Component",
            "Embedding Pipeline", 
            "Vector Search",
            "ChromaDB Query"
        ]
        
        passed = sum(test_results)
        total = len(test_results)
        
        for i, (test_name, result) in enumerate(zip(tests, test_results)):
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{i+1}. {test_name}: {status}")
        
        print(f"\nOverall: {passed}/{total} tests passed")
        
        if passed == total:
            print("🎉 ALL COMPONENT TESTS PASSED!")
            print("✅ Chunking ✅ Embedding ✅ Storage ✅ Retrieval")
        else:
            print("⚠️ Some component tests failed. Check the output above for details.")
        
        # Cleanup
        if os.path.exists(self.test_doc_path):
            os.remove(self.test_doc_path)
            print(f"🧹 Cleaned up test document: {self.test_doc_path}")

async def main():
    """Main test runner"""
    tester = DirectComponentTester()
    await tester.run_complete_test()

if __name__ == "__main__":
    asyncio.run(main()) 