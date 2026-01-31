#!/bin/bash

# PromptViz Backend Startup Script

echo "🚀 Starting PromptViz Backend..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📥 Installing dependencies..."
pip install -r requirements.txt

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Creating from template..."
    cp env.example .env
    echo "📝 Please edit .env file with your API keys before continuing."
    echo "   Required: OPENAI_API_KEY"
    echo "   Press Enter when ready to continue..."
    read
fi

# Start the backend
echo "🌐 Starting Flask backend..."
echo "   API will be available at: http://localhost:5001"
echo "   Swagger docs at: http://localhost:5001/"
echo "   Press Ctrl+C to stop"
echo ""

python run.py 