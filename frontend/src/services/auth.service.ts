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
    const response = await api.post('/auth/login', credentials);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  }

  async register(data: RegisterData) {
    const response = await api.post('/auth/register', data);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  }

  async logout() {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }

  async getCurrentUser(): Promise<User> {
    const response = await api.get('/auth/me');
    localStorage.setItem('user', JSON.stringify(response.data.user));
    return response.data.user;
  }

  async updateProfile(data: Partial<User>) {
    const response = await api.put('/auth/profile', data);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    return response.data;
  }

  async updatePassword(data: { current_password: string; password: string; password_confirmation: string }) {
    const response = await api.put('/auth/password', data);
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
    return user?.roles?.some((role: any) => role.name === 'super-admin') || false;
  }

  isTenantAdmin(): boolean {
    const user = this.getStoredUser();
    return user?.roles?.some((role: any) => role.name === 'tenant-admin') || false;
  }
}

export default new AuthService();

