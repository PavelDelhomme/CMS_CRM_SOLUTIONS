import api from '@/lib/api';

export interface Booking {
  id: number;
  tenant_id: number;
  service_id?: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  pickup_address: string;
  pickup_lat?: string;
  pickup_lng?: string;
  dropoff_address: string;
  dropoff_lat?: string;
  dropoff_lng?: string;
  pickup_datetime: string;
  estimated_duration?: number;
  estimated_distance?: number;
  estimated_price: number;
  final_price?: number;
  currency: string;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_method?: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string | null;
  cancellation_reason?: string;
  created_at: string;
  updated_at: string;
}

class BookingService {
  async getAll(params?: { 
    status?: string;
    date_from?: string;
    date_to?: string;
    customer_email?: string;
  }) {
    const response = await api.get('/bookings/', { params });
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
    const response = await api.get(`/bookings/${id}/`);
    return response.data;
  }

  async create(data: Partial<Booking>) {
    const response = await api.post('/bookings/', data);
    return response.data;
  }

  async update(id: number, data: Partial<Booking>) {
    const response = await api.patch(`/bookings/${id}/`, data);
    return response.data;
  }

  async delete(id: number) {
    const response = await api.delete(`/bookings/${id}/`);
    return response.data;
  }

  async confirm(id: number) {
    const response = await api.post(`/bookings/${id}/confirm/`);
    return response.data;
  }

  async complete(id: number) {
    const response = await api.post(`/bookings/${id}/complete/`);
    return response.data;
  }

  async cancel(id: number, reason?: string) {
    const response = await api.post(`/bookings/${id}/cancel/`, { reason });
    return response.data;
  }

  async getToday() {
    const response = await api.get('/bookings/today/');
    return response.data;
  }
}

export default new BookingService();

