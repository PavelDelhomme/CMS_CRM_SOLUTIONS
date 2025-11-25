import api from '@/lib/api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  phone?: string;
  company_name?: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  tenant_id?: number;
  roles: any[];
  permissions: any[];
}

class AuthService {
  async login(credentials: LoginCredentials) {
    const response = await api.post('/auth/login/', credentials);
    if (response.data.tokens?.access) {
      localStorage.setItem('token', response.data.tokens.access);
      localStorage.setItem('refresh_token', response.data.tokens.refresh);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  }

  async register(data: RegisterData) {
    const response = await api.post('/auth/register/', data);
    if (response.data.tokens?.access) {
      localStorage.setItem('token', response.data.tokens.access);
      localStorage.setItem('refresh_token', response.data.tokens.refresh);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  }

  async logout() {
    try {
      await api.post('/auth/logout/');
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    }
  }

  async getCurrentUser(): Promise<User> {
    const response = await api.get('/auth/me/');
    localStorage.setItem('user', JSON.stringify(response.data));
    return response.data;
  }

  async updateProfile(data: Partial<User>) {
    const response = await api.put('/auth/me/', data);
    localStorage.setItem('user', JSON.stringify(response.data));
    return response.data;
  }

  async updatePassword(data: { current_password: string; password: string; password_confirmation: string }) {
    const response = await api.put('/auth/password/', data);
    return response.data;
  }

  getStoredUser(): User | null {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  isSuperAdmin(): boolean {
    const user = this.getStoredUser();
    if (!user || !user.roles) return false;
    return user.roles.some((role: any) => {
      const roleValue = typeof role === 'string' ? role : role.name || role.role;
      return roleValue === 'super-admin';
    }) || user.role === 'super-admin';
  }

  isTenantAdmin(): boolean {
    const user = this.getStoredUser();
    if (!user || !user.roles) return false;
    return user.roles.some((role: any) => {
      const roleValue = typeof role === 'string' ? role : role.name || role.role;
      return roleValue === 'tenant-admin';
    }) || user.role === 'tenant-admin';
  }
}

export default new AuthService();

