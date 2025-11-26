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
  order: number;
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
  // Detailed stats
  invoices_count?: number;
  unpaid_invoices_count?: number;
  total_invoiced?: number;
  total_paid?: number;
  unpaid_amount?: number;
  last_invoice_date?: string;
  last_payment_date?: string;
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

export interface PaymentMethod {
  id: number;
  name: string;
  method_type: 'card' | 'bank_transfer' | 'paypal' | 'stripe' | 'check' | 'cash' | 'other';
  description?: string;
  is_active: boolean;
  is_enabled: boolean;
  requires_validation: boolean;
  settings: Record<string, any>;
  icon?: string;
  order: number;
  fee_percentage: number;
  fee_fixed: number;
  min_amount?: number;
  max_amount?: number;
  created_at: string;
  updated_at: string;
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

  async deletePricingPlan(id: number) {
    const response = await api.delete(`/pricing-plans/${id}/`);
    return response.data;
  }

  async movePlanUp(id: number) {
    const response = await api.post(`/pricing-plans/${id}/move_up/`);
    return response.data;
  }

  async movePlanDown(id: number) {
    const response = await api.post(`/pricing-plans/${id}/move_down/`);
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

  async getSubscriptionDetails(id: number) {
    const response = await api.get(`/subscriptions/${id}/details/`);
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

  async activateSubscription(id: number) {
    const response = await api.post(`/subscriptions/${id}/activate/`);
    return response.data;
  }

  async suspendSubscription(id: number) {
    const response = await api.post(`/subscriptions/${id}/suspend/`);
    return response.data;
  }

  async updateSubscriptionPlan(id: number, planId: number) {
    const response = await api.post(`/subscriptions/${id}/update_plan/`, { plan_id: planId });
    return response.data;
  }

  async updateSubscriptionStatus(id: number, status: string) {
    const response = await api.post(`/subscriptions/${id}/update_status/`, { status });
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

  async sendInvoiceReminder(id: number) {
    const response = await api.post(`/invoices/${id}/send_reminder/`);
    return response.data;
  }

  async generateInvoice(subscriptionId: number) {
    const response = await api.post(`/invoices/generate/`, { subscription_id: subscriptionId });
    return response.data;
  }

  async downloadInvoicePdf(id: number) {
    // Get token for authentication
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const apiUrl = typeof window !== 'undefined' 
      ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9495')
      : 'http://localhost:9495';
    
    const response = await fetch(`${apiUrl}/api/invoices/${id}/download_pdf/`, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      },
    });
    
    if (!response.ok) {
      throw new Error('Erreur lors du téléchargement');
    }
    
    return response.blob();
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

  // Unpaid items (super admin only)
  async getUnpaidItems() {
    const response = await api.get('/billing/unpaid-items/');
    return response.data;
  }

  // Payment Methods
  async getPaymentMethods() {
    const response = await api.get('/payment-methods/');
    return Array.isArray(response.data) ? response.data : response.data.results || [];
  }

  async getPaymentMethod(id: number) {
    const response = await api.get(`/payment-methods/${id}/`);
    return response.data;
  }

  async createPaymentMethod(data: Partial<PaymentMethod>) {
    const response = await api.post('/payment-methods/', data);
    return response.data;
  }

  async updatePaymentMethod(id: number, data: Partial<PaymentMethod>) {
    const response = await api.put(`/payment-methods/${id}/`, data);
    return response.data;
  }

  async deletePaymentMethod(id: number) {
    const response = await api.delete(`/payment-methods/${id}/`);
    return response.data;
  }

  async togglePaymentMethodEnabled(id: number) {
    const response = await api.post(`/payment-methods/${id}/toggle_enabled/`);
    return response.data;
  }
}

export default new BillingService();

