import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session
from sqlalchemy.ext.declarative import declarative_base
from config import Config

# Base class for declarative models
Base = declarative_base()

# Database path
DB_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'data')
DB_PATH = os.path.join(DB_DIR, 'diagrams.db')

# Ensure data directory exists
os.makedirs(DB_DIR, exist_ok=True)

# Create SQLite engine
engine = create_engine(
    f'sqlite:///{DB_PATH}',
    connect_args={'check_same_thread': False},  # Needed for SQLite
    echo=False  # Set to True for SQL query logging
)

# Create session factory
SessionLocal = scoped_session(sessionmaker(autocommit=False, autoflush=False, bind=engine))

def get_db():
    """Get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Initialize database - create all tables"""
    from app.api.models import Diagram, GeneratedPrompt  # Import here to avoid circular imports
    Base.metadata.create_all(bind=engine)

def close_db():
    """Close database connections"""
    SessionLocal.remove()
