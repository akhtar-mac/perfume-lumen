import { z } from 'zod';

export const CreateOrderSchema = z.object({
  amount: z
    .number()
    .positive('Amount must be positive')
    .max(500000, 'Amount exceeds maximum allowed'),
  currency: z.string().default('INR'),
  receipt: z.string().max(40).optional(),
});

export const VerifyPaymentSchema = z.object({
  razorpay_order_id: z.string().min(1, 'Missing razorpay_order_id'),
  razorpay_payment_id: z.string().min(1, 'Missing razorpay_payment_id'),
  razorpay_signature: z.string().min(1, 'Missing razorpay_signature'),
  orderData: z
    .object({
      userId: z.string().optional(),
      items: z.array(
        z.object({
          productId: z.string(),
          quantity: z.number().int().positive(),
          price: z.number().positive(),
        })
      ),
      totalAmount: z.number().positive(),
      shippingAddress: z.object({
        name: z.string(),
        phone: z.string(),
        address: z.string(),
        city: z.string(),
        pincode: z.string(),
      }),
    })
    .optional(),
});

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
export type VerifyPaymentInput = z.infer<typeof VerifyPaymentSchema>;