import api from '@/lib/api';

export interface Tenant {
  id: number;
  name: string;
  slug: string;
  email: string;
  domain?: string;
  subdomain?: string;
  plan: 'starter' | 'business' | 'enterprise';
  status: 'active' | 'suspended' | 'trial' | 'cancelled';
  trial_ends_at?: string;
  subscribed_at?: string;
  settings?: any;
  primary_color: string;
  secondary_color: string;
  created_at: string;
}

class TenantService {
  async getAll(params?: {
    search?: string;
    status?: string;
    plan?: string;
    page?: number;
    per_page?: number;
  }) {
    const response = await api.get('/admin/tenants', { params });
    return response.data;
  }

  async getById(id: number) {
    const response = await api.get(`/admin/tenants/${id}`);
    return response.data.tenant;
  }

  async create(data: Partial<Tenant>) {
    const response = await api.post('/admin/tenants', data);
    return response.data;
  }

  async update(id: number, data: Partial<Tenant>) {
    const response = await api.put(`/admin/tenants/${id}`, data);
    return response.data;
  }

  async delete(id: number) {
    const response = await api.delete(`/admin/tenants/${id}`);
    return response.data;
  }

  async suspend(id: number) {
    const response = await api.post(`/admin/tenants/${id}/suspend`);
    return response.data;
  }

  async activate(id: number) {
    const response = await api.post(`/admin/tenants/${id}/activate`);
    return response.data;
  }
}

export default new TenantService();

