import api from '@/lib/api';

export interface User {
  id: number;
  email: string;
  name: string;
  username: string;
  first_name?: string;
  last_name?: string;
  role: string;
  status: string;
  tenant?: { id: number; name: string };
  tenant_id?: number;
  tenant_name?: string;
  avatar?: string;
  phone?: string;
  created_at: string;
}

class UserService {
  async getAll(params?: {
    search?: string;
    status?: string;
    role?: string;
    tenant_id?: number;
  }) {
    const response = await api.get('/users/', { params });
    return Array.isArray(response.data) ? response.data : response.data.results || [];
  }

  async getById(id: number) {
    const response = await api.get(`/users/${id}/`);
    return response.data;
  }

  async create(data: Partial<User>) {
    const response = await api.post('/users/', data);
    return response.data;
  }

  async update(id: number, data: Partial<User>) {
    const response = await api.put(`/users/${id}/`, data);
    return response.data;
  }

  async delete(id: number) {
    const response = await api.delete(`/users/${id}/`);
    return response.data;
  }

  async activate(id: number) {
    const response = await api.post(`/users/${id}/activate/`);
    return response.data;
  }

  async deactivate(id: number) {
    const response = await api.post(`/users/${id}/deactivate/`);
    return response.data;
  }

  async suspend(id: number) {
    const response = await api.post(`/users/${id}/suspend/`);
    return response.data;
  }

  async sendPasswordReset(id: number) {
    const response = await api.post(`/users/${id}/send_password_reset/`);
    return response.data;
  }
}

export default new UserService();

