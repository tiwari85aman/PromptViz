import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Base configuration class"""
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    DEBUG = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
    
    # LiteLLM Configuration
    LITELLM_API_KEY = os.environ.get('GEMINI_API_KEY')  # Default to OpenAI
    LITELLM_MODEL = os.environ.get('LITELLM_MODEL', 'gemini-2.5-flash-lite')
    LITELLM_TIMEOUT = int(os.environ.get('LITELLM_TIMEOUT', '60'))
    
    # File Upload Configuration
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size
    ALLOWED_EXTENSIONS = {'txt', 'md', 'markdown'}
    
    # API Configuration
    API_TITLE = 'PromptViz API'
    API_VERSION = 'v1'
    API_DESCRIPTION = 'AI-powered system prompt visualization API'

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