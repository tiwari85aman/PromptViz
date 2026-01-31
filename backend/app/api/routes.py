import os
import json
from flask import request, jsonify
from flask_restx import Namespace, Resource, fields
from werkzeug.utils import secure_filename
from app.core.llm_client import LiteLLMClient
from app.utils.helpers import allowed_file, validate_prompt_text
from app.api.models import (
    GenerateDiagramRequest, GenerateDiagramResponse, HealthResponse,
    ModelsResponse, SystemPromptsResponse, Diagram, GeneratedPrompt,
    GeneratePromptRequest
)
from app.core.database import get_db
from config import Config

# Initialize API namespace
api = Namespace('api', description='PromptViz API endpoints')

# Initialize LiteLLM client
try:
    llm_client = LiteLLMClient()
except Exception as e:
    print(f"Warning: LiteLLM client initialization failed: {e}")
    llm_client = None

# API Models for Swagger documentation
generate_diagram_model = api.model('GenerateDiagram', {
    'prompt': fields.String(required=True, description='Text prompt to visualize'),
    'model': fields.String(description='AI model to use'),
    'diagram_type': fields.String(description='Type of diagram to generate')
})

generate_diagram_response = api.model('GenerateDiagramResponse', {
    'mermaid_code': fields.String(description='Generated Mermaid diagram code'),
    'success': fields.Boolean(description='Whether the generation was successful'),
    'ai_model_used': fields.String(description='AI model that was used'),
    'processing_time': fields.Float(description='Time taken to process in seconds'),
    'error_message': fields.String(description='Error message if generation failed')
})

# API Models for prompt generation
diagram_node_model = api.model('DiagramNode', {
    'id': fields.String(required=True, description='Node ID'),
    'type': fields.String(required=True, description='Node type'),
    'label': fields.String(required=True, description='Node label'),
    'position': fields.Raw(description='Node position {x, y}')
})

diagram_edge_model = api.model('DiagramEdge', {
    'id': fields.String(required=True, description='Edge ID'),
    'source': fields.String(required=True, description='Source node ID'),
    'target': fields.String(required=True, description='Target node ID'),
    'label': fields.String(description='Edge label')
})

diagram_structure_model = api.model('DiagramStructure', {
    'nodes': fields.List(fields.Nested(diagram_node_model), required=True),
    'edges': fields.List(fields.Nested(diagram_edge_model), required=True)
})

generate_prompt_model = api.model('GeneratePrompt', {
    'diagram_structure': fields.Nested(diagram_structure_model, required=True),
    'original_prompt': fields.String(description='Original prompt that generated the diagram'),
    'prompt_format': fields.String(description='Output format: xml or markdown', default='xml'),
    'model': fields.String(description='AI model to use'),
    'diagram_id': fields.Integer(description='ID of the source diagram')
})

generate_prompt_response = api.model('GeneratePromptResponse', {
    'id': fields.Integer(description='Generated prompt ID'),
    'generated_prompt': fields.String(description='The generated prompt text'),
    'prompt_format': fields.String(description='Format of the generated prompt'),
    'success': fields.Boolean(description='Whether generation was successful'),
    'ai_model_used': fields.String(description='AI model that was used'),
    'processing_time': fields.Float(description='Time taken to process in seconds'),
    'error_message': fields.String(description='Error message if generation failed')
})

@api.route('/health')
class HealthCheck(Resource):
    """Health check endpoint"""
    
    @api.doc('health_check')
    @api.response(200, 'Success', generate_diagram_response)
    def get(self):
        """Health check endpoint"""
        from datetime import datetime
        return {
            'status': 'ok',
            'timestamp': datetime.utcnow().isoformat(),
            'version': '1.0.0'
        }

@api.route('/generate-diagram')
class GenerateDiagram(Resource):
    """Generate Mermaid diagram from text prompt"""
    
    @api.doc('generate_diagram')
    @api.expect(generate_diagram_model)
    @api.response(200, 'Success', generate_diagram_response)
    @api.response(400, 'Bad Request')
    @api.response(500, 'Internal Server Error')
    def post(self):
        """Generate Mermaid diagram from text prompt"""
        try:
            # Parse request data
            data = request.get_json()
            if not data:
                return {'error': 'No JSON data provided'}, 400
            
            # Validate request
            try:
                request_data = GenerateDiagramRequest(**data)
            except Exception as e:
                return {'error': f'Validation error: {str(e)}'}, 400
            
            # Validate prompt text
            if not validate_prompt_text(request_data.prompt):
                return {'error': 'Prompt text is too short or invalid'}, 400
            
            # Check if LLM client is available
            if not llm_client:
                return {'error': 'LLM service not available'}, 500
            
            # Generate diagram
            result = llm_client.generate_diagram(
                user_prompt=request_data.prompt,
                model=request_data.model,
                diagram_type=request_data.diagram_type
            )
            
            if result['success']:
                # Save diagram to database
                try:
                    db = next(get_db())
                    diagram = Diagram(
                        mermaid_code=result['mermaid_code'],
                        original_prompt=request_data.prompt,
                        model_used=result['model_used'],
                        diagram_type=request_data.diagram_type or 'flowchart',
                        processing_time=result['processing_time'],
                        success=result['success'],
                        error_message=result['error_message']
                    )
                    db.add(diagram)
                    db.commit()
                except Exception as db_error:
                    # Log error but don't fail the request
                    print(f"Error saving diagram to database: {db_error}")
                    db.rollback()
                finally:
                    db.close()
                
                # Update the response to use the new field name
                response_data = {
                    'mermaid_code': result['mermaid_code'],
                    'success': result['success'],
                    'ai_model_used': result['model_used'],
                    'processing_time': result['processing_time'],
                    'error_message': result['error_message']
                }
                return response_data, 200
            else:
                return {'error': result['error_message']}, 500
                
        except Exception as e:
            return {'error': f'Internal server error: {str(e)}'}, 500

@api.route('/upload-file')
class UploadFile(Resource):
    """Generate Mermaid diagram from uploaded file"""
    
    @api.doc('upload_file')
    @api.response(200, 'Success', generate_diagram_response)
    @api.response(400, 'Bad Request')
    @api.response(500, 'Internal Server Error')
    def post(self):
        """Generate Mermaid diagram from uploaded file"""
        try:
            # Check if file was uploaded
            if 'file' not in request.files:
                return {'error': 'No file provided'}, 400
            
            file = request.files['file']
            if file.filename == '':
                return {'error': 'No file selected'}, 400
            
            # Validate file
            if not allowed_file(file.filename):
                return {'error': f'File type not allowed. Allowed types: {", ".join(Config.ALLOWED_EXTENSIONS)}'}, 400
            
            # Read file content
            try:
                file_content = file.read().decode('utf-8')
            except UnicodeDecodeError:
                return {'error': 'File encoding not supported. Please use UTF-8 encoded files.'}, 400
            
            # Validate content
            if not validate_prompt_text(file_content):
                return {'error': 'File content is too short or invalid'}, 400
            
            # Get additional parameters
            model = request.form.get('model', 'gpt-4')
            diagram_type = request.form.get('diagram_type', 'flowchart')
            
            # Check if LLM client is available
            if not llm_client:
                return {'error': 'LLM service not available'}, 500
            
            # Generate diagram
            result = llm_client.generate_diagram(
                user_prompt=file_content,
                model=model,
                diagram_type=diagram_type
            )
            
            if result['success']:
                # Save diagram to database
                try:
                    db = next(get_db())
                    diagram = Diagram(
                        mermaid_code=result['mermaid_code'],
                        original_prompt=file_content,
                        model_used=result['model_used'],
                        diagram_type=diagram_type,
                        processing_time=result['processing_time'],
                        success=result['success'],
                        error_message=result['error_message']
                    )
                    db.add(diagram)
                    db.commit()
                except Exception as db_error:
                    # Log error but don't fail the request
                    print(f"Error saving diagram to database: {db_error}")
                    db.rollback()
                finally:
                    db.close()
                
                # Update the response to use the new field name
                response_data = {
                    'mermaid_code': result['mermaid_code'],
                    'success': result['success'],
                    'ai_model_used': result['model_used'],
                    'processing_time': result['processing_time'],
                    'error_message': result['error_message']
                }
                return response_data, 200
            else:
                return {'error': result['error_message']}, 500
                
        except Exception as e:
            return {'error': f'Internal server error: {str(e)}'}, 500

@api.route('/diagrams')
class Diagrams(Resource):
    """Get list of saved diagrams"""
    
    @api.doc('get_diagrams')
    @api.response(200, 'Success')
    def get(self):
        """Get list of saved diagrams with optional filtering and pagination"""
        try:
            db = next(get_db())
            
            # Get query parameters
            search = request.args.get('search', '').strip()
            model = request.args.get('model', '').strip()
            diagram_type = request.args.get('diagram_type', '').strip()
            limit = int(request.args.get('limit', 50))
            offset = int(request.args.get('offset', 0))
            
            # Build query
            query = db.query(Diagram)
            
            # Apply filters
            if search:
                query = query.filter(
                    Diagram.original_prompt.contains(search) |
                    Diagram.mermaid_code.contains(search)
                )
            
            if model:
                query = query.filter(Diagram.model_used == model)
            
            if diagram_type:
                query = query.filter(Diagram.diagram_type == diagram_type)
            
            # Get total count before pagination
            total = query.count()
            
            # Apply pagination and ordering
            diagrams = query.order_by(Diagram.created_at.desc()).limit(limit).offset(offset).all()
            
            # Convert to dictionaries
            diagrams_list = [diagram.to_dict() for diagram in diagrams]
            
            db.close()
            
            return {
                'diagrams': diagrams_list,
                'total': total,
                'limit': limit,
                'offset': offset
            }, 200
            
        except Exception as e:
            return {'error': f'Internal server error: {str(e)}'}, 500

@api.route('/diagrams/<int:diagram_id>')
class DiagramDetail(Resource):
    """Get or delete a specific diagram"""
    
    @api.doc('get_diagram')
    @api.response(200, 'Success')
    @api.response(404, 'Not Found')
    def get(self, diagram_id):
        """Get a specific diagram by ID"""
        try:
            db = next(get_db())
            diagram = db.query(Diagram).filter(Diagram.id == diagram_id).first()
            
            if not diagram:
                db.close()
                return {'error': 'Diagram not found'}, 404
            
            diagram_dict = diagram.to_dict()
            db.close()
            
            return diagram_dict, 200
            
        except Exception as e:
            return {'error': f'Internal server error: {str(e)}'}, 500
    
    @api.doc('delete_diagram')
    @api.response(200, 'Success')
    @api.response(404, 'Not Found')
    def delete(self, diagram_id):
        """Delete a specific diagram by ID"""
        try:
            db = next(get_db())
            diagram = db.query(Diagram).filter(Diagram.id == diagram_id).first()
            
            if not diagram:
                db.close()
                return {'error': 'Diagram not found'}, 404
            
            db.delete(diagram)
            db.commit()
            db.close()
            
            return {'message': 'Diagram deleted successfully'}, 200
            
        except Exception as e:
            db.rollback()
            db.close()
            return {'error': f'Internal server error: {str(e)}'}, 500

@api.route('/models')
class Models(Resource):
    """Get available AI models"""
    
    @api.doc('get_models')
    @api.response(200, 'Success')
    def get(self):
        """Get list of available AI models"""
        try:
            if not llm_client:
                return {'error': 'LLM service not available'}, 500
            
            models = llm_client.get_available_models()
            return models, 200
            
        except Exception as e:
            return {'error': f'Internal server error: {str(e)}'}, 500

@api.route('/validate-key')
class ValidateKey(Resource):
    """Validate API key for a specific model"""
    
    @api.doc('validate_key')
    @api.response(200, 'Success')
    @api.response(400, 'Bad Request')
    def post(self):
        """Validate API key for a specific model"""
        try:
            data = request.get_json()
            if not data:
                return {'error': 'No JSON data provided'}, 400
            
            model = data.get('model')
            api_key = data.get('api_key')
            
            if not model or not api_key:
                return {'error': 'Model and API key are required'}, 400
            
            if not llm_client:
                return {'error': 'LLM service not available'}, 500
            
            # Validate the key
            result = llm_client.validate_api_key(model, api_key)
            return result, 200
            
        except Exception as e:
            return {'error': f'Internal server error: {str(e)}'}, 500

@api.route('/system-prompts')
class SystemPrompts(Resource):
    """Get available system prompts"""
    
    @api.doc('get_system_prompts')
    @api.response(200, 'Success')
    def get(self):
        """Get list of available system prompts"""
        try:
            prompts = [
                {
                    'name': 'Mermaid Expert',
                    'description': 'Expert system prompt analyzer and Mermaid diagram generator',
                    'type': 'diagram_generation'
                },
                {
                    'name': 'Prompt Generator',
                    'description': 'Generate structured prompts from diagram representations',
                    'type': 'prompt_generation'
                }
            ]
            return {'available_prompts': prompts}, 200
            
        except Exception as e:
            return {'error': f'Internal server error: {str(e)}'}, 500


@api.route('/generate-prompt')
class GeneratePrompt(Resource):
    """Generate a prompt from a diagram structure"""
    
    @api.doc('generate_prompt')
    @api.expect(generate_prompt_model)
    @api.response(200, 'Success', generate_prompt_response)
    @api.response(400, 'Bad Request')
    @api.response(500, 'Internal Server Error')
    def post(self):
        """Generate a prompt from a diagram structure"""
        try:
            # Parse request data
            data = request.get_json()
            if not data:
                return {'error': 'No JSON data provided'}, 400
            
            # Validate request
            try:
                request_data = GeneratePromptRequest(**data)
            except Exception as e:
                return {'error': f'Validation error: {str(e)}'}, 400
            
            # Validate diagram structure
            if not request_data.diagram_structure.nodes:
                return {'error': 'Diagram must have at least one node'}, 400
            
            # Validate format
            if request_data.prompt_format not in ['xml', 'markdown']:
                return {'error': 'Invalid format. Must be "xml" or "markdown"'}, 400
            
            # Check if LLM client is available
            if not llm_client:
                return {'error': 'LLM service not available'}, 500
            
            # Convert diagram structure to dict for LLM
            diagram_dict = {
                'nodes': [
                    {
                        'id': node.id,
                        'type': node.type,
                        'label': node.label,
                        'position': node.position
                    }
                    for node in request_data.diagram_structure.nodes
                ],
                'edges': [
                    {
                        'id': edge.id,
                        'source': edge.source,
                        'target': edge.target,
                        'label': edge.label
                    }
                    for edge in request_data.diagram_structure.edges
                ]
            }
            
            # Generate prompt
            result = llm_client.generate_prompt_from_diagram(
                diagram_structure=diagram_dict,
                original_prompt=request_data.original_prompt,
                output_format=request_data.prompt_format,
                model=request_data.model
            )
            
            if result['success']:
                # Save generated prompt to database
                prompt_id = None
                try:
                    db = next(get_db())
                    generated_prompt = GeneratedPrompt(
                        diagram_id=request_data.diagram_id,
                        diagram_structure=json.dumps(diagram_dict),
                        original_prompt=request_data.original_prompt,
                        generated_prompt=result['generated_prompt'],
                        prompt_format=request_data.prompt_format,
                        model_used=result['model_used'],
                        processing_time=result['processing_time'],
                        success=True,
                        error_message=None
                    )
                    db.add(generated_prompt)
                    db.commit()
                    prompt_id = generated_prompt.id
                except Exception as db_error:
                    print(f"Error saving generated prompt to database: {db_error}")
                    db.rollback()
                finally:
                    db.close()
                
                response_data = {
                    'id': prompt_id,
                    'generated_prompt': result['generated_prompt'],
                    'prompt_format': request_data.prompt_format,
                    'success': True,
                    'ai_model_used': result['model_used'],
                    'processing_time': result['processing_time'],
                    'error_message': None
                }
                return response_data, 200
            else:
                return {'error': result['error_message']}, 500
                
        except Exception as e:
            return {'error': f'Internal server error: {str(e)}'}, 500


@api.route('/generated-prompts')
class GeneratedPrompts(Resource):
    """Get list of generated prompts"""
    
    @api.doc('get_generated_prompts')
    @api.response(200, 'Success')
    def get(self):
        """Get list of generated prompts with optional filtering"""
        try:
            db = next(get_db())
            
            # Get query parameters
            diagram_id = request.args.get('diagram_id', type=int)
            prompt_format = request.args.get('format', '').strip()
            limit = int(request.args.get('limit', 50))
            offset = int(request.args.get('offset', 0))
            
            # Build query
            query = db.query(GeneratedPrompt)
            
            # Apply filters
            if diagram_id:
                query = query.filter(GeneratedPrompt.diagram_id == diagram_id)
            
            if prompt_format:
                query = query.filter(GeneratedPrompt.prompt_format == prompt_format)
            
            # Get total count before pagination
            total = query.count()
            
            # Apply pagination and ordering
            prompts = query.order_by(GeneratedPrompt.created_at.desc()).limit(limit).offset(offset).all()
            
            # Convert to dictionaries
            prompts_list = [prompt.to_dict() for prompt in prompts]
            
            db.close()
            
            return {
                'generated_prompts': prompts_list,
                'total': total,
                'limit': limit,
                'offset': offset
            }, 200
            
        except Exception as e:
            return {'error': f'Internal server error: {str(e)}'}, 500


@api.route('/generated-prompts/<int:prompt_id>')
class GeneratedPromptDetail(Resource):
    """Get or delete a specific generated prompt"""
    
    @api.doc('get_generated_prompt')
    @api.response(200, 'Success')
    @api.response(404, 'Not Found')
    def get(self, prompt_id):
        """Get a specific generated prompt by ID"""
        try:
            db = next(get_db())
            prompt = db.query(GeneratedPrompt).filter(GeneratedPrompt.id == prompt_id).first()
            
            if not prompt:
                db.close()
                return {'error': 'Generated prompt not found'}, 404
            
            prompt_dict = prompt.to_dict()
            db.close()
            
            return prompt_dict, 200
            
        except Exception as e:
            return {'error': f'Internal server error: {str(e)}'}, 500
    
    @api.doc('delete_generated_prompt')
    @api.response(200, 'Success')
    @api.response(404, 'Not Found')
    def delete(self, prompt_id):
        """Delete a specific generated prompt by ID"""
        try:
            db = next(get_db())
            prompt = db.query(GeneratedPrompt).filter(GeneratedPrompt.id == prompt_id).first()
            
            if not prompt:
                db.close()
                return {'error': 'Generated prompt not found'}, 404
            
            db.delete(prompt)
            db.commit()
            db.close()
            
            return {'message': 'Generated prompt deleted successfully'}, 200
            
        except Exception as e:
            db.rollback()
            db.close()
            return {'error': f'Internal server error: {str(e)}'}, 500 