/**
 * Stripe service for payment processing
 */
import api from '@/lib/api'

export interface StripeSubscriptionResult {
  subscription_id: string
  customer_id: string
  client_secret?: string
  status: string
}

export interface PaymentIntentResult {
  client_secret: string
  payment_intent_id: string
}

export interface PaymentMethod {
  id: string
  type: string
  card?: {
    brand: string
    last4: string
    exp_month: number
    exp_year: number
  }
}

class StripeService {
  /**
   * Create Stripe subscription for an existing subscription
   */
  async createSubscription(
    subscriptionId: number,
    paymentMethodId?: string
  ): Promise<StripeSubscriptionResult> {
    const response = await api.post(
      `/subscriptions/${subscriptionId}/create_stripe_subscription/`,
      { payment_method_id: paymentMethodId }
    )
    return response.data
  }

  /**
   * Create payment intent
   */
  async createPaymentIntent(
    subscriptionId: number,
    amount: number
  ): Promise<PaymentIntentResult> {
    const response = await api.post(
      `/subscriptions/${subscriptionId}/create_payment_intent/`,
      { amount }
    )
    return response.data
  }

  /**
   * Get payment methods for a customer
   */
  async getPaymentMethods(customerId: string): Promise<PaymentMethod[]> {
    try {
      const response = await api.get(`/payment-methods/?customer_id=${customerId}`)
      return response.data.results || response.data || []
    } catch (error: any) {
      if (error.response?.status === 404) {
        return []
      }
      throw error
    }
  }

  /**
   * Attach payment method to customer
   */
  async attachPaymentMethod(
    customerId: string,
    paymentMethodId: string
  ): Promise<PaymentMethod> {
    const response = await api.post('/payment-methods/', {
      customer_id: customerId,
      payment_method_id: paymentMethodId,
    })
    return response.data
  }

  /**
   * Update subscription plan
   */
  async updatePlan(
    subscriptionId: number,
    planId: number,
    billingCycle?: string
  ): Promise<any> {
    const response = await api.post(`/subscriptions/${subscriptionId}/update_plan/`, {
      plan_id: planId,
      billing_cycle: billingCycle,
    })
    return response.data
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId: number): Promise<any> {
    const response = await api.post(`/subscriptions/${subscriptionId}/cancel/`)
    return response.data
  }

  /**
   * Reactivate subscription
   */
  async reactivateSubscription(subscriptionId: number): Promise<any> {
    const response = await api.post(`/subscriptions/${subscriptionId}/reactivate/`)
    return response.data
  }
}

export default new StripeService()

