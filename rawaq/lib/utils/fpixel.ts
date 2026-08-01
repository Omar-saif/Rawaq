import { env } from "../env";

// lib/utils/fpixel.ts

export const FB_PIXEL_ID = env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID;

export type PixelEventName = 
  | 'PageView'
  | 'ViewContent'
  | 'AddToCart'
  | 'InitiateCheckout'
  | 'Purchase';

export interface ViewContentPayload {
  content_ids: string[];
  content_name: string;
  content_category?: string;
  value: number;
  currency: string;
}

export interface AddToCartPayload {
  content_ids: string[];
  content_name: string;
  value: number;
  currency: string;
}

export interface InitiateCheckoutPayload {
  content_ids: string[];
  value: number;
  currency: string;
}

export interface PurchasePayload {
  content_ids: string[];
  value: number;
  currency: string;
}

export type PixelPayload = 
  | ViewContentPayload
  | AddToCartPayload
  | InitiateCheckoutPayload
  | PurchasePayload;

export const pageview = () => {
  if (typeof window !== 'undefined' && (window as any).fbq) {
    (window as any).fbq('track', 'PageView');
  }
};

export const event = (name: PixelEventName, payload?: PixelPayload) => {
  if (typeof window !== 'undefined' && (window as any).fbq) {
    const eventId = crypto.randomUUID();
    if (payload) {
      (window as any).fbq('track', name, payload, { eventID: eventId });
    } else {
      (window as any).fbq('track', name, undefined, { eventID: eventId });
    }
  }
};
