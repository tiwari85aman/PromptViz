# PromptViz Backend - MVP Foundation

## 🎯 Overview

This is the MVP backend foundation for PromptViz, an AI-powered system prompt visualization application. The backend provides a Flask API that integrates with LiteLLM to generate Mermaid diagrams from user prompts using intelligent AI analysis.

## 🏗️ Architecture

### Core Components
- **Flask API**: RESTful API with Flask-restx for automatic documentation
- **LiteLLM Integration**: Multi-model AI support for diagram generation
- **System Prompt Architecture**: AI-driven analysis without custom parsing logic
- **File Upload Support**: Text, .txt, and .md file processing

### Technology Stack
- Python 3.9+
- Flask 3.0.0
- Flask-restx for API documentation
- LiteLLM for AI model integration
- Pydantic for data validation
- Flask-CORS for cross-origin support

## 🚀 Quick Start

### 1. Environment Setup
```bash
# Copy environment file
cp env.example .env

# Edit .env with your API keys
nano .env
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Set Environment Variables
```bash
# Required: Set your OpenAI API key
export OPENAI_API_KEY="your-api-key-here"

# Optional: Customize other settings
export LITELLM_MODEL="gpt-4"
export FLASK_DEBUG="True"
```

### 4. Run the Application
```bash
# Development mode
python run.py

# Production mode
gunicorn -w 4 -b 0.0.0.0:5000 run:app
```

## 📡 API Endpoints

### Core Endpoints

#### `POST /api/generate-diagram`
Generate Mermaid diagram from text prompt.

**Request Body:**
```json
{
  "prompt": "Your system prompt text here...",
  "model": "gpt-4",
  "diagram_type": "flowchart"
}
```

**Response:**
```json
{
  "mermaid_code": "flowchart TD\n    A[Start] --> B[Process]",
  "success": true,
  "model_used": "gpt-4",
  "processing_time": 2.5,
  "error_message": null
}
```

#### `POST /api/upload-file`
Generate Mermaid diagram from uploaded file.

**Form Data:**
- `file`: Text file (.txt, .md, .markdown)
- `model`: AI model to use (optional)
- `diagram_type`: Type of diagram (optional)

#### `GET /api/health`
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00",
  "version": "1.0.0"
}
```

#### `GET /api/models`
Get available AI models.

#### `POST /api/validate-key`
Validate API key for a specific model.

#### `GET /api/system-prompts`
Get available system prompts.

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | Your OpenAI API key | Required |
| `LITELLM_MODEL` | Default AI model | `gpt-4` |
| `LITELLM_TIMEOUT` | API timeout in seconds | `60` |
| `FLASK_ENV` | Flask environment | `development` |
| `FLASK_DEBUG` | Debug mode | `False` |
| `SECRET_KEY` | Flask secret key | Auto-generated |

### File Upload Settings
- **Max file size**: 16MB
- **Allowed extensions**: `.txt`, `.md`, `.markdown`
- **Encoding**: UTF-8 required

## 🧠 AI Integration

### System Prompt Architecture
The backend uses a sophisticated system prompt approach:

1. **No Custom Parsing**: Eliminates rule-based parsing logic
2. **AI-Driven Analysis**: Uses LiteLLM with carefully crafted system prompts
3. **Intelligent Generation**: AI models understand and visualize prompt structures
4. **Mermaid Output**: Generates renderable Mermaid diagram code

### Supported Models
- OpenAI: GPT-4, GPT-3.5-turbo
- Anthropic: Claude-3-Opus, Claude-3-Sonnet
- Google: Gemini Pro

## 📁 Project Structure

```
backend/
├── app/
│   ├── __init__.py          # Flask app factory
│   ├── api/
│   │   ├── __init__.py      # API package
│   │   ├── routes.py        # API endpoints
│   │   └── models.py        # Data models
│   ├── core/
│   │   ├── __init__.py      # Core package
│   │   ├── llm_client.py    # LiteLLM integration
│   │   └── system_prompts/  # System prompt files
│   └── utils/
│       ├── __init__.py      # Utils package
│       └── helpers.py       # Utility functions
├── config.py                # Configuration
├── run.py                   # Application runner
├── requirements.txt         # Dependencies
├── env.example             # Environment template
└── README.md               # This file
```

## 🧪 Testing

### Manual Testing
```bash
# Test health endpoint
curl http://localhost:5001/api/health

# Test diagram generation
curl -X POST http://localhost:5001/api/generate-diagram \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Create a simple workflow with start, process, and end steps"}'
```

### API Documentation
Once running, visit `http://localhost:5001/` for interactive API documentation powered by Swagger UI.

## 🚨 Error Handling

The API includes comprehensive error handling:

- **400 Bad Request**: Invalid input data
- **413 Payload Too Large**: File size exceeds limit
- **500 Internal Server Error**: Server-side processing errors
- **Graceful Degradation**: Continues operation even if LLM service is unavailable

## 🔒 Security Features

- **File Validation**: Secure filename handling and extension validation
- **Input Sanitization**: Prompt text validation and sanitization
- **CORS Configuration**: Configurable cross-origin resource sharing
- **No File Storage**: Files are processed in memory, not stored

## 📈 Performance

- **Async Processing**: Non-blocking API calls
- **Timeout Handling**: Configurable API timeouts
- **Memory Efficient**: No persistent file storage
- **Response Caching**: Built-in response optimization

## 🚀 Deployment

### Development
```bash
python run.py
```

### Production
```bash
gunicorn -w 4 -b 0.0.0.0:5000 run:app
```

### Docker (Future)
```bash
docker build -t promptviz-backend .
docker run -p 5000:5000 promptviz-backend
```

## 🔮 Future Enhancements

- **Multi-model Support**: Dynamic model switching
- **Advanced Prompts**: Multiple system prompt types
- **Caching Layer**: Redis integration for response caching
- **Rate Limiting**: API usage throttling
- **Monitoring**: Health metrics and logging

## 🆘 Troubleshooting

### Common Issues

1. **LLM Client Initialization Failed**
   - Check your API key in `.env`
   - Verify internet connectivity
   - Ensure API key has sufficient credits

2. **File Upload Errors**
   - Check file size (max 16MB)
   - Verify file extension (.txt, .md, .markdown)
   - Ensure UTF-8 encoding

3. **API Timeouts**
   - Increase `LITELLM_TIMEOUT` in `.env`
   - Check network connectivity
   - Verify API service status

## 📚 Additional Resources

- [Flask Documentation](https://flask.palletsprojects.com/)
- [Flask-restx Documentation](https://flask-restx.readthedocs.io/)
- [LiteLLM Documentation](https://docs.litellm.ai/)
- [Mermaid.js Documentation](https://mermaid.js.org/)

## 🤝 Contributing

This is the MVP foundation. Future contributions will be welcome once the basic architecture is established and tested.

---

**Status**: ✅ MVP Backend Foundation Complete
**Next Phase**: Basic Frontend Interface 