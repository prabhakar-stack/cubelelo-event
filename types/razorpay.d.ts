declare module 'razorpay' {
  interface RazorpayOptions {
    key_id: string;
    key_secret: string;
  }
  interface OrderOptions {
    amount: number;
    currency: string;
    receipt: string;
    notes?: Record<string, string>;
  }
  interface RazorpayOrder {
    id: string;
    amount: number;
    currency: string;
    receipt: string;
    status: string;
  }
  class Razorpay {
    constructor(options: RazorpayOptions);
    orders: {
      create(options: OrderOptions): Promise<RazorpayOrder>;
      fetch(orderId: string): Promise<RazorpayOrder>;
    };
  }
  export = Razorpay;
}
