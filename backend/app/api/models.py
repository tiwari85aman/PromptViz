from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, Index, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class GenerateDiagramRequest(BaseModel):
    """Request model for diagram generation"""
    prompt: str = Field(..., description="Text prompt to visualize", min_length=1)
    model: Optional[str] = Field(default="gpt-4", description="AI model to use")
    diagram_type: Optional[str] = Field(default="flowchart", description="Type of diagram to generate")

class FileUploadRequest(BaseModel):
    """Request model for file upload"""
    file_content: str = Field(..., description="Content of uploaded file")
    filename: str = Field(..., description="Name of uploaded file")
    model: Optional[str] = Field(default="gpt-4", description="AI model to use")
    diagram_type: Optional[str] = Field(default="flowchart", description="Type of diagram to generate")

class GenerateDiagramResponse(BaseModel):
    """Response model for diagram generation"""
    mermaid_code: str = Field(..., description="Generated Mermaid diagram code")
    success: bool = Field(..., description="Whether the generation was successful")
    ai_model_used: str = Field(..., description="AI model that was used")  # Renamed to avoid conflict
    processing_time: Optional[float] = Field(None, description="Time taken to process in seconds")
    error_message: Optional[str] = Field(None, description="Error message if generation failed")
    
    class Config:
        protected_namespaces = ()  # Disable protected namespace warnings

class HealthResponse(BaseModel):
    """Health check response"""
    status: str = Field(..., description="Service status")
    timestamp: datetime = Field(..., description="Current timestamp")
    version: str = Field(..., description="API version")

class ModelInfo(BaseModel):
    """AI model information"""
    name: str = Field(..., description="Model name")
    provider: str = Field(..., description="Model provider")
    available: bool = Field(..., description="Whether model is available")

class ModelsResponse(BaseModel):
    """Available models response"""
    models: List[ModelInfo] = Field(..., description="List of available models")

class SystemPromptInfo(BaseModel):
    """System prompt information"""
    name: str = Field(..., description="Prompt name")
    description: str = Field(..., description="Prompt description")
    type: str = Field(..., description="Prompt type")

class SystemPromptsResponse(BaseModel):
    """Available system prompts response"""
    available_prompts: List[SystemPromptInfo] = Field(..., description="List of available system prompts")


# Pydantic models for prompt generation
class DiagramNode(BaseModel):
    """Node structure for diagram"""
    id: str = Field(..., description="Node ID")
    type: str = Field(..., description="Node type (rectangle, diamond, rounded, etc.)")
    label: str = Field(..., description="Node label text")
    position: Optional[Dict[str, float]] = Field(None, description="Node position {x, y}")

class DiagramEdge(BaseModel):
    """Edge structure for diagram"""
    id: str = Field(..., description="Edge ID")
    source: str = Field(..., description="Source node ID")
    target: str = Field(..., description="Target node ID")
    label: Optional[str] = Field(None, description="Edge label")

class DiagramStructure(BaseModel):
    """Complete diagram structure"""
    nodes: List[DiagramNode] = Field(..., description="List of diagram nodes")
    edges: List[DiagramEdge] = Field(..., description="List of diagram edges")

class GeneratePromptRequest(BaseModel):
    """Request model for prompt generation from diagram"""
    diagram_structure: DiagramStructure = Field(..., description="Diagram structure with nodes and edges")
    original_prompt: Optional[str] = Field(None, description="Original prompt used to generate the diagram")
    prompt_format: str = Field(default="xml", description="Output format: 'xml' or 'markdown'")
    model: Optional[str] = Field(default="gpt-4", description="AI model to use")
    diagram_id: Optional[int] = Field(None, description="ID of the source diagram if available")

class GeneratePromptResponse(BaseModel):
    """Response model for prompt generation"""
    id: int = Field(..., description="Generated prompt ID")
    generated_prompt: str = Field(..., description="The generated prompt text")
    prompt_format: str = Field(..., description="Format of the generated prompt")
    success: bool = Field(..., description="Whether generation was successful")
    ai_model_used: str = Field(..., description="AI model that was used")
    processing_time: Optional[float] = Field(None, description="Time taken to process in seconds")
    error_message: Optional[str] = Field(None, description="Error message if generation failed")

    class Config:
        protected_namespaces = ()


# SQLAlchemy Database Models
class Diagram(Base):
    """SQLAlchemy model for storing generated diagrams"""
    __tablename__ = 'diagrams'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    mermaid_code = Column(Text, nullable=False)
    original_prompt = Column(Text, nullable=False)
    model_used = Column(String(100), nullable=False)
    diagram_type = Column(String(50), nullable=False)
    processing_time = Column(Float, nullable=True)
    success = Column(Boolean, nullable=False, default=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Indexes for better query performance
    __table_args__ = (
        Index('idx_diagrams_created_at', 'created_at'),
        Index('idx_diagrams_model_used', 'model_used'),
        Index('idx_diagrams_diagram_type', 'diagram_type'),
    )
    
    def to_dict(self):
        """Convert model instance to dictionary"""
        return {
            'id': self.id,
            'mermaid_code': self.mermaid_code,
            'original_prompt': self.original_prompt,
            'model_used': self.model_used,
            'diagram_type': self.diagram_type,
            'processing_time': self.processing_time,
            'success': self.success,
            'error_message': self.error_message,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }


class GeneratedPrompt(Base):
    """SQLAlchemy model for storing generated prompts from diagrams"""
    __tablename__ = 'generated_prompts'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    diagram_id = Column(Integer, ForeignKey('diagrams.id'), nullable=True)
    diagram_structure = Column(Text, nullable=False)  # JSON string of nodes/edges
    original_prompt = Column(Text, nullable=True)
    generated_prompt = Column(Text, nullable=False)
    prompt_format = Column(String(20), nullable=False)  # 'xml' or 'markdown'
    model_used = Column(String(100), nullable=False)
    processing_time = Column(Float, nullable=True)
    success = Column(Boolean, nullable=False, default=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationship to Diagram
    diagram = relationship("Diagram", backref="generated_prompts")
    
    # Indexes for better query performance
    __table_args__ = (
        Index('idx_generated_prompts_created_at', 'created_at'),
        Index('idx_generated_prompts_diagram_id', 'diagram_id'),
        Index('idx_generated_prompts_format', 'prompt_format'),
    )
    
    def to_dict(self):
        """Convert model instance to dictionary"""
        return {
            'id': self.id,
            'diagram_id': self.diagram_id,
            'diagram_structure': self.diagram_structure,
            'original_prompt': self.original_prompt,
            'generated_prompt': self.generated_prompt,
            'prompt_format': self.prompt_format,
            'model_used': self.model_used,
            'processing_time': self.processing_time,
            'success': self.success,
            'error_message': self.error_message,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        } 