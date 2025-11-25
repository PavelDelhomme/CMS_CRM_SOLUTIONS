import api from '@/lib/api';

export interface PricingPlan {
  id: number;
  name: string;
  slug: string;
  description: string;
  price_monthly: number;
  price_yearly?: number;
  currency: string;
  max_sites: number;
  max_users: number;
  max_storage_gb: number;
  features: string[];
  is_active: boolean;
  is_featured: boolean;
}

export interface Subscription {
  id: number;
  tenant: any;
  plan: PricingPlan;
  status: 'trial' | 'active' | 'past_due' | 'cancelled' | 'expired';
  billing_cycle: 'monthly' | 'yearly';
  trial_start?: string;
  trial_end?: string;
  current_period_start: string;
  current_period_end: string;
  cancelled_at?: string;
  stripe_subscription_id?: string;
  stripe_customer_id?: string;
}

export interface Invoice {
  id: number;
  subscription: Subscription;
  tenant: any;
  invoice_number: string;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  issue_date: string;
  due_date: string;
  paid_at?: string;
  stripe_invoice_id?: string;
  pdf_url?: string;
}

export interface Payment {
  id: number;
  invoice: Invoice;
  tenant: any;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'refunded';
  method: 'card' | 'bank_transfer' | 'paypal' | 'other';
  stripe_payment_intent_id?: string;
  paid_at?: string;
}

class BillingService {
  // Pricing Plans
  async getPricingPlans() {
    const response = await api.get('/pricing-plans/');
    return Array.isArray(response.data) ? response.data : response.data.results || [];
  }

  async getPricingPlan(id: number) {
    const response = await api.get(`/pricing-plans/${id}/`);
    return response.data;
  }

  async createPricingPlan(data: Partial<PricingPlan>) {
    const response = await api.post('/pricing-plans/', data);
    return response.data;
  }

  async updatePricingPlan(id: number, data: Partial<PricingPlan>) {
    const response = await api.put(`/pricing-plans/${id}/`, data);
    return response.data;
  }

  // Subscriptions
  async getSubscriptions() {
    const response = await api.get('/subscriptions/');
    return Array.isArray(response.data) ? response.data : response.data.results || [];
  }

  async getSubscription(id: number) {
    const response = await api.get(`/subscriptions/${id}/`);
    return response.data;
  }

  async createSubscription(data: Partial<Subscription>) {
    const response = await api.post('/subscriptions/', data);
    return response.data;
  }

  async cancelSubscription(id: number) {
    const response = await api.post(`/subscriptions/${id}/cancel/`);
    return response.data;
  }

  async reactivateSubscription(id: number) {
    const response = await api.post(`/subscriptions/${id}/reactivate/`);
    return response.data;
  }

  // Invoices
  async getInvoices() {
    const response = await api.get('/invoices/');
    return Array.isArray(response.data) ? response.data : response.data.results || [];
  }

  async getInvoice(id: number) {
    const response = await api.get(`/invoices/${id}/`);
    return response.data;
  }

  async markInvoicePaid(id: number) {
    const response = await api.post(`/invoices/${id}/mark_paid/`);
    return response.data;
  }

  // Payments
  async getPayments() {
    const response = await api.get('/payments/');
    return Array.isArray(response.data) ? response.data : response.data.results || [];
  }

  async getPayment(id: number) {
    const response = await api.get(`/payments/${id}/`);
    return response.data;
  }

  // Stats (super admin only)
  async getBillingStats() {
    const response = await api.get('/billing/stats/');
    return response.data;
  }
}

export default new BillingService();

