# PromptViz API Documentation

## 🎯 Overview

The PromptViz API provides AI-powered system prompt visualization through intelligent analysis and Mermaid diagram generation. This API eliminates the need for custom parsing logic by leveraging AI models with sophisticated system prompts.

## 🔗 Base URL

```
http://localhost:5001/api
```

## 📡 Endpoints

### 1. Health Check

**Endpoint:** `GET /api/health`

**Description:** Check if the API is running and healthy.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00",
  "version": "1.0.0"
}
```

**Status Codes:**
- `200 OK`: Service is healthy

---

### 2. Generate Diagram from Text

**Endpoint:** `POST /api/generate-diagram`

**Description:** Generate a Mermaid diagram from a text prompt using AI analysis.

**Request Body:**
```json
{
  "prompt": "Your system prompt text here...",
  "model": "gpt-4",
  "diagram_type": "flowchart"
}
```

**Parameters:**
- `prompt` (required): The text prompt to visualize
- `model` (optional): AI model to use (default: "gpt-4")
- `diagram_type` (optional): Type of diagram (default: "flowchart")

**Response:**
```json
{
  "mermaid_code": "flowchart TD\n    A[Start] --> B[Process]\n    B --> C[End]",
  "success": true,
  "model_used": "gpt-4",
  "processing_time": 2.5,
  "error_message": null
}
```

**Status Codes:**
- `200 OK`: Diagram generated successfully
- `400 Bad Request`: Invalid input data
- `500 Internal Server Error`: Processing error

---

### 3. Generate Diagram from File

**Endpoint:** `POST /api/upload-file`

**Description:** Generate a Mermaid diagram from an uploaded file.

**Request:** Multipart form data

**Form Fields:**
- `file` (required): Text file (.txt, .md, .markdown)
- `model` (optional): AI model to use
- `diagram_type` (optional): Type of diagram

**File Requirements:**
- **Max size:** 16MB
- **Allowed extensions:** .txt, .md, .markdown
- **Encoding:** UTF-8

**Response:** Same as text generation endpoint

**Status Codes:**
- `200 OK`: Diagram generated successfully
- `400 Bad Request`: Invalid file or data
- `413 Payload Too Large`: File too large
- `500 Internal Server Error`: Processing error

---

### 4. Get Available Models

**Endpoint:** `GET /api/models`

**Description:** Get list of available AI models.

**Response:**
```json
{
  "models": [
    {
      "name": "gpt-4",
      "provider": "openai",
      "available": true
    },
    {
      "name": "gpt-3.5-turbo",
      "provider": "openai",
      "available": true
    }
  ]
}
```

**Status Codes:**
- `200 OK`: Models retrieved successfully
- `500 Internal Server Error`: Service error

---

### 5. Validate API Key

**Endpoint:** `POST /api/validate-key`

**Description:** Validate an API key for a specific model.

**Request Body:**
```json
{
  "model": "gpt-4",
  "api_key": "your-api-key-here"
}
```

**Response:**
```json
{
  "valid": true,
  "error": null
}
```

**Status Codes:**
- `200 OK`: Validation completed
- `400 Bad Request`: Missing parameters
- `500 Internal Server Error`: Service error

---

### 6. Get System Prompts

**Endpoint:** `GET /api/system-prompts`

**Description:** Get available system prompts.

**Response:**
```json
{
  "available_prompts": [
    {
      "name": "Mermaid Expert",
      "description": "Expert system prompt analyzer and Mermaid diagram generator",
      "type": "diagram_generation"
    }
  ]
}
```

**Status Codes:**
- `200 OK`: Prompts retrieved successfully
- `500 Internal Server Error`: Service error

## 🔧 Error Handling

### Error Response Format
```json
{
  "error": "Description of the error"
}
```

### Common Error Codes

| Status Code | Description |
|-------------|-------------|
| `400` | Bad Request - Invalid input data |
| `413` | Payload Too Large - File exceeds size limit |
| `500` | Internal Server Error - Server-side processing error |

### Error Scenarios

1. **Invalid Prompt Text**
   - Text too short (< 10 characters)
   - Empty or null text
   - Invalid characters

2. **File Upload Issues**
   - Unsupported file type
   - File too large
   - Encoding issues

3. **LLM Service Issues**
   - API key not configured
   - Service unavailable
   - Timeout errors

## 🧠 AI Integration Details

### System Prompt Architecture

The API uses a sophisticated system prompt approach:

1. **No Custom Parsing**: Eliminates rule-based parsing logic entirely
2. **AI-Driven Analysis**: Uses LiteLLM with carefully crafted system prompts
3. **Intelligent Generation**: AI models understand and visualize prompt structures
4. **Mermaid Output**: Generates renderable Mermaid diagram code

### Supported Models

| Provider | Models | Status |
|----------|--------|--------|
| OpenAI | GPT-4, GPT-3.5-turbo | ✅ Available |
| Anthropic | Claude-3-Opus, Claude-3-Sonnet | ✅ Available |
| Google | Gemini Pro | ✅ Available |

### Processing Flow

```
User Input → System Prompt + User Prompt → LiteLLM → AI Analysis → Mermaid Code
```

## 📊 Rate Limits & Performance

- **Timeout**: Configurable (default: 60 seconds)
- **File Size**: Max 16MB
- **Concurrent Requests**: Limited by server capacity
- **Response Time**: Typically 2-10 seconds depending on prompt complexity

## 🔒 Security Features

- **Input Validation**: Comprehensive input sanitization
- **File Security**: Secure filename handling and extension validation
- **CORS**: Configurable cross-origin resource sharing
- **No Storage**: Files processed in memory, not stored

## 🧪 Testing Examples

### cURL Examples

**Health Check:**
```bash
curl http://localhost:5001/api/health
```

**Generate Diagram:**
```bash
curl -X POST http://localhost:5001/api/generate-diagram \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Create a simple workflow with start, process, and end steps"}'
```

**Upload File:**
```bash
curl -X POST http://localhost:5001/api/upload-file \
  -F "file=@your_file.txt" \
  -F "model=gpt-4"
```

### Python Examples

**Health Check:**
```python
import requests

response = requests.get("http://localhost:5001/api/health")
print(response.json())
```

**Generate Diagram:**
```python
import requests

data = {
    "prompt": "Create a simple workflow with start, process, and end steps",
    "model": "gpt-4",
    "diagram_type": "flowchart"
}

response = requests.post(
    "http://localhost:5001/api/generate-diagram",
    json=data
)

result = response.json()
if result['success']:
    print(f"Mermaid Code: {result['mermaid_code']}")
else:
    print(f"Error: {result['error_message']}")
```

## 📚 Additional Resources

- **Swagger UI**: Available at `http://localhost:5001/` when running
- **Backend README**: See `README.md` for setup instructions
- **System Prompts**: Located in `app/core/system_prompts/`

## 🚀 Next Steps

1. **Set API Key**: Configure `OPENAI_API_KEY` in your `.env` file
2. **Test Endpoints**: Use the provided examples to test functionality
3. **Frontend Integration**: Connect your frontend to these API endpoints
4. **Customization**: Modify system prompts for different use cases

---

**API Version:** 1.0.0  
**Last Updated:** January 2024  
**Status:** MVP Complete ✅ 