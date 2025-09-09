import https from 'https';

interface PaystackResponse {
  status: boolean;
  message: string;
  data: any;
}

interface PaystackInitializeData {
  authorization_url: string;
  access_code: string;
  reference: string;
}

interface PaystackVerifyData {
  id: number;
  domain: string;
  status: string;
  reference: string;
  amount: number;
  message: string | null;
  gateway_response: string;
  paid_at: string;
  created_at: string;
  channel: string;
  currency: string;
  ip_address: string;
  metadata: any;
  log: any;
  fees: number;
  fees_split: any;
  authorization: {
    authorization_code: string;
    bin: string;
    last4: string;
    exp_month: string;
    exp_year: string;
    channel: string;
    card_type: string;
    bank: string;
    country_code: string;
    brand: string;
    reusable: boolean;
    signature: string;
    account_name: string | null;
  };
  customer: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    customer_code: string;
    phone: string;
    metadata: any;
    risk_action: string;
    international_format_phone: string | null;
  };
  plan: any;
  split: any;
  order_id: any;
  paidAt: string;
  createdAt: string;
  requested_amount: number;
  pos_transaction_data: any;
  source: any;
  fees_breakdown: any;
}

export class PaystackService {
  private secretKey: string;
  private baseUrl = 'https://api.paystack.co';

  constructor() {
    if (!process.env.PAYSTACK_SECRET_KEY) {
      throw new Error('PAYSTACK_SECRET_KEY environment variable is required');
    }
    this.secretKey = process.env.PAYSTACK_SECRET_KEY;
  }

  private async makeRequest(path: string, method: string = 'GET', data?: any): Promise<PaystackResponse> {
    return new Promise((resolve, reject) => {
      const postData = data ? JSON.stringify(data) : undefined;
      
      const options = {
        hostname: 'api.paystack.co',
        port: 443,
        path,
        method,
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json',
          ...(postData && { 'Content-Length': Buffer.byteLength(postData) })
        }
      };

      const req = https.request(options, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', () => {
          try {
            const parsedData = JSON.parse(responseData);
            resolve(parsedData);
          } catch (error) {
            reject(new Error('Invalid JSON response from Paystack'));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      if (postData) {
        req.write(postData);
      }

      req.end();
    });
  }

  async initializePayment(params: {
    email: string;
    amount: number; // Amount in cents (USD) or smallest currency unit
    reference?: string;
    callback_url?: string;
    metadata?: any;
    channels?: string[];
    currency?: string;
  }): Promise<PaystackInitializeData> {
    // Generate reference if not provided
    if (!params.reference) {
      params.reference = 'DA_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    const response = await this.makeRequest('/transaction/initialize', 'POST', params);
    
    if (!response.status) {
      throw new Error(response.message || 'Failed to initialize payment');
    }

    return response.data;
  }

  async verifyPayment(reference: string): Promise<PaystackVerifyData> {
    const response = await this.makeRequest(`/transaction/verify/${reference}`);
    
    if (!response.status) {
      throw new Error(response.message || 'Failed to verify payment');
    }

    return response.data;
  }

  async listTransactions(params?: {
    perPage?: number;
    page?: number;
    customer?: number;
    status?: 'failed' | 'success' | 'abandoned';
    from?: string;
    to?: string;
    amount?: number;
  }): Promise<any[]> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const path = `/transaction${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await this.makeRequest(path);
    
    if (!response.status) {
      throw new Error(response.message || 'Failed to fetch transactions');
    }

    return response.data;
  }

  async createCustomer(params: {
    email: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    metadata?: any;
  }): Promise<any> {
    const response = await this.makeRequest('/customer', 'POST', params);
    
    if (!response.status) {
      throw new Error(response.message || 'Failed to create customer');
    }

    return response.data;
  }

  // Helper method to convert amount to cents (for USD)
  static toCents(amount: number): number {
    return Math.round(amount * 100);
  }

  // Helper method to convert cents to main currency
  static fromCents(amount: number): number {
    return amount / 100;
  }

  // Webhook signature verification
  static verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
    const crypto = require('crypto');
    const hash = crypto.createHmac('sha512', secret).update(payload).digest('hex');
    return hash === signature;
  }
}