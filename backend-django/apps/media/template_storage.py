"""
Template storage utility for saving/loading templates from filesystem
"""
import os
import json
import logging
from django.conf import settings

logger = logging.getLogger(__name__)


class TemplateStorage:
    """
    Utility class for managing template storage in filesystem
    """
    
    def __init__(self):
        # Base directory for templates
        self.base_dir = getattr(settings, 'TEMPLATE_STORAGE_DIR', os.path.join(settings.BASE_DIR, 'templates'))
        self.default_dir = os.path.join(self.base_dir, 'default')
        self.custom_dir = os.path.join(self.base_dir, 'custom')
        
        # Create directories if they don't exist
        os.makedirs(self.default_dir, exist_ok=True)
        os.makedirs(self.custom_dir, exist_ok=True)
    
    def export_template_from_db(self, template):
        """
        Export template data from database model to dict format
        """
        return {
            'id': template.id,
            'name': template.name,
            'slug': template.slug,
            'description': template.description,
            'html_content': template.html_content or '',
            'css_content': template.css_content or '',
            'variables': template.variables or {},
            'category': template.category,
            'is_premium': template.is_premium,
            'price': float(template.price) if template.price else 0.0,
            'is_active': template.is_active,
            'structure': template.structure or {},
            'default_settings': template.default_settings or {},
        }
    
    def save_template(self, template_data, is_default=True):
        """
        Save template to filesystem
        """
        try:
            target_dir = self.default_dir if is_default else self.custom_dir
            slug = template_data.get('slug', 'template')
            file_path = os.path.join(target_dir, f"{slug}.json")
            
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(template_data, f, indent=2, ensure_ascii=False)
            
            logger.info(f"Template saved to {file_path}")
            return file_path
        except Exception as e:
            logger.error(f"Error saving template to filesystem: {e}", exc_info=True)
            raise
    
    def load_template(self, slug, is_default=True):
        """
        Load template from filesystem
        """
        try:
            target_dir = self.default_dir if is_default else self.custom_dir
            file_path = os.path.join(target_dir, f"{slug}.json")
            
            if not os.path.exists(file_path):
                return None
            
            with open(file_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Error loading template from filesystem: {e}", exc_info=True)
            return None
    
    def delete_template(self, slug, is_default=True):
        """
        Delete template from filesystem
        """
        try:
            target_dir = self.default_dir if is_default else self.custom_dir
            file_path = os.path.join(target_dir, f"{slug}.json")
            
            if os.path.exists(file_path):
                os.remove(file_path)
                logger.info(f"Template deleted from {file_path}")
                return True
            return False
        except Exception as e:
            logger.error(f"Error deleting template from filesystem: {e}", exc_info=True)
            return False
    
    def list_templates(self, is_default=True):
        """
        List all templates in storage
        """
        try:
            target_dir = self.default_dir if is_default else self.custom_dir
            templates = []
            
            if os.path.exists(target_dir):
                for filename in os.listdir(target_dir):
                    if filename.endswith('.json'):
                        slug = filename[:-5]  # Remove .json extension
                        template = self.load_template(slug, is_default)
                        if template:
                            templates.append(template)
            
            return templates
        except Exception as e:
            logger.error(f"Error listing templates: {e}", exc_info=True)
            return []

