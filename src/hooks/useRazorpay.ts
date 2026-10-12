import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
  handler: (response: RazorpayResponse) => void;
  modal?: {
    ondismiss?: () => void;
  };
}

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface CreateOrderParams {
  mentor_id: string;
  slot_id: string;
  problem_description: string;
  selected_duration?: number;
  selected_start_time?: string;
  selected_date?: string;
  referral_code?: string;
}

export interface PaymentResult {
  success: boolean;
  amount?: number;
  mentorName?: string;
  original_price?: number;
  discount_amount?: number;
}

interface UseRazorpayReturn {
  isLoading: boolean;
  isScriptLoaded: boolean;
  createOrderAndPay: (params: CreateOrderParams) => Promise<PaymentResult>;
}

export const useRazorpay = (): UseRazorpayReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const { toast } = useToast();

  // Load Razorpay script
  useEffect(() => {
    if (window.Razorpay) {
      setIsScriptLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      console.log('Razorpay script loaded');
      setIsScriptLoaded(true);
    };
    script.onerror = () => {
      console.error('Failed to load Razorpay script');
      toast({
        title: 'Payment Error',
        description: 'Failed to load payment gateway. Please refresh and try again.',
        variant: 'destructive',
      });
    };
    document.body.appendChild(script);

    return () => {
      // Don't remove script on unmount - it should persist
    };
  }, []);

  const createOrderAndPay = useCallback(async (params: CreateOrderParams): Promise<PaymentResult> => {
    console.log('=== RAZORPAY PAYMENT FLOW START ===');
    console.log('Params:', JSON.stringify(params, null, 2));
    console.log('Script loaded:', isScriptLoaded);
    
    if (!isScriptLoaded) {
      console.error('Razorpay script not loaded');
      toast({
        title: 'Please Wait',
        description: 'Payment gateway is loading...',
        variant: 'destructive',
      });
      return { success: false };
    }

    setIsLoading(true);

    try {
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Auth session exists:', !!session?.access_token);
      
      if (!session?.access_token) {
        console.error('No auth session');
        toast({
          title: 'Authentication Required',
          description: 'Please log in to continue with payment',
          variant: 'destructive',
        });
        setIsLoading(false);
        return { success: false };
      }

      console.log('Creating Razorpay order via edge function...');

      // Create order via edge function
      const { data: orderData, error } = await supabase.functions.invoke('create-razorpay-order', {
        body: params,
      });

      console.log('Edge function response:', { orderData, error });

      // Extract error message from various possible sources
      let errorMessage = 'Failed to create payment order';
      if (orderData?.error) {
        errorMessage = orderData.error;
        console.error('Order data error:', orderData.error);
      } else if (error?.message) {
        console.error('Function invoke error:', error);
        // Try to parse JSON error from FunctionsHttpError
        try {
          const match = error.message.match(/\{.*\}/);
          if (match) {
            const parsed = JSON.parse(match[0]);
            errorMessage = parsed.error || parsed.message || error.message;
          }
        } catch {
          errorMessage = error.message;
        }
      }

      if (error || !orderData?.success) {
        console.error('=== ORDER CREATION FAILED ===');
        console.error('Error message:', errorMessage);
        toast({
          title: 'Booking Failed',
          description: errorMessage,
          variant: 'destructive',
        });
        setIsLoading(false);
        return { success: false };
      }

      const paymentAmount = orderData.amount / 100; // Convert paise to rupees
      const mentorName = orderData.notes?.mentor_name || 'Mentor';

      console.log('=== ORDER CREATED SUCCESSFULLY ===');
      console.log('Order ID:', orderData.order_id);
      console.log('Session ID:', orderData.session_id);
      console.log('Amount:', paymentAmount, 'INR');
      console.log('Discount:', orderData.discount_amount || 0);
      console.log('Key ID:', orderData.key_id?.substring(0, 12) + '...');

      // Open Razorpay checkout
      return new Promise((resolve) => {
        let paymentVerified = false;
        let verificationAttempts = 0;
        const maxAttempts = 10; // Poll for 10 seconds
        
        const resolveWithDetails = (success: boolean) => {
          resolve(success ? { 
            success: true, 
            amount: paymentAmount, 
            mentorName,
            original_price: orderData.original_price,
            discount_amount: orderData.discount_amount || 0,
          } : { success: false });
        };

        const razorpayOptions: RazorpayOptions = {
          key: orderData.key_id,
          amount: orderData.amount,
          currency: orderData.currency,
          name: orderData.notes.mentor_name,
          description: `Session with ${orderData.notes.mentor_name}`,
          order_id: orderData.order_id,
          prefill: {
            name: orderData.prefill.name,
            email: orderData.prefill.email,
            contact: orderData.prefill.contact,
          },
          theme: {
            color: "#8B5CF6",
          },
          handler: async (response: RazorpayResponse) => {
            console.log('Payment successful callback received, verifying...', response);
            paymentVerified = true;
            setIsLoading(true);
            
            try {
              const { data: verifyData, error: verifyError } = await supabase.functions.invoke(
                'verify-razorpay-payment',
                {
                  body: {
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                    session_id: orderData.session_id,
                  },
                }
              );

              if (verifyError) {
                console.error('Verification error:', verifyError);
                toast({
                  title: "Payment Verification Failed",
                  description: "Please contact support with your payment details.",
                  variant: "destructive",
                });
                resolveWithDetails(false);
                return;
              }

              if (verifyData?.success) {
                resolveWithDetails(true);
              } else {
                toast({
                  title: "Payment Verification Failed",
                  description: verifyData?.error || "Please contact support.",
                  variant: "destructive",
                });
                resolveWithDetails(false);
              }
            } catch (error) {
              console.error('Error during verification:', error);
              toast({
                title: "Error",
                description: "Failed to verify payment.",
                variant: "destructive",
              });
              resolveWithDetails(false);
            } finally {
              setIsLoading(false);
            }
          },
          modal: {
            ondismiss: async () => {
              console.log('Payment modal dismissed by user');
              
              if (paymentVerified) {
                console.log('Payment already verified, skipping cleanup');
                return;
              }

              console.log('Waiting 3 seconds for webhook processing...');
              setIsLoading(true);
              toast({
                title: "Verifying Payment...",
                description: "Please wait while we confirm your payment.",
              });

              await new Promise(resolve => setTimeout(resolve, 3000));

              console.log('Polling payment status...');
              while (verificationAttempts < maxAttempts) {
                verificationAttempts++;
                
                try {
                  const { data: statusData, error: statusError } = await supabase.functions.invoke(
                    'check-payment-status',
                    {
                      body: { razorpay_order_id: orderData.order_id }
                    }
                  );

                  if (!statusError && statusData) {
                    console.log('Payment status check:', statusData);
                    
                    if (statusData.payment_status === 'captured' || statusData.reconciled) {
                      setIsLoading(false);
                      resolveWithDetails(true);
                      return;
                    }
                  }
                } catch (error) {
                  console.error('Error checking payment status:', error);
                }

                await new Promise(resolve => setTimeout(resolve, 1000));
              }

              console.log('Payment not confirmed after polling, cleaning up...');
              toast({
                title: "Payment Cancelled",
                description: "Your booking has been cancelled.",
                variant: "destructive",
              });

              try {
                await supabase.functions.invoke('cleanup-failed-payment', {
                  body: { session_id: orderData.session_id }
                });
              } catch (error) {
                console.error('Cleanup error:', error);
              }

              setIsLoading(false);
              resolveWithDetails(false);
            },
          },
        };

        const razorpay = new window.Razorpay(razorpayOptions);
        razorpay.on('payment.failed', async (response: any) => {
          console.error('Payment failed:', response.error);
          
          try {
            await supabase.functions.invoke('cleanup-failed-payment', {
              body: { session_id: orderData.session_id }
            });
          } catch (cleanupError) {
            console.error('Cleanup error on payment failed:', cleanupError);
          }
          
          toast({
            title: 'Payment Failed',
            description: response.error?.description || 'Please try again',
            variant: 'destructive',
          });
          setIsLoading(false);
          resolveWithDetails(false);
        });
        razorpay.open();
      });
    } catch (error: any) {
      console.error('Razorpay error:', error);
      toast({
        title: 'Payment Error',
        description: error.message || 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
      setIsLoading(false);
      return { success: false };
    }
  }, [isScriptLoaded, toast]);

  return {
    isLoading,
    isScriptLoaded,
    createOrderAndPay,
  };
};
