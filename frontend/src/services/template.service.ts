import api from '@/lib/api';

export interface Template {
  id: number;
  name: string;
  slug: string;
  description?: string;
  thumbnail?: string;
  preview_url?: string;
  structure?: Record<string, any>;
  default_settings?: Record<string, any>;
  category: 'vtc' | 'business' | 'minimal' | 'modern' | 'classic';
  is_premium: boolean;
  price: number;
  is_active: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

class TemplateService {
  async getAll(params?: { category?: string; is_premium?: boolean }) {
    const response = await api.get('/templates/', { params });
    // Handle paginated response
    if (Array.isArray(response.data)) {
      return response.data;
    }
    if (response.data && typeof response.data === 'object' && 'results' in response.data) {
      return response.data.results || [];
    }
    return [];
  }

  async getById(id: number) {
    const response = await api.get(`/templates/${id}/`);
    return response.data;
  }

  async useTemplate(id: number) {
    const response = await api.post(`/templates/${id}/use_template/`);
    return response.data;
  }

  async getFree() {
    const response = await api.get('/templates/free/');
    return response.data;
  }

  async create(data: Partial<Template>) {
    const response = await api.post('/templates/', data);
    return response.data;
  }

  async update(id: number, data: Partial<Template>) {
    const response = await api.patch(`/templates/${id}/`, data);
    return response.data;
  }

  async delete(id: number) {
    const response = await api.delete(`/templates/${id}/`);
    return response.data;
  }
}

export default new TemplateService();

