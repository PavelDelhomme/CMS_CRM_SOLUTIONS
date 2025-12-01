"""
Template rendering engine with variable substitution and block support
"""
import re
from typing import Dict, List, Any, Optional
from django.utils.html import escape, mark_safe


class TemplateRenderer:
    """
    Template renderer for VTCBuilder templates
    Supports:
    - Variable substitution: {{variable_name}}
    - Block/component inclusion: {% block block_name %}
    - Conditional rendering: {% if condition %}...{% endif %}
    - Loops: {% for item in items %}...{% endfor %}
    """
    
    def __init__(self, template_html: str, template_css: str = '', variables_def: Dict = None):
        self.template_html = template_html
        self.template_css = template_css
        self.variables_def = variables_def or {}
    
    def render(self, context: Dict[str, Any] = None, blocks: Dict[str, str] = None) -> tuple[str, str]:
        """
        Render template with context and blocks
        
        Args:
            context: Dictionary of variable values
            blocks: Dictionary of block/component HTML content
        
        Returns:
            tuple: (rendered_html, rendered_css)
        """
        if context is None:
            context = {}
        if blocks is None:
            blocks = {}
        
        # Merge context with default values from variables_def
        full_context = self._get_defaults()
        full_context.update(context)
        
        html = self.template_html
        css = self.template_css
        
        # Process blocks first (before variables)
        html = self._process_blocks(html, blocks)
        
        # Process conditionals
        html = self._process_conditionals(html, full_context)
        
        # Process loops
        html = self._process_loops(html, full_context)
        
        # Process variables
        html = self._process_variables(html, full_context)
        css = self._process_variables(css, full_context)
        
        return html, css
    
    def _get_defaults(self) -> Dict[str, Any]:
        """Get default values from variables definition"""
        defaults = {}
        for var_name, var_config in self.variables_def.items():
            if isinstance(var_config, dict) and 'default' in var_config:
                defaults[var_name] = var_config['default']
        return defaults
    
    def _process_variables(self, content: str, context: Dict[str, Any]) -> str:
        """Replace {{variable_name}} with values from context"""
        pattern = r'\{\{(\w+)\}\}'
        
        def replace_var(match):
            var_name = match.group(1)
            if var_name in context:
                value = context[var_name]
                # Check if variable should be rendered as HTML
                if var_name in self.variables_def:
                    var_config = self.variables_def[var_name]
                    if isinstance(var_config, dict) and var_config.get('type') == 'html':
                        return mark_safe(str(value))
                # Default: escape HTML for security
                return escape(str(value))
            return match.group(0)  # Keep original if not found
        
        return re.sub(pattern, replace_var, content)
    
    def _process_blocks(self, content: str, blocks: Dict[str, str]) -> str:
        """Replace {% block block_name %} with block content"""
        pattern = r'\{%\s*block\s+(\w+)\s*%\}'
        
        def replace_block(match):
            block_name = match.group(1)
            if block_name in blocks:
                return blocks[block_name]
            return ''  # Remove block tag if no content provided
        
        return re.sub(pattern, replace_block, content)
    
    def _process_conditionals(self, content: str, context: Dict[str, Any]) -> str:
        """Process {% if condition %}...{% endif %} statements"""
        pattern = r'\{%\s*if\s+(\w+)\s*%\}(.*?)\{%\s*endif\s*%\}'
        
        def process_if(match):
            var_name = match.group(1)
            inner_content = match.group(2)
            
            # Check if variable exists and is truthy
            if var_name in context:
                value = context[var_name]
                if value:
                    return inner_content
            return ''
        
        return re.sub(pattern, process_if, content, flags=re.DOTALL)
    
    def _process_loops(self, content: str, context: Dict[str, Any]) -> str:
        """Process {% for item in items %}...{% endfor %} loops"""
        pattern = r'\{%\s*for\s+(\w+)\s+in\s+(\w+)\s*%\}(.*?)\{%\s*endfor\s*%\}'
        
        def process_loop(match):
            item_var = match.group(1)
            items_var = match.group(2)
            loop_content = match.group(3)
            
            if items_var in context:
                items = context[items_var]
                if isinstance(items, (list, tuple)):
                    result = []
                    for item in items:
                        # Create a new context with the loop variable
                        loop_context = {**context, item_var: item}
                        # Render loop content with item context
                        rendered = loop_content
                        # Replace {{item}} references in loop content
                        rendered = re.sub(
                            r'\{\{' + item_var + r'\.(\w+)\}\}',
                            lambda m: str(item.get(m.group(1), '') if isinstance(item, dict) else getattr(item, m.group(1), '')),
                            rendered
                        )
                        # Replace simple {{item_var}} reference
                        rendered = re.sub(
                            r'\{\{' + item_var + r'\}\}',
                            str(item),
                            rendered
                        )
                        result.append(rendered)
                    return ''.join(result)
            return ''
        
        return re.sub(pattern, process_loop, content, flags=re.DOTALL)
    
    @staticmethod
    def extract_variables(content: str) -> List[str]:
        """Extract all variable names from template content"""
        pattern = r'\{\{(\w+)\}\}'
        variables = set(re.findall(pattern, content))
        return sorted(list(variables))
    
    @staticmethod
    def extract_blocks(content: str) -> List[str]:
        """Extract all block names from template content"""
        pattern = r'\{%\s*block\s+(\w+)\s*%\}'
        blocks = set(re.findall(pattern, content))
        return sorted(list(blocks))

