import os
import time
import json
from typing import Optional, Dict, Any, List
import litellm
from litellm import completion
from config import Config
from app.utils.helpers import extract_mermaid_code_from_response

litellm._turn_on_debug() # 👈 this is the 1-line change you need to make

class LiteLLMClient:
    """Client for interacting with LiteLLM for AI-powered diagram generation"""
    
    # Provider to API key mapping
    PROVIDER_KEY_MAP = {
        'openai': 'OPENAI_API_KEY',
        'anthropic': 'ANTHROPIC_API_KEY',
        'google': 'GEMINI_API_KEY',
    }
    
    def __init__(self):
        # Store API keys by provider
        self.api_keys = {
            'openai': Config.OPENAI_API_KEY,
            'anthropic': Config.ANTHROPIC_API_KEY,
            'google': Config.GEMINI_API_KEY,
        }
        self.default_model = Config.LITELLM_MODEL
        self.timeout = Config.LITELLM_TIMEOUT
        
        # Load system prompts
        self.system_prompt = self._load_system_prompt('MermaidExpertSystemPrompt.md')
        self.prompt_generator_system_prompt = self._load_system_prompt('PromptGeneratorSystemPrompt.md')
        
        # Check if at least one API key is configured
        if not any(self.api_keys.values()):
            raise ValueError("No API keys configured. Please set at least one of: OPENAI_API_KEY, ANTHROPIC_API_KEY, or GEMINI_API_KEY")
    
    def _get_provider_for_model(self, model: str) -> str:
        """
        Determine the provider based on model name
        
        Args:
            model: Model name (e.g., 'gpt-4', 'claude-3-sonnet', 'gemini/gemini-2.0-flash')
            
        Returns:
            Provider name: 'openai', 'anthropic', or 'google'
        """
        model_lower = model.lower()
        
        if model_lower.startswith('gpt-') or model_lower.startswith('o1'):
            return 'openai'
        elif model_lower.startswith('claude-'):
            return 'anthropic'
        elif model_lower.startswith('gemini/') or model_lower.startswith('gemini-'):
            return 'google'
        else:
            # Default to openai for unknown models
            return 'openai'
    
    def _get_api_key_for_model(self, model: str) -> Optional[str]:
        """
        Get the appropriate API key for the given model
        
        Args:
            model: Model name
            
        Returns:
            API key for the model's provider, or None if not configured
        """
        provider = self._get_provider_for_model(model)
        return self.api_keys.get(provider)
    
    def _load_system_prompt(self, filename: str) -> str:
        """Load a system prompt from file"""
        try:
            prompt_path = os.path.join(
                os.path.dirname(__file__), 
                'system_prompts', 
                filename
            )
            with open(prompt_path, 'r', encoding='utf-8') as file:
                return file.read()
        except Exception as e:
            # Fallback to default system prompt if file loading fails
            if filename == 'MermaidExpertSystemPrompt.md':
                return """You are an expert system prompt analyzer and Mermaid diagram generator. Your task is to analyze system prompts and create clear, well-structured Mermaid diagrams that visualize the prompt's structure, components, and relationships.

Return ONLY the Mermaid diagram code, no explanations or additional text. The diagram should be immediately renderable by Mermaid.js."""
            else:
                return """You are an expert AI prompt engineer. Generate well-structured prompts based on diagram representations."""
    
    def generate_diagram(self, user_prompt: str, model: Optional[str] = None, 
                        diagram_type: str = "flowchart") -> Dict[str, Any]:
        """
        Generate Mermaid diagram using AI model with system prompt integration
        
        Args:
            user_prompt: The user's prompt to visualize
            model: AI model to use (defaults to configured model)
            diagram_type: Type of diagram to generate
            
        Returns:
            Dictionary containing the generated diagram and metadata
        """
        start_time = time.time()
        model_to_use = model or self.default_model
        
        try:
            # Get the appropriate API key for this model
            api_key = self._get_api_key_for_model(model_to_use)
            if not api_key:
                provider = self._get_provider_for_model(model_to_use)
                raise ValueError(f"No API key configured for {provider}. Please set {self.PROVIDER_KEY_MAP.get(provider, 'API_KEY')} environment variable.")
            
            # Make API call to LiteLLM
            response = completion(
                model=model_to_use,
                messages=[
                    {"role": "system", "content": self.system_prompt},
                    {"role": "user", "content": f"Please analyze the following prompt and generate a Mermaid {diagram_type} diagram:\n\n{user_prompt}"},
                    {"role": "assistant", "content": f"```mermaid"}
                ],
                api_key=api_key,
                timeout=self.timeout,
                temperature=0.1,  # Low temperature for consistent output
                max_tokens=100000
            )
            
            
            # Extract the generated content
            ai_response = response.choices[0].message.content
            # ai_response = """flowchart TD\n    A[Start: Receive System Prompt] --> B{Analyze System Prompt}\n    B --> C[Identify Key Components]\n    C --> D{Identify Relationships Between Components}\n    D --> E{Identify Flow and Logic Structure}\n    E --> F{Identify Conditional Statements and Decision Points}\n    F --> G{Identify Input/Output Specifications}\n    G --> H[Generate Mermaid Diagram]\n    H --> I{Use Flowchart TD Format}\n    I --> J[Create Clear Node Labels]\n    J --> K[Show Logical Flow and Relationships]\n    K --> L[Use Appropriate Mermaid Syntax and Styling]\n    L --> M[Ensure Diagram is Easy to Read and Understand]\n    M --> N[Coverage: Be Verbose and Cover All Details]\n    N --> O{Use Rectangles for Main Instructions}\n    O --> P{Use Diamonds for Decision Points}\n    P --> Q{Use Rounded Rectangles for Context/Examples}\n    Q --> R{Use Hexagons for Output Formats}\n    R --> S[Use Arrows to Show Flow Direction]\n    S --> T[Use Arrows to Show Conditional Paths]\n    T --> U[Use Arrows to Show Dependencies and Relationships]\n    U --> V[Apply Consistent Styling]\n    V --> W[Use Clear and Concise Labels]\n    W --> X[Group Related Components]\n    X --> Y[Maintain Logical Hierarchy]\n    Y --> Z{Check for Invalid Chars}\n    Z -->|Invalid Chars Found| AA[Correct the Mermaid Syntax]\n    Z -->|No Invalid Chars| BB[Output Only Mermaid Diagram Code]\n    AA --> BB\n    BB --> CC[End: Output Mermaid Diagram]\n"""
            
            # Extract Mermaid code from the response
            mermaid_code = extract_mermaid_code_from_response(ai_response)
            
            
            processing_time = time.time() - start_time
            
            return {
                "mermaid_code": mermaid_code,
                "success": True,
                "model_used": model or self.default_model,
                "processing_time": round(processing_time, 2),
                "error_message": None
            }
            
        except Exception as e:
            processing_time = time.time() - start_time
            
            return {
                "mermaid_code": "",
                "success": False,
                "model_used": model or self.default_model,
                "processing_time": round(processing_time, 2),
                "error_message": str(e)
            }
    
    def validate_api_key(self, model: str, api_key: str) -> Dict[str, Any]:
        """
        Validate API key by making a test call
        
        Args:
            model: Model to test with
            api_key: API key to validate
            
        Returns:
            Dictionary with validation result
        """
        try:
            # Make a minimal test call
            response = completion(
                model=model,
                messages=[{"role": "user", "content": "Hello"}],
                api_key=api_key,
                timeout=10,
                max_tokens=10
            )
            
            return {
                "valid": True,
                "error": None
            }
            
        except Exception as e:
            return {
                "valid": False,
                "error": str(e)
            }
    
    def get_available_models(self) -> Dict[str, Any]:
        """
        Get list of available models, filtered by configured API keys
        
        Returns:
            Dictionary with available models (only those with configured API keys)
        """
        # Get supported models from central config
        all_models = Config.SUPPORTED_MODELS
        
        # Filter models based on configured API keys
        models = []
        for model in all_models:
            provider = model["provider"]
            has_key = bool(self.api_keys.get(provider))
            models.append({
                "name": model["name"],
                "provider": provider,
                "available": has_key
            })
        
        # Sort: available models first, preserving the preferred order within each group
        models.sort(key=lambda m: (not m["available"]))
        
        return {"models": models}
    
    def _format_diagram_for_prompt(self, diagram_structure: Dict[str, Any]) -> str:
        """
        Format diagram structure into a readable text representation for the LLM
        
        Args:
            diagram_structure: Dictionary with 'nodes' and 'edges' lists
            
        Returns:
            Formatted string representation of the diagram
        """
        nodes = diagram_structure.get('nodes', [])
        edges = diagram_structure.get('edges', [])
        
        # Create node lookup for labels
        node_labels = {node['id']: node.get('label', node['id']) for node in nodes}
        
        lines = ["## Diagram Structure\n"]
        
        # Format nodes by type
        lines.append("### Nodes:\n")
        node_types = {}
        for node in nodes:
            node_type = node.get('type', 'rectangle')
            if node_type not in node_types:
                node_types[node_type] = []
            node_types[node_type].append(node)
        
        type_descriptions = {
            'rectangle': 'Main Instructions/Actions',
            'diamond': 'Decision Points',
            'rounded': 'Context/Examples',
            'hexagon': 'Output Formats',
            'parallelogram': 'Input/Output Operations',
            'cylinder': 'Data Storage',
            'circle': 'Events/Connectors'
        }
        
        for node_type, type_nodes in node_types.items():
            desc = type_descriptions.get(node_type, node_type.capitalize())
            lines.append(f"\n**{desc}:**")
            for node in type_nodes:
                lines.append(f"- [{node['id']}] {node.get('label', 'No label')}")
        
        # Format edges (flow)
        lines.append("\n### Flow/Connections:\n")
        for edge in edges:
            source_label = node_labels.get(edge['source'], edge['source'])
            target_label = node_labels.get(edge['target'], edge['target'])
            edge_label = edge.get('label', '')
            
            if edge_label:
                lines.append(f"- \"{source_label}\" --[{edge_label}]--> \"{target_label}\"")
            else:
                lines.append(f"- \"{source_label}\" --> \"{target_label}\"")
        
        return '\n'.join(lines)
    
    def generate_prompt_from_diagram(
        self,
        diagram_structure: Dict[str, Any],
        original_prompt: Optional[str] = None,
        output_format: str = "xml",
        model: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generate a prompt from a diagram structure
        
        Args:
            diagram_structure: Dictionary with 'nodes' and 'edges' lists
            original_prompt: Optional original prompt that generated the diagram
            output_format: 'xml' or 'markdown'
            model: AI model to use (defaults to configured model)
            
        Returns:
            Dictionary containing the generated prompt and metadata
        """
        start_time = time.time()
        model_to_use = model or self.default_model
        
        try:
            # Get the appropriate API key for this model
            api_key = self._get_api_key_for_model(model_to_use)
            if not api_key:
                provider = self._get_provider_for_model(model_to_use)
                raise ValueError(f"No API key configured for {provider}. Please set {self.PROVIDER_KEY_MAP.get(provider, 'API_KEY')} environment variable.")
            
            # Format the diagram structure for the LLM
            diagram_text = self._format_diagram_for_prompt(diagram_structure)
            
            # Build the user message
            user_message_parts = [
                f"Please generate a prompt in **{output_format.upper()}** format based on the following diagram:\n",
                diagram_text
            ]
            
            if original_prompt:
                user_message_parts.append(f"\n\n## Original Prompt (for reference):\n\n{original_prompt}")
                user_message_parts.append("\n\nUse the original prompt as context to understand the intent, but generate the new prompt based on the diagram structure.")
            
            user_message_parts.append(f"\n\nGenerate the prompt in **{output_format.upper()}** format. Output ONLY the prompt, no explanations.")
            
            user_message = '\n'.join(user_message_parts)
            
            # Make API call to LiteLLM
            response = completion(
                model=model_to_use,
                messages=[
                    {"role": "system", "content": self.prompt_generator_system_prompt},
                    {"role": "user", "content": user_message}
                ],
                api_key=api_key,
                timeout=self.timeout,
                temperature=0.3,  # Slightly higher for more creative prompt generation
                max_tokens=8000
            )
            
            # Extract the generated content
            generated_prompt = response.choices[0].message.content
            
            # Clean up the response (remove any markdown code blocks if present)
            if generated_prompt.startswith('```'):
                lines = generated_prompt.split('\n')
                # Remove first and last lines if they're code block markers
                if lines[0].startswith('```'):
                    lines = lines[1:]
                if lines and lines[-1].strip() == '```':
                    lines = lines[:-1]
                generated_prompt = '\n'.join(lines)
            
            processing_time = time.time() - start_time
            
            return {
                "generated_prompt": generated_prompt.strip(),
                "success": True,
                "model_used": model or self.default_model,
                "processing_time": round(processing_time, 2),
                "error_message": None
            }
            
        except Exception as e:
            processing_time = time.time() - start_time
            
            return {
                "generated_prompt": "",
                "success": False,
                "model_used": model or self.default_model,
                "processing_time": round(processing_time, 2),
                "error_message": str(e)
            } 