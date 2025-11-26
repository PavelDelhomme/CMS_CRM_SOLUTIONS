import api from '@/lib/api';

export interface SystemSettings {
  id: number;
  site_name: string;
  site_url: string;
  contact_email: string;
  support_email: string;
  email_host: string;
  email_port: number;
  email_use_tls: boolean;
  email_use_ssl: boolean;
  email_host_user: string;
  email_host_password: string;
  email_from: string;
  default_trial_days: number;
  enable_trial: boolean;
  password_min_length: number;
  require_email_verification: boolean;
  session_timeout_minutes: number;
  max_login_attempts: number;
  lockout_duration_minutes: number;
  default_currency: string;
  tax_rate: number;
  invoice_prefix: string;
  payment_terms_days: number;
  max_file_size_mb: number;
  allowed_file_types: string[];
  enable_email_notifications: boolean;
  notify_on_new_tenant: boolean;
  notify_on_payment_failed: boolean;
  notify_on_subscription_expiring: boolean;
  maintenance_mode: boolean;
  maintenance_message: string;
  extra_settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

class SettingsService {
  async getSettings(): Promise<SystemSettings> {
    // For singleton pattern, list endpoint returns the single instance
    const response = await api.get('/system-settings/');
    return response.data;
  }

  async updateSettings(settings: Partial<SystemSettings>): Promise<SystemSettings> {
    // Get the current settings first to get the ID
    const current = await this.getSettings();
    // Update using the ID
    const response = await api.patch(`/system-settings/${current.id}/`, settings);
    return response.data;
  }

  async testEmail(): Promise<{ status: string; message: string }> {
    const response = await api.get('/system-settings/test_email/');
    return response.data;
  }
}

export default new SettingsService();

