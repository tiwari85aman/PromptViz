from flask import Flask
from flask_cors import CORS
from flask_restx import Api
from config import config
from app.api.routes import api
from app.core.database import init_db

def create_app(config_name='default'):
    """Application factory function"""
    app = Flask(__name__)
    
    # Load configuration
    app.config.from_object(config[config_name])
    
    # Initialize CORS
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    
    # Initialize database
    init_db()
    
    # Initialize API with Flask-restx
    api_instance = Api(
        app,
        title='PromptViz API',
        version='1.0',
        description='AI-powered system prompt visualization API',
        doc='/'
    )
    
    # Add the API namespace
    api_instance.add_namespace(api)
    
    # Register error handlers
    @app.errorhandler(404)
    def not_found(error):
        return {'error': 'Not found'}, 404
    
    @app.errorhandler(500)
    def internal_error(error):
        return {'error': 'Internal server error'}, 500
    
    @app.errorhandler(413)
    def too_large(error):
        return {'error': 'File too large'}, 413
    
    return app 