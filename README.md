<div align="center">

# 🔮 PromptViz

### *See the logic behind the prompts*

<br />

**Stop reading walls of text. Start seeing the structure.**

Your 500-line system prompt? One click → Interactive diagram.

<br />

[Get Started](#-quick-start) · [See Features](#-features) · [API Docs](backend/API_DOCUMENTATION.md)

<br />

[![React](https://img.shields.io/badge/React-19.1-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://reactjs.org/)
[![Flask](https://img.shields.io/badge/Flask-3.0-000000?style=for-the-badge&logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

<br />

<!-- 
🎬 Add your demo GIF here!
![PromptViz Demo](docs/demo.gif)
-->

</div>

<br />

---

<br />

## 💡 The Problem

Ever tried to understand someone else's mega system prompt? Or explain yours to a teammate?

```
"So first it checks if the user is authenticated, then it branches into 
three different modes depending on the context, and each mode has its 
own set of rules, but there are also these global constraints that..."
```

**Yeah. We've all been there.**

<br />

## ⚡ The Solution

Paste your prompt. Pick your AI model. Click generate.

```
System Prompt → AI Analysis → Interactive Diagram
```

That's it. No parsing rules to configure. No manual diagramming. The AI reads your prompt like a human would—and draws what it sees.

<br />

<div align="center">

| Input | Output |
|:-----:|:------:|
| 📝 Your complex prompt | 🎨 Beautiful Mermaid diagram |
| 🤖 GPT-4, Claude, Gemini | 🔄 Flowcharts, Sequences, States |
| 📁 .txt or .md files | ✏️ Editable, zoomable, exportable |

</div>

<br />

---

<br />

## 🎯 Why Developers Love It

<table>
<tr>
<td width="50%">

### 🧠 AI Does The Thinking
No regex. No custom parsers. Drop in any prompt—structured or chaotic—and let GPT-4/Claude figure out the logic flow.

</td>
<td width="50%">

### ⚡ Stupidly Fast
Paste → Click → Done. Average generation time: 3-5 seconds. Your diagram history auto-saves for quick access.

</td>
</tr>
<tr>
<td width="50%">

### 🔌 Multi-Model Flexibility  
Bring your own API key. Switch between OpenAI, Anthropic, or Google models on the fly via LiteLLM.

</td>
<td width="50%">

### 🎨 Actually Useful Output
Not just static images. Get interactive React Flow diagrams you can pan, zoom, edit, and export as Mermaid code.

</td>
</tr>
</table>

<br />

---

## ✨ Features

<details>
<summary><b>🧠 Smart Diagram Generation</b></summary>
<br />

- Intelligent AI analysis of prompt structure, decision trees, and workflows
- 5 diagram types: Flowchart, Sequence, State, Class, Entity Relationship
- Auto-detects the best visualization approach for your content

</details>

<details>
<summary><b>🎨 Modern, Responsive Interface</b></summary>
<br />

- Real-time preview with diagram ↔ code toggle
- Drag & drop file upload (`.txt`, `.md`)
- Interactive canvas: pan, zoom, edit nodes
- Works beautifully on desktop, tablet, and mobile

</details>

<details>
<summary><b>📚 Built-in History</b></summary>
<br />

- Auto-saves every diagram to local SQLite database
- Quick-load any previous generation
- Edit prompts and regenerate on the fly

</details>

<details>
<summary><b>♿ Accessibility First</b></summary>
<br />

- WCAG 2.1 AA compliant
- Full keyboard navigation (`Cmd+Enter` to generate, `Cmd+\`` to toggle view)
- Screen reader support & reduced motion preferences

</details>

<br />

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      PromptViz                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────┐         ┌─────────────────────────┐   │
│  │    Frontend     │   API   │        Backend          │   │
│  │  React + TS     │◄───────►│   Flask + LiteLLM       │   │
│  │  Tailwind CSS   │         │   SQLAlchemy            │   │
│  │  React Flow     │         └──────────┬──────────────┘   │
│  │  Mermaid.js     │                    │                   │
│  └─────────────────┘                    ▼                   │
│                              ┌─────────────────────────┐   │
│                              │     AI Providers        │   │
│                              │  OpenAI │ Anthropic     │   │
│                              │  Google │ ...           │   │
│                              └─────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 19 | UI Framework |
| TypeScript | Type Safety |
| Tailwind CSS | Styling |
| React Flow | Interactive Diagrams |
| Mermaid.js | Diagram Rendering |
| Axios | API Communication |
| Lucide React | Icons |

### Backend
| Technology | Purpose |
|------------|---------|
| Flask 3.0 | Web Framework |
| Flask-RESTX | API Documentation |
| LiteLLM | Multi-model AI Integration |
| SQLAlchemy | Database ORM |
| Pydantic | Data Validation |
| Gunicorn | Production Server |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 16+ (for frontend)
- **Python** 3.9+ (for backend)
- **API Key** from OpenAI, Anthropic, or Google AI

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/PromptViz.git
cd PromptViz
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp env.example .env
# Edit .env with your API keys
```

**Configure `.env`:**
```env
FLASK_ENV=development
FLASK_DEBUG=True
SECRET_KEY=your-secret-key-here
OPENAI_API_KEY=your-openai-api-key
LITELLM_MODEL=gpt-4
LITELLM_TIMEOUT=60
PORT=5001
```

**Start the backend:**
```bash
python run.py
```

The API will be available at `http://localhost:5001`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

The app will open at `http://localhost:3000`

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/generate-diagram` | Generate diagram from text |
| `POST` | `/api/upload-file` | Generate diagram from file |
| `GET` | `/api/models` | List available AI models |
| `POST` | `/api/validate-key` | Validate API key |
| `GET` | `/api/system-prompts` | Get available system prompts |
| `GET` | `/api/diagrams` | List saved diagrams |
| `GET` | `/api/diagrams/{id}` | Get specific diagram |
| `DELETE` | `/api/diagrams/{id}` | Delete diagram |

For detailed API documentation, see [backend/API_DOCUMENTATION.md](backend/API_DOCUMENTATION.md) or visit `http://localhost:5001/` when the server is running.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + Enter` | Generate diagram |
| `Cmd/Ctrl + \`` | Toggle diagram/code view |
| `Tab` | Navigate elements |
| `Space/Enter` | Activate buttons |

---

## 📁 Project Structure

```
PromptViz/
├── backend/
│   ├── app/
│   │   ├── api/             # API routes and models
│   │   ├── core/            # LLM client and system prompts
│   │   └── utils/           # Helper functions
│   ├── data/                # SQLite database
│   ├── config.py            # Configuration
│   ├── run.py               # Application entry
│   └── requirements.txt     # Python dependencies
│
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── hooks/           # Custom hooks
│   │   ├── services/        # API client
│   │   ├── types/           # TypeScript types
│   │   └── utils/           # Utility functions
│   ├── public/              # Static assets
│   └── package.json         # Node dependencies
│
└── README.md                # This file
```

---

## 🎨 Supported Diagram Types

- **Flowchart**: General process flows and decision trees
- **Sequence Diagram**: Interaction between components/actors
- **State Diagram**: State machines and transitions
- **Class Diagram**: Object-oriented structures
- **Entity Relationship**: Database schemas

---

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | OpenAI API key | Required* |
| `ANTHROPIC_API_KEY` | Anthropic API key | Optional |
| `GEMINI_API_KEY` | Google AI API key | Optional |
| `LITELLM_MODEL` | Default AI model | `gpt-4` |
| `LITELLM_TIMEOUT` | API timeout (seconds) | `60` |
| `FLASK_DEBUG` | Enable debug mode | `False` |
| `SECRET_KEY` | Flask secret key | Auto-generated |

*At least one AI provider API key is required.

---

## 🚢 Deployment

### Development

```bash
# Backend
cd backend && python run.py

# Frontend
cd frontend && npm start
```

### Production

```bash
# Backend with Gunicorn
cd backend && gunicorn -w 4 -b 0.0.0.0:5001 run:app

# Frontend build
cd frontend && npm run build
# Serve the build/ directory with your preferred static server
```

---

## 🧪 Testing

### Backend
```bash
cd backend
python test_backend.py
```

### Frontend
```bash
cd frontend
npm test
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Mermaid.js](https://mermaid.js.org/) for diagram rendering
- [React Flow](https://reactflow.dev/) for interactive node-based diagrams
- [LiteLLM](https://docs.litellm.ai/) for unified AI model access
- [Tailwind CSS](https://tailwindcss.com/) for styling

---

<div align="center">

**Built with ❤️ for better prompt visualization**

[Report Bug](https://github.com/yourusername/PromptViz/issues) · [Request Feature](https://github.com/yourusername/PromptViz/issues)

<br />

---

**Created by [Aman Tiwari](https://github.com/tiwari85aman)**

</div>
