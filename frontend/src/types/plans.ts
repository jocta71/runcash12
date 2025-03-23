export enum PlanType {
  FREE = 'FREE',
  BASIC = 'BASIC',
  PRO = 'PRO',
  PREMIUM = 'PREMIUM'
}

export interface Plan {
  id: string;
  name: string;
  type: PlanType;
  description: string;
  price: number;
  interval: 'monthly' | 'annual';
  features: string[];
  allowedFeatures: string[];
}

export interface UserSubscription {
  id: string;
  userId: string;
  planId: string;
  planType: PlanType;
  startDate: Date;
  endDate: Date | null;
  status: 'active' | 'canceled' | 'past_due' | 'trial';
  paymentMethod?: string;
  paymentProvider?: 'stripe' | 'manual';
  paymentId?: string;
  nextBillingDate?: Date;
} 