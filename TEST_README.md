# RAG Pipeline Test Suite

This directory contains standardized test scripts for the RAG (Retrieval-Augmented Generation) pipeline. All tests are designed to be consistent and non-conflicting.

## Test Scripts Overview

### 1. `test_standardized.py` - **RECOMMENDED FOR CURRENT TESTING**
- **Purpose**: Tests current functionality with correct API endpoints
- **Scope**: API connectivity, chunking, batch upload, question answering, projects
- **Status**: ✅ Ready for current testing
- **Usage**: `python test_standardized.py`

### 2. `test_pipeline.py` - **Direct Component Testing**
- **Purpose**: Tests individual components directly (without API endpoints)
- **Scope**: Chunking, embedding pipeline, vector search, ChromaDB query
- **Status**: ✅ Ready for component testing
- **Usage**: `python test_pipeline.py`

### 3. `test_full_pipeline.py` - **Future API Testing**
- **Purpose**: Tests complete pipeline through API endpoints (for future use)
- **Scope**: Full API endpoint testing when all endpoints are implemented
- **Status**: ⚠️ For future use when endpoints are fully implemented
- **Usage**: `python test_full_pipeline.py`

## Standardized Configuration

All test scripts use consistent configuration:

```python
BASE_URL = "http://localhost:8002"
API_PREFIX = "/api"
TEST_DOC_PATH = "test_document.txt"
```

## Available API Endpoints

Based on the current backend implementation:

- `GET /api/test` - API connectivity test
- `POST /api/chunk` - Text chunking
- `POST /api/batch-upload` - Batch file upload and processing
- `POST /api/ask` - Question answering
- `GET /api/projects` - List projects
- `GET /api/projects/{project_id}/files` - List project files
- `DELETE /api/projects/{project_id}` - Delete project
- `DELETE /api/files/{file_id}` - Delete file

## Test Categories

### 🔌 API Connectivity Tests
- Basic server connectivity
- Endpoint availability
- Response format validation

### ✂️ Chunking Tests
- Text chunking with hybrid strategy
- Chunk size and overlap validation
- Metadata preservation

### 📤 Upload Tests
- Single file upload
- Batch file upload
- File processing pipeline

### ❓ Question Answering Tests
- Query processing
- Vector search
- Answer generation (with placeholder OpenAI key)

### 📁 Project Management Tests
- Project listing
- File management
- Status checking

## Running Tests

### Prerequisites
1. Ensure the FastAPI server is running: `python -m uvicorn backend.main:app --host 0.0.0.0 --port 8002 --reload`
2. Install required dependencies: `pip install aiohttp`

### Quick Start
```bash
# Test current functionality (recommended)
python test_standardized.py

# Test individual components
python test_pipeline.py

# Test API endpoints (future use)
python test_full_pipeline.py
```

## Test Results

All tests provide:
- ✅ Clear pass/fail indicators
- 📊 Detailed test summaries
- 🧹 Automatic cleanup of test files
- 📝 Error details for failed tests

## Expected Behavior

### Current State (Without Full Database/API Implementation)
- **Component tests** (`test_pipeline.py`) should pass if core logic is working
- **API tests** may fail for unimplemented endpoints (this is expected)
- **Standardized tests** (`test_standardized.py`) will test what's currently available

### Future State (With Full Implementation)
- All tests should pass
- Real database integration
- Complete API endpoint coverage
- Production-ready error handling

## Troubleshooting

### Common Issues
1. **Server not running**: Ensure FastAPI server is running on port 8002
2. **Missing dependencies**: Install aiohttp with `pip install aiohttp`
3. **ChromaDB conflicts**: Clear ChromaDB directory if needed
4. **Import errors**: Ensure all backend modules are properly installed

### Test File Cleanup
All test scripts automatically clean up temporary files. If cleanup fails:
```bash
# Manual cleanup
rm -f test_*.txt
rm -f test_document.txt
```

## Development Notes

- All test scripts use consistent naming conventions
- Test data is isolated and doesn't conflict between scripts
- Error handling is standardized across all tests
- Results are formatted consistently for easy reading

## Next Steps

1. **Current**: Use `test_standardized.py` for testing available functionality
2. **Component Testing**: Use `test_pipeline.py` for testing individual components
3. **Future**: Use `test_full_pipeline.py` when all endpoints are implemented
4. **Production**: Add real database integration and authentication tests

---

**Note**: This test suite is designed to be non-conflicting and standardized. All scripts follow the same patterns and use consistent configurations. 