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
  orderData: z.object({
    userId: z.string().optional(),
    items: z.array(
      z.object({
        id: z.union([z.string(), z.number()]),
        title: z.string(),
        price: z.number().positive(),
        quantity: z.number().int().positive(),
        image: z.string().optional(),
      })
    ),
    total: z.number().positive(),
    paymentMethod: z.string().default('upi'),
    shippingFee: z.number().min(0).default(0),
    couponCode: z.string().optional(),
    shippingAddress: z.object({
      name: z.string(),
      phone: z.string(),
      address: z.string(),
      city: z.string(),
      pincode: z.string(),
    }),
  }),
});

export const CreateCodOrderSchema = z.object({
  userId: z.string().optional(),
  items: z.array(
    z.object({
      id: z.union([z.string(), z.number()]),
      title: z.string(),
      price: z.number().positive(),
      quantity: z.number().int().positive(),
      image: z.string().optional(),
    })
  ),
  total: z.number().positive(),
  shippingFee: z.number().min(0).default(0),
  couponCode: z.string().optional(),
  shippingAddress: z.object({
    name: z.string(),
    phone: z.string(),
    address: z.string(),
    city: z.string(),
    pincode: z.string(),
  }),
});

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
export type VerifyPaymentInput = z.infer<typeof VerifyPaymentSchema>;