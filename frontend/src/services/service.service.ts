import api from '@/lib/api';

export interface Service {
  id: number;
  tenant_id: number;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  image?: string;
  base_price?: number | null;
  price_per_km?: number;
  price_per_minute?: number;
  min_price?: number;
  max_passengers: number;
  max_luggage: number;
  features?: string[];
  is_active: boolean;
  order: number;
  created_at: string;
  updated_at: string;
}

class ServiceService {
  async getAll(params?: { is_active?: boolean }) {
    const response = await api.get('/services/', { params });
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
    const response = await api.get(`/services/${id}/`);
    return response.data;
  }

  async create(data: Partial<Service>) {
    const response = await api.post('/services/', data);
    return response.data;
  }

  async update(id: number, data: Partial<Service>) {
    const response = await api.patch(`/services/${id}/`, data);
    return response.data;
  }

  async delete(id: number) {
    const response = await api.delete(`/services/${id}/`);
    return response.data;
  }

  async activate(id: number) {
    const response = await api.post(`/services/${id}/activate/`);
    return response.data;
  }

  async deactivate(id: number) {
    const response = await api.post(`/services/${id}/deactivate/`);
    return response.data;
  }

  async getActive() {
    const response = await api.get('/services/active/');
    return response.data;
  }

  async getPricing() {
    const response = await api.get('/services/pricing/');
    return response.data;
  }
}

export default new ServiceService();

