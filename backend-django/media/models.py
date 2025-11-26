"""
Media models for file management
"""
from django.db import models
from tenants.models import Tenant


class Media(models.Model):
    """
    Media model for file management (images, documents, etc.)
    """
    COLLECTION_CHOICES = [
        ('images', 'Images'),
        ('documents', 'Documents'),
        ('videos', 'Videos'),
        ('audio', 'Audio'),
        ('other', 'Other'),
    ]

    # Relations
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, null=True, blank=True)

    # File info
    name = models.CharField(max_length=255)
    file_name = models.CharField(max_length=255)
    mime_type = models.CharField(max_length=100)
    path = models.CharField(max_length=500)
    disk = models.CharField(max_length=50, default='local')
    size = models.BigIntegerField()  # File size in bytes

    # Organization
    collection = models.CharField(max_length=50, choices=COLLECTION_CHOICES, default='other')
    alt_text = models.CharField(max_length=255, blank=True, null=True)
    order = models.IntegerField(default=0)

    # Metadata
    metadata = models.JSONField(default=dict, blank=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'media'
        ordering = ['-created_at']

    def __str__(self):
        return self.name

    @property
    def url(self):
        """Return the full URL for the media file"""
        if self.disk == 'local':
            return f"/media/{self.path}"
        # Add support for other storage backends (S3, etc.)
        return self.path

    @property
    def file_extension(self):
        """Return the file extension"""
        return self.file_name.split('.')[-1] if '.' in self.file_name else ''

    @property
    def is_image(self):
        """Check if file is an image"""
        return self.mime_type.startswith('image/')

    @property
    def is_video(self):
        """Check if file is a video"""
        return self.mime_type.startswith('video/')

    @property
    def is_audio(self):
        """Check if file is audio"""
        return self.mime_type.startswith('audio/')

    @property
    def is_document(self):
        """Check if file is a document"""
        return self.mime_type.startswith('application/') or self.mime_type.startswith('text/')


class Template(models.Model):
    """
    Template model for website themes/templates
    """
    CATEGORY_CHOICES = [
        ('vtc', 'VTC'),
        ('business', 'Business'),
        ('minimal', 'Minimal'),
        ('modern', 'Modern'),
        ('classic', 'Classic'),
    ]

    # Basic info
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255)  # Not unique as each tenant has its own templates table
    description = models.TextField(blank=True, null=True)

    # Assets
    thumbnail = models.ImageField(upload_to='templates/thumbnails/', blank=True, null=True)
    preview_url = models.URLField(blank=True, null=True)

    # Template data
    structure = models.JSONField(default=dict, blank=True)
    default_settings = models.JSONField(default=dict, blank=True)
    html_content = models.TextField(blank=True, null=True, help_text="HTML content of the template")
    css_content = models.TextField(blank=True, null=True, help_text="CSS content of the template")

    # Classification
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='vtc')
    is_premium = models.BooleanField(default=False)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    # Status
    is_active = models.BooleanField(default=True)
    usage_count = models.IntegerField(default=0)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'templates'
        ordering = ['-created_at']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        """Auto-generate slug from name if not provided"""
        if not self.slug and self.name:
            from django.utils.text import slugify
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def increment_usage(self):
        """Increment the usage count"""
        self.usage_count += 1
        self.save(update_fields=['usage_count'])
