#!/usr/bin/env python3
"""
API Endpoint Test Script for RAG Pipeline
Tests the complete pipeline through API endpoints
NOTE: This script is for future use when all endpoints are fully implemented
"""

import asyncio
import aiohttp
import json
import os
from pathlib import Path

# Standardized Configuration
BASE_URL = "http://localhost:8002"
API_PREFIX = "/api"
TEST_DOC_PATH = "test_api_endpoints.txt"

class APIEndpointTester:
    """API endpoint testing for RAG pipeline"""
    
    def __init__(self):
        self.base_url = BASE_URL
        self.api_prefix = API_PREFIX
        self.test_doc_path = TEST_DOC_PATH
        self.project_id = None
        self.file_id = None
        
    async def create_test_document(self):
        """Create a test document for API testing"""
        content = """
        Artificial Intelligence and Machine Learning
        
        Artificial Intelligence (AI) is a branch of computer science that aims to create intelligent machines that work and react like humans. 
        Some of the activities computers with artificial intelligence are designed for include speech recognition, learning, planning, and problem solving.
        
        Machine Learning is a subset of AI that provides systems the ability to automatically learn and improve from experience without being explicitly programmed. 
        Machine learning focuses on the development of computer programs that can access data and use it to learn for themselves.
        
        Deep Learning is a subset of machine learning that uses neural networks with multiple layers to model and understand complex patterns. 
        It has been particularly successful in areas like image recognition, natural language processing, and speech recognition.
        
        Natural Language Processing (NLP) is a field of AI that gives machines the ability to read, understand, and derive meaning from human languages. 
        It combines computational linguistics with statistical, machine learning, and deep learning models.
        
        Computer Vision is another important field of AI that trains computers to interpret and understand the visual world. 
        Using digital images from cameras and videos and deep learning models, machines can accurately identify and classify objects.
        """
        
        with open(self.test_doc_path, "w", encoding="utf-8") as f:
            f.write(content)
        
        print(f"✅ Created test document: {self.test_doc_path}")
        print("⚠️ NOTE: This script tests API endpoints that may not be fully implemented yet")

    async def test_api_connectivity(self, session):
        """Test basic API connectivity"""
        print("\n🔌 Testing API Connectivity...")
        try:
            async with session.get(f"{self.base_url}{self.api_prefix}/test") as response:
                if response.status == 200:
                    result = await response.json()
                    print(f"✅ API is accessible: {result.get('message', 'OK')}")
                    return True
                else:
                    print(f"❌ API connectivity failed: {response.status}")
                    return False
        except Exception as e:
            print(f"❌ API connectivity error: {e}")
            return False

    async def test_chunking_endpoint(self, session):
        """Test the chunking endpoint"""
        print("\n✂️ Testing Chunking Endpoint...")
        try:
            with open(self.test_doc_path, "r", encoding="utf-8") as f:
                content = f.read()
            
            chunk_data = {
                "text": content,
                "strategy": "hybrid",
                "chunk_size": 200,
                "overlap": 50,
                "file_metadata": {
                    "file_id": "test-file-1",
                    "project_id": "test-project",
                    "file_name": self.test_doc_path
                }
            }
            
            async with session.post(f"{self.base_url}{self.api_prefix}/chunk", json=chunk_data) as response:
                if response.status == 200:
                    result = await response.json()
                    print(f"✅ Chunking successful: {len(result.get('chunks', []))} chunks created")
                    return True
                else:
                    print(f"❌ Chunking failed: {response.status}")
                    error_text = await response.text()
                    print(f"Error details: {error_text}")
                    return False
        except Exception as e:
            print(f"❌ Chunking error: {e}")
            return False

    async def test_batch_upload(self, session):
        """Test batch upload functionality"""
        print("\n📤 Testing Batch Upload...")
        try:
            with open(self.test_doc_path, "rb") as f:
                files = {"files": (self.test_doc_path, f, "text/plain")}
                data = {
                    "project_id": "test-project",
                    "strategy": "hybrid",
                    "chunk_size": 200,
                    "overlap": 50
                }
                
                async with session.post(f"{self.base_url}{self.api_prefix}/batch-upload", data=data, files=files) as response:
                    if response.status == 200:
                        result = await response.json()
                        print(f"✅ Batch upload successful: {result.get('message', 'OK')}")
                        return True
                    else:
                        print(f"❌ Batch upload failed: {response.status}")
                        error_text = await response.text()
                        print(f"Error details: {error_text}")
                        return False
        except Exception as e:
            print(f"❌ Batch upload error: {e}")
            return False

    async def test_question_answering(self, session):
        """Test question answering endpoint"""
        print("\n❓ Testing Question Answering...")
        try:
            question_data = {
                "question": "What is machine learning and how does it relate to artificial intelligence?",
                "project_id": "test-project",
                "max_results": 5
            }
            
            async with session.post(f"{self.base_url}{self.api_prefix}/ask", json=question_data) as response:
                if response.status == 200:
                    result = await response.json()
                    print(f"✅ Question answering successful")
                    print(f"Answer: {result.get('answer', 'No answer generated')}")
                    print(f"Sources: {len(result.get('sources', []))} found")
                    return True
                else:
                    print(f"❌ Question answering failed: {response.status}")
                    error_text = await response.text()
                    print(f"Error details: {error_text}")
                    return False
        except Exception as e:
            print(f"❌ Question answering error: {e}")
            return False

    async def test_projects_endpoint(self, session):
        """Test projects endpoint"""
        print("\n📁 Testing Projects Endpoint...")
        try:
            async with session.get(f"{self.base_url}{self.api_prefix}/projects") as response:
                if response.status == 200:
                    result = await response.json()
                    print(f"✅ Projects endpoint accessible: {len(result.get('projects', []))} projects found")
                    return True
                else:
                    print(f"❌ Projects endpoint failed: {response.status}")
                    return False
        except Exception as e:
            print(f"❌ Projects endpoint error: {e}")
            return False

    async def run_api_test(self):
        """Run API endpoint test"""
        print("🚀 Starting API Endpoint Test")
        print("=" * 60)
        print("⚠️ NOTE: This script tests API endpoints that may not be fully implemented yet")
        print("   Use test_standardized.py for current functionality testing")
        print("=" * 60)
        
        # Create test document
        await self.create_test_document()
        
        async with aiohttp.ClientSession() as session:
            test_results = []
            
            # Test 1: API Connectivity
            test_results.append(await self.test_api_connectivity(session))
            
            # Test 2: Chunking Endpoint
            test_results.append(await self.test_chunking_endpoint(session))
            
            # Test 3: Batch Upload
            test_results.append(await self.test_batch_upload(session))
            
            # Test 4: Question Answering
            test_results.append(await self.test_question_answering(session))
            
            # Test 5: Projects Endpoint
            test_results.append(await self.test_projects_endpoint(session))
            
            # Summary
            print("\n" + "=" * 60)
            print("📊 API ENDPOINT TEST SUMMARY")
            print("=" * 60)
            
            tests = [
                "API Connectivity",
                "Chunking Endpoint", 
                "Batch Upload",
                "Question Answering",
                "Projects Endpoint"
            ]
            
            passed = sum(test_results)
            total = len(test_results)
            
            for i, (test_name, result) in enumerate(zip(tests, test_results)):
                status = "✅ PASS" if result else "❌ FAIL"
                print(f"{i+1}. {test_name}: {status}")
            
            print(f"\nOverall: {passed}/{total} tests passed")
            
            if passed == total:
                print("🎉 ALL API TESTS PASSED!")
            else:
                print("⚠️ Some API tests failed. This is expected if endpoints are not fully implemented.")
                print("   Use test_standardized.py for current functionality testing.")
            
            # Cleanup
            if os.path.exists(self.test_doc_path):
                os.remove(self.test_doc_path)
                print(f"🧹 Cleaned up test document: {self.test_doc_path}")

async def main():
    """Main test runner"""
    tester = APIEndpointTester()
    await tester.run_api_test()

if __name__ == "__main__":
    asyncio.run(main()) 