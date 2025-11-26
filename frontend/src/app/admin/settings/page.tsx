'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import authService from '@/services/auth.service'
import AdminLayout from '@/components/AdminLayout'
import settingsService, { SystemSettings } from '@/services/settings.service'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testingEmail, setTestingEmail] = useState(false)
  const [settings, setSettings] = useState<SystemSettings | null>(null)
  const [activeTab, setActiveTab] = useState<'general' | 'email' | 'security' | 'billing' | 'storage' | 'notifications' | 'maintenance'>('general')

  useEffect(() => {
    if (!authService.isSuperAdmin()) {
      router.push('/dashboard')
      return
    }
    loadSettings()
  }, [router])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const data = await settingsService.getSettings()
      setSettings(data)
    } catch (error: any) {
      console.error('Erreur chargement paramètres:', error)
      toast.error('Erreur lors du chargement des paramètres')
      // Si les paramètres n'existent pas, créer avec des valeurs par défaut
      if (error.response?.status === 404) {
        const defaultSettings = {
          site_name: 'VTCBuilder',
          site_url: 'http://localhost:9494',
          contact_email: 'contact@vtcbuilder.com',
          support_email: 'support@vtcbuilder.com',
        }
        try {
          await settingsService.updateSettings(defaultSettings)
          loadSettings()
        } catch (err) {
          console.error('Erreur création paramètres:', err)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!settings) return

    try {
      setSaving(true)
      await settingsService.updateSettings(settings)
      toast.success('Paramètres sauvegardés avec succès !')
    } catch (error: any) {
      console.error('Erreur sauvegarde paramètres:', error)
      toast.error(error.response?.data?.error || 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const handleTestEmail = async () => {
    try {
      setTestingEmail(true)
      const result = await settingsService.testEmail()
      if (result.status === 'success') {
        toast.success(result.message || 'Email de test envoyé avec succès !')
      } else {
        toast.error(result.message || 'Erreur lors de l\'envoi de l\'email de test')
      }
    } catch (error: any) {
      console.error('Erreur test email:', error)
      toast.error(error.response?.data?.message || 'Erreur lors du test email')
    } finally {
      setTestingEmail(false)
    }
  }

  const updateSetting = (field: keyof SystemSettings, value: any) => {
    if (!settings) return
    setSettings({ ...settings, [field]: value })
  }

  if (loading) {
    return (
      <AdminLayout title="Paramètres">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement des paramètres...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (!settings) {
    return (
      <AdminLayout title="Paramètres">
        <div className="text-center py-12">
          <p className="text-gray-600">Impossible de charger les paramètres</p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout
      title="Paramètres"
      subtitle="Configuration de la plateforme VTCBuilder"
    >
      <div className="space-y-6">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-4 overflow-x-auto">
            {[
              { id: 'general', label: 'Général', icon: '⚙️' },
              { id: 'email', label: 'Email', icon: '📧' },
              { id: 'security', label: 'Sécurité', icon: '🔒' },
              { id: 'billing', label: 'Facturation', icon: '💳' },
              { id: 'storage', label: 'Stockage', icon: '📦' },
              { id: 'notifications', label: 'Notifications', icon: '🔔' },
              { id: 'maintenance', label: 'Maintenance', icon: '🔧' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-4 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* General Tab */}
        {activeTab === 'general' && (
          <div className="bg-white rounded-lg shadow p-6 space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Paramètres Généraux</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom du site
                </label>
                <input
                  type="text"
                  value={settings.site_name}
                  onChange={(e) => updateSetting('site_name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL du site
                </label>
                <input
                  type="url"
                  value={settings.site_url}
                  onChange={(e) => updateSetting('site_url', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email de contact
                </label>
                <input
                  type="email"
                  value={settings.contact_email}
                  onChange={(e) => updateSetting('contact_email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email de support
                </label>
                <input
                  type="email"
                  value={settings.support_email}
                  onChange={(e) => updateSetting('support_email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Email Tab */}
        {activeTab === 'email' && (
          <div className="bg-white rounded-lg shadow p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Configuration Email</h2>
              <button
                onClick={handleTestEmail}
                disabled={testingEmail}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {testingEmail ? 'Test en cours...' : 'Tester l\'envoi d\'email'}
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Serveur SMTP (Host)
                </label>
                <input
                  type="text"
                  value={settings.email_host}
                  onChange={(e) => updateSetting('email_host', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="smtp.maily.ovh"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Port SMTP
                </label>
                <input
                  type="number"
                  value={settings.email_port}
                  onChange={(e) => updateSetting('email_port', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="587"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Utilisateur SMTP
                </label>
                <input
                  type="text"
                  value={settings.email_host_user || ''}
                  onChange={(e) => updateSetting('email_host_user', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mot de passe SMTP
                </label>
                <input
                  type="password"
                  value={settings.email_host_password || ''}
                  onChange={(e) => updateSetting('email_host_password', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email expéditeur
                </label>
                <input
                  type="email"
                  value={settings.email_from}
                  onChange={(e) => updateSetting('email_from', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="noreply@vtcbuilder.com"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.email_use_tls}
                  onChange={(e) => updateSetting('email_use_tls', e.target.checked)}
                  className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-700">Utiliser TLS</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.email_use_ssl}
                  onChange={(e) => updateSetting('email_use_ssl', e.target.checked)}
                  className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-700">Utiliser SSL</span>
              </label>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="bg-white rounded-lg shadow p-6 space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Paramètres de Sécurité</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Longueur minimale du mot de passe
                </label>
                <input
                  type="number"
                  value={settings.password_min_length}
                  onChange={(e) => updateSetting('password_min_length', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Durée de session (minutes)
                </label>
                <input
                  type="number"
                  value={settings.session_timeout_minutes}
                  onChange={(e) => updateSetting('session_timeout_minutes', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min={1}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre maximum de tentatives de connexion
                </label>
                <input
                  type="number"
                  value={settings.max_login_attempts}
                  onChange={(e) => updateSetting('max_login_attempts', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min={1}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Durée de verrouillage (minutes)
                </label>
                <input
                  type="number"
                  value={settings.lockout_duration_minutes}
                  onChange={(e) => updateSetting('lockout_duration_minutes', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min={1}
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.require_email_verification}
                  onChange={(e) => updateSetting('require_email_verification', e.target.checked)}
                  className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-700">Exiger la vérification de l'email</span>
              </label>
            </div>
          </div>
        )}

        {/* Billing Tab */}
        {activeTab === 'billing' && (
          <div className="bg-white rounded-lg shadow p-6 space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Paramètres de Facturation</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Devise par défaut
                </label>
                <select
                  value={settings.default_currency}
                  onChange={(e) => updateSetting('default_currency', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="EUR">EUR (€)</option>
                  <option value="USD">USD ($)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Taux de TVA (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={settings.tax_rate}
                  onChange={(e) => updateSetting('tax_rate', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min={0}
                  max={100}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Préfixe facture
                </label>
                <input
                  type="text"
                  value={settings.invoice_prefix}
                  onChange={(e) => updateSetting('invoice_prefix', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="INV-"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Délai de paiement (jours)
                </label>
                <input
                  type="number"
                  value={settings.payment_terms_days}
                  onChange={(e) => updateSetting('payment_terms_days', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min={1}
                />
              </div>
            </div>
          </div>
        )}

        {/* Storage Tab */}
        {activeTab === 'storage' && (
          <div className="bg-white rounded-lg shadow p-6 space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Paramètres de Stockage</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Taille maximale de fichier (MB)
                </label>
                <input
                  type="number"
                  value={settings.max_file_size_mb}
                  onChange={(e) => updateSetting('max_file_size_mb', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min={1}
                />
              </div>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="bg-white rounded-lg shadow p-6 space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Paramètres de Notifications</h2>
            
            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.enable_email_notifications}
                  onChange={(e) => updateSetting('enable_email_notifications', e.target.checked)}
                  className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-700">Activer les notifications par email</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.notify_on_new_tenant}
                  onChange={(e) => updateSetting('notify_on_new_tenant', e.target.checked)}
                  className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-700">Notifier lors de la création d'un nouveau tenant</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.notify_on_payment_failed}
                  onChange={(e) => updateSetting('notify_on_payment_failed', e.target.checked)}
                  className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-700">Notifier lors d'un échec de paiement</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.notify_on_subscription_expiring}
                  onChange={(e) => updateSetting('notify_on_subscription_expiring', e.target.checked)}
                  className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-700">Notifier lors de l'expiration d'un abonnement</span>
              </label>
            </div>
          </div>
        )}

        {/* Maintenance Tab */}
        {activeTab === 'maintenance' && (
          <div className="bg-white rounded-lg shadow p-6 space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Mode Maintenance</h2>
            
            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.maintenance_mode}
                  onChange={(e) => updateSetting('maintenance_mode', e.target.checked)}
                  className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-700">Activer le mode maintenance</span>
              </label>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message de maintenance
                </label>
                <textarea
                  value={settings.maintenance_message}
                  onChange={(e) => updateSetting('maintenance_message', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Le site est en maintenance. Veuillez revenir plus tard."
                />
              </div>
            </div>
          </div>
        )}

        {/* Trial Settings */}
        {activeTab === 'general' && (
          <div className="bg-white rounded-lg shadow p-6 space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Paramètres d'Essai</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    checked={settings.enable_trial}
                    onChange={(e) => updateSetting('enable_trial', e.target.checked)}
                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Activer la période d'essai</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Durée de l'essai (jours)
                </label>
                <input
                  type="number"
                  value={settings.default_trial_days}
                  onChange={(e) => updateSetting('default_trial_days', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min={0}
                  disabled={!settings.enable_trial}
                />
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {saving ? 'Sauvegarde...' : 'Enregistrer les paramètres'}
          </button>
        </div>
      </div>
    </AdminLayout>
  )
}
