import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Base configuration class"""
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    DEBUG = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
    
    # API Keys by Provider
    OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
    ANTHROPIC_API_KEY = os.environ.get('ANTHROPIC_API_KEY')
    GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')
    
    # LiteLLM Configuration
    LITELLM_MODEL = os.environ.get('LITELLM_MODEL', 'gemini/gemini-2.5-flash-lite')
    LITELLM_TIMEOUT = int(os.environ.get('LITELLM_TIMEOUT', '60'))
    
    # File Upload Configuration
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size
    ALLOWED_EXTENSIONS = {'txt', 'md', 'markdown'}
    
    # API Configuration
    API_TITLE = 'PromptViz API'
    API_VERSION = 'v1'
    API_DESCRIPTION = 'AI-powered system prompt visualization API'
    
    # Supported AI Models (ordered by preference within each provider)
    SUPPORTED_MODELS = [
        # Google models (Gemini) - ordered by preference
        {"name": "gemini/gemini-2.0-flash", "provider": "google"},
        {"name": "gemini/gemini-2.5-flash-lite", "provider": "google"},
        {"name": "gemini/gemini-1.5-pro", "provider": "google"},
        {"name": "gemini/gemini-1.5-flash", "provider": "google"},
        # OpenAI models - ordered by preference
        {"name": "gpt-4", "provider": "openai"},
        {"name": "gpt-4-turbo", "provider": "openai"},
        {"name": "gpt-3.5-turbo", "provider": "openai"},
        {"name": "o1-preview", "provider": "openai"},
        {"name": "o1-mini", "provider": "openai"},
        # Anthropic models - ordered by preference
        {"name": "claude-3-5-sonnet-20241022", "provider": "anthropic"},
        {"name": "claude-3-opus-20240229", "provider": "anthropic"},
        {"name": "claude-3-sonnet-20240229", "provider": "anthropic"},
        {"name": "claude-3-haiku-20240307", "provider": "anthropic"},
    ]

class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True

class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False

class TestingConfig(Config):
    """Testing configuration"""
    TESTING = True
    DEBUG = True

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
} 