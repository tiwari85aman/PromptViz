# ============================================
# PromptViz Dockerfile
# Multi-stage build for frontend + backend
# ============================================

# --------------------------------------------
# Stage 1: Build React Frontend
# --------------------------------------------
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy package files first for better caching
COPY frontend/package*.json ./

# Install dependencies
RUN npm ci --silent

# Copy frontend source
COPY frontend/ ./

# Build the React app
RUN npm run build

# --------------------------------------------
# Stage 2: Python Backend + Nginx
# --------------------------------------------
FROM python:3.11-slim

# Install nginx, supervisor, and curl for healthcheck
RUN apt-get update && apt-get install -y \
    nginx \
    supervisor \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy backend requirements and install Python dependencies
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy backend source code
COPY backend/ ./backend/

# Copy built frontend from builder stage
COPY --from=frontend-builder /app/frontend/build /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy supervisor configuration
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Create data directory for SQLite database
RUN mkdir -p /app/backend/data

# Environment variables with defaults
# API keys default to empty - supervisor requires all referenced env vars to exist
ENV FLASK_ENV=production \
    PORT=5001 \
    LITELLM_MODEL=gemini/gemini-2.0-flash \
    LITELLM_TIMEOUT=60 \
    GEMINI_API_KEY="" \
    OPENAI_API_KEY="" \
    ANTHROPIC_API_KEY=""

# Expose ports (80 for nginx, 5001 for API)
EXPOSE 80 5001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/api/health || exit 1

# Start supervisor to manage nginx and gunicorn
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
