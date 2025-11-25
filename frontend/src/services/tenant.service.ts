import api from '@/lib/api';

export interface Tenant {
  id: number;
  name: string;
  slug: string;
  email: string;
  domain?: string;
  subdomain?: string;
  plan: 'starter' | 'business' | 'enterprise';
  status: 'active' | 'suspended' | 'trial' | 'cancelled' | 'deleted';
  trial_ends_at?: string;
  subscribed_at?: string;
  settings?: any;
  primary_color: string;
  secondary_color: string;
  created_at: string;
  deleted_at?: string | null;
}

class TenantService {
  async getAll(params?: {
    search?: string;
    status?: string;
    plan?: string;
    page?: number;
    per_page?: number;
  }) {
    const response = await api.get('/tenants/', { params });
    return response.data;
  }

  async getById(id: number) {
    const response = await api.get(`/tenants/${id}/`);
    return response.data;
  }

  async create(data: Partial<Tenant>) {
    const response = await api.post('/tenants/', data);
    return response.data;
  }

  async update(id: number, data: Partial<Tenant>) {
    const response = await api.put(`/tenants/${id}/`, data);
    return response.data;
  }

  async delete(id: number) {
    const response = await api.delete(`/tenants/${id}/`);
    return response.data;
  }

  async suspend(id: number) {
    const response = await api.post(`/tenants/${id}/suspend/`);
    return response.data;
  }

  async activate(id: number) {
    const response = await api.post(`/tenants/${id}/activate/`);
    return response.data;
  }

  async restore(id: number) {
    const response = await api.post(`/tenants/${id}/restore/`);
    return response.data;
  }
}

export default new TenantService();

