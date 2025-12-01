"""
Unit tests for Template model
"""
import pytest
from django.core.exceptions import ValidationError
from django_tenants.utils import tenant_context
from media.models import Template
from apps.tenants.models import Client, Domain
from conftest import tenant_with_schema


@pytest.mark.django_db
class TestTemplateModel:
    """Tests for Template model"""

    def test_template_creation(self, tenant_with_schema):
        """Test creating a basic template"""
        tenant = tenant_with_schema
        
        with tenant_context(tenant):
            template = Template.objects.create(
                name='Test Template',
                slug='test-template',
                description='A test template',
                category='vtc',
                html_content='<html><body>Test</body></html>',
                css_content='body { margin: 0; }',
            )
            
            assert template.id is not None
            assert template.name == 'Test Template'
            assert template.slug == 'test-template'
            assert template.category == 'vtc'
            assert template.html_content == '<html><body>Test</body></html>'
            assert template.css_content == 'body { margin: 0; }'
            assert template.is_active is True
            assert template.is_premium is False
            assert template.price == 0
            assert template.usage_count == 0

    def test_template_slug_auto_generation(self, tenant_with_schema):
        """Test that slug is auto-generated from name if not provided"""
        tenant = tenant_with_schema
        
        with tenant_context(tenant):
            template = Template.objects.create(
                name='My Awesome Template',
                category='vtc',
            )
            
            assert template.slug == 'my-awesome-template'

    def test_template_premium(self, tenant_with_schema):
        """Test creating a premium template"""
        tenant = tenant_with_schema
        
        with tenant_context(tenant):
            template = Template.objects.create(
                name='Premium Template',
                slug='premium-template',
                category='business',
                is_premium=True,
                price=49.99,
            )
            
            assert template.is_premium is True
            assert float(template.price) == 49.99

    def test_template_increment_usage(self, tenant_with_schema):
        """Test incrementing template usage count"""
        tenant = tenant_with_schema
        
        with tenant_context(tenant):
            template = Template.objects.create(
                name='Test Template',
                slug='test-template',
                category='vtc',
            )
            
            assert template.usage_count == 0
            
            template.increment_usage()
            assert template.usage_count == 1
            
            template.increment_usage()
            assert template.usage_count == 2

    def test_template_categories(self, tenant_with_schema):
        """Test different template categories"""
        tenant = tenant_with_schema
        
        categories = ['vtc', 'business', 'minimal', 'modern', 'classic']
        
        with tenant_context(tenant):
            for category in categories:
                template = Template.objects.create(
                    name=f'{category.title()} Template',
                    slug=f'{category}-template',
                    category=category,
                )
                assert template.category == category

    def test_template_html_css_content(self, tenant_with_schema):
        """Test template with full HTML and CSS content"""
        tenant = tenant_with_schema
        
        html_content = """
        <!DOCTYPE html>
        <html>
        <head>
            <title>Test Template</title>
        </head>
        <body>
            <header>
                <h1>Welcome</h1>
            </header>
            <main>
                <p>Content goes here</p>
            </main>
        </body>
        </html>
        """
        
        css_content = """
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
        }
        header {
            background-color: #333;
            color: white;
            padding: 1rem;
        }
        main {
            padding: 2rem;
        }
        """
        
        with tenant_context(tenant):
            template = Template.objects.create(
                name='Full Template',
                slug='full-template',
                category='vtc',
                html_content=html_content.strip(),
                css_content=css_content.strip(),
            )
            
            assert template.html_content == html_content.strip()
            assert template.css_content == css_content.strip()
            assert '<html>' in template.html_content
            assert 'body {' in template.css_content

    def test_template_structure_json(self, tenant_with_schema):
        """Test template structure JSON field"""
        tenant = tenant_with_schema
        
        structure = {
            'sections': [
                {'type': 'header', 'id': 'header-1'},
                {'type': 'content', 'id': 'content-1'},
                {'type': 'footer', 'id': 'footer-1'},
            ]
        }
        
        with tenant_context(tenant):
            template = Template.objects.create(
                name='Structured Template',
                slug='structured-template',
                category='vtc',
                structure=structure,
            )
            
            assert template.structure == structure
            assert len(template.structure['sections']) == 3

    def test_template_default_settings(self, tenant_with_schema):
        """Test template default settings"""
        tenant = tenant_with_schema
        
        default_settings = {
            'primary_color': '#3B82F6',
            'secondary_color': '#10B981',
            'font_family': 'Arial',
        }
        
        with tenant_context(tenant):
            template = Template.objects.create(
                name='Settings Template',
                slug='settings-template',
                category='vtc',
                default_settings=default_settings,
            )
            
            assert template.default_settings == default_settings
            assert template.default_settings['primary_color'] == '#3B82F6'
