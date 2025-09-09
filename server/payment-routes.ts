import type { Express } from "express";
import { PaystackService } from "./paystack-service";
import { storage } from "./storage";
import { isAuthenticated } from "./replitAuth";

const paystack = new PaystackService();

export function registerPaymentRoutes(app: Express) {
  // Initialize payment
  app.post('/api/payments/initialize', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { plan, amount, currency = 'USD' } = req.body;

      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      if (!plan || !amount) {
        return res.status(400).json({ message: 'Plan and amount are required' });
      }

      const user = await storage.getUser(userId);
      if (!user || !user.email) {
        return res.status(400).json({ message: 'User email is required for payment' });
      }

      // Initialize payment with Paystack
      const paymentData = await paystack.initializePayment({
        email: user.email,
        amount: PaystackService.toCents(amount), // Convert to cents for USD
        currency,
        callback_url: `${req.protocol}://${req.get('host')}/payment/callback`,
        metadata: {
          userId,
          plan,
          user_name: `${user.firstName || ''} ${user.lastName || ''}`.trim()
        }
      });

      // Store payment in database
      await storage.createPayment({
        userId,
        reference: paymentData.reference,
        amount: PaystackService.toCents(amount),
        currency,
        status: 'pending',
        metadata: { plan, user_email: user.email }
      });

      res.json({
        status: 'success',
        data: {
          authorization_url: paymentData.authorization_url,
          access_code: paymentData.access_code,
          reference: paymentData.reference
        }
      });

    } catch (error) {
      console.error('Payment initialization error:', error);
      res.status(500).json({ 
        message: 'Failed to initialize payment', 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Verify payment
  app.get('/api/payments/verify/:reference', isAuthenticated, async (req: any, res) => {
    try {
      const { reference } = req.params;
      const userId = req.user?.claims?.sub;

      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      // Get payment from database
      const payment = await storage.getPayment(reference);
      if (!payment) {
        return res.status(404).json({ message: 'Payment not found' });
      }

      if (payment.userId !== userId) {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Verify with Paystack
      const verificationData = await paystack.verifyPayment(reference);

      // Update payment status
      const updatedPayment = await storage.updatePayment(reference, {
        status: verificationData.status,
        paystackId: verificationData.id,
        channel: verificationData.channel,
        gatewayResponse: verificationData.gateway_response,
        paidAt: verificationData.status === 'success' ? new Date(verificationData.paid_at) : null
      });

      // If payment is successful, create/update subscription
      if (verificationData.status === 'success') {
        const plan = payment.metadata?.plan;
        if (plan) {
          const endDate = new Date();
          endDate.setMonth(endDate.getMonth() + (plan === 'professional' ? 12 : 1)); // 12 months for professional, 1 month for premium

          // Check if user already has a subscription
          const existingSubscription = await storage.getUserSubscription(userId);
          
          if (existingSubscription) {
            await storage.updateSubscription(existingSubscription.id, {
              plan,
              status: 'active',
              amount: payment.amount,
              currency: payment.currency,
              endDate,
              paymentReference: reference,
              updatedAt: new Date()
            });
          } else {
            await storage.createSubscription({
              userId,
              plan,
              status: 'active',
              amount: payment.amount,
              currency: payment.currency,
              endDate,
              paymentReference: reference
            });
          }
        }
      }

      res.json({
        status: 'success',
        data: {
          payment: updatedPayment,
          verification: verificationData
        }
      });

    } catch (error) {
      console.error('Payment verification error:', error);
      res.status(500).json({ 
        message: 'Failed to verify payment', 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get user subscription
  app.get('/api/subscription', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;

      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const subscription = await storage.getUserSubscription(userId);
      
      if (!subscription) {
        return res.json({ subscription: null });
      }

      // Check if subscription is expired
      const now = new Date();
      if (subscription.endDate < now && subscription.status === 'active') {
        // Mark as expired
        await storage.updateSubscription(subscription.id, { status: 'expired' });
        subscription.status = 'expired';
      }

      res.json({ subscription });

    } catch (error) {
      console.error('Subscription fetch error:', error);
      res.status(500).json({ message: 'Failed to fetch subscription' });
    }
  });

  // Get user payment history
  app.get('/api/payments/history', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;

      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const payments = await storage.getUserPayments(userId, 20);
      res.json({ payments });

    } catch (error) {
      console.error('Payment history error:', error);
      res.status(500).json({ message: 'Failed to fetch payment history' });
    }
  });

  // Paystack webhook endpoint
  app.post('/api/webhooks/paystack', async (req, res) => {
    try {
      const signature = req.headers['x-paystack-signature'] as string;
      const payload = JSON.stringify(req.body);

      if (!process.env.PAYSTACK_SECRET_KEY) {
        return res.status(500).json({ message: 'Paystack secret key not configured' });
      }

      // Verify webhook signature
      const isValidSignature = PaystackService.verifyWebhookSignature(
        payload,
        signature,
        process.env.PAYSTACK_SECRET_KEY
      );

      if (!isValidSignature) {
        return res.status(400).json({ message: 'Invalid signature' });
      }

      const event = req.body;
      
      if (event.event === 'charge.success') {
        const reference = event.data.reference;
        
        // Update payment status in database
        await storage.updatePayment(reference, {
          status: 'success',
          paystackId: event.data.id,
          channel: event.data.channel,
          gatewayResponse: event.data.gateway_response,
          paidAt: new Date(event.data.paid_at)
        });

        console.log(`Payment successful: ${reference}`);
      }

      res.status(200).json({ message: 'Webhook processed' });

    } catch (error) {
      console.error('Webhook error:', error);
      res.status(500).json({ message: 'Webhook processing failed' });
    }
  });

  // Payment callback page (for redirect method)
  app.get('/payment/callback', async (req, res) => {
    const { reference } = req.query;
    
    if (!reference) {
      return res.redirect('/?payment=failed');
    }

    try {
      // Verify payment
      const verificationData = await paystack.verifyPayment(reference as string);
      
      if (verificationData.status === 'success') {
        res.redirect('/?payment=success');
      } else {
        res.redirect('/?payment=failed');
      }
    } catch (error) {
      console.error('Payment callback error:', error);
      res.redirect('/?payment=error');
    }
  });
}