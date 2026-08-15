// Auto-generated types for Supabase database tables
// These match the schema defined in supabase/schema.sql

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      admin_users: {
        Row: {
          id: string;
          email: string;
          password_hash: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          password_hash: string;
          name?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          password_hash?: string;
          name?: string;
          updated_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          name: string;
          slug: string;
          price: number;
          description: string | null;
          tag: string | null;
          thumbnail_url: string | null;
          landing_page_html: string | null;
          landing_page_url: string | null;
          checkout_config: Json;
          product_file_url: string | null;
          gateway_provider: 'razorpay' | 'payu' | 'paypal';
          seo_title: string | null;
          seo_description: string | null;
          og_image_url: string | null;
          status: 'live' | 'draft' | 'archived';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          price: number;
          description?: string | null;
          tag?: string | null;
          thumbnail_url?: string | null;
          landing_page_html?: string | null;
          landing_page_url?: string | null;
          checkout_config?: Json;
          product_file_url?: string | null;
          gateway_provider?: 'razorpay' | 'payu' | 'paypal';
          seo_title?: string | null;
          seo_description?: string | null;
          og_image_url?: string | null;
          status?: 'live' | 'draft' | 'archived';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          slug?: string;
          price?: number;
          description?: string | null;
          tag?: string | null;
          thumbnail_url?: string | null;
          landing_page_html?: string | null;
          landing_page_url?: string | null;
          checkout_config?: Json;
          product_file_url?: string | null;
          gateway_provider?: 'razorpay' | 'payu' | 'paypal';
          seo_title?: string | null;
          seo_description?: string | null;
          og_image_url?: string | null;
          status?: 'live' | 'draft' | 'archived';
          updated_at?: string;
        };
      };
      customers: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          phone?: string | null;
          created_at?: string;
        };
        Update: {
          name?: string;
          email?: string;
          phone?: string | null;
        };
      };
      orders: {
        Row: {
          id: string;
          product_id: string | null;
          customer_id: string | null;
          amount: number;
          currency: string;
          gateway_used: 'razorpay' | 'payu' | 'paypal';
          payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
          transaction_id: string | null;
          gateway_order_id: string | null;
          gateway_response: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id?: string | null;
          customer_id?: string | null;
          amount: number;
          currency?: string;
          gateway_used: 'razorpay' | 'payu' | 'paypal';
          payment_status?: 'pending' | 'completed' | 'failed' | 'refunded';
          transaction_id?: string | null;
          gateway_order_id?: string | null;
          gateway_response?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          product_id?: string | null;
          customer_id?: string | null;
          amount?: number;
          currency?: string;
          gateway_used?: 'razorpay' | 'payu' | 'paypal';
          payment_status?: 'pending' | 'completed' | 'failed' | 'refunded';
          transaction_id?: string | null;
          gateway_order_id?: string | null;
          gateway_response?: Json;
          updated_at?: string;
        };
      };
      funnel_events: {
        Row: {
          id: string;
          product_id: string | null;
          session_id: string;
          event_type: 'page_view' | 'checkout_start' | 'purchase' | 'abandoned';
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id?: string | null;
          session_id: string;
          event_type: 'page_view' | 'checkout_start' | 'purchase' | 'abandoned';
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          product_id?: string | null;
          session_id?: string;
          event_type?: 'page_view' | 'checkout_start' | 'purchase' | 'abandoned';
          metadata?: Json;
        };
      };
      email_templates: {
        Row: {
          id: string;
          name: string;
          subject: string;
          body: string;
          sender_name: string;
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          subject: string;
          body: string;
          sender_name?: string;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          subject?: string;
          body?: string;
          sender_name?: string;
          is_default?: boolean;
          updated_at?: string;
        };
      };
      email_logs: {
        Row: {
          id: string;
          order_id: string | null;
          customer_email: string;
          subject: string;
          status: 'pending' | 'sent' | 'failed';
          error_message: string | null;
          attempts: number;
          sent_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id?: string | null;
          customer_email: string;
          subject: string;
          status?: 'pending' | 'sent' | 'failed';
          error_message?: string | null;
          attempts?: number;
          sent_at?: string | null;
          created_at?: string;
        };
        Update: {
          order_id?: string | null;
          customer_email?: string;
          subject?: string;
          status?: 'pending' | 'sent' | 'failed';
          error_message?: string | null;
          attempts?: number;
          sent_at?: string | null;
        };
      };
      gateway_configs: {
        Row: {
          id: string;
          provider: 'razorpay' | 'payu' | 'paypal';
          api_key: string | null;
          api_secret: string | null;
          webhook_secret: string | null;
          extra_config: Json;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          provider: 'razorpay' | 'payu' | 'paypal';
          api_key?: string | null;
          api_secret?: string | null;
          webhook_secret?: string | null;
          extra_config?: Json;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          provider?: 'razorpay' | 'payu' | 'paypal';
          api_key?: string | null;
          api_secret?: string | null;
          webhook_secret?: string | null;
          extra_config?: Json;
          active?: boolean;
          updated_at?: string;
        };
      };
      smtp_configs: {
        Row: {
          id: string;
          host: string;
          port: number;
          secure: boolean;
          username: string;
          password: string;
          from_email: string;
          from_name: string;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          host: string;
          port: number;
          secure?: boolean;
          username: string;
          password: string;
          from_email: string;
          from_name: string;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          host?: string;
          port?: number;
          secure?: boolean;
          username?: string;
          password?: string;
          from_email?: string;
          from_name?: string;
          active?: boolean;
          updated_at?: string;
        };
      };
      fb_capi_config: {
        Row: {
          id: string;
          pixel_id: string | null;
          access_token: string | null;
          test_event_code: string | null;
          active: boolean;
          updated_at: string;
        };
        Insert: {
          id?: string;
          pixel_id?: string | null;
          access_token?: string | null;
          test_event_code?: string | null;
          active?: boolean;
          updated_at?: string;
        };
        Update: {
          pixel_id?: string | null;
          access_token?: string | null;
          test_event_code?: string | null;
          active?: boolean;
          updated_at?: string;
        };
      };
    };
  };
}

// Convenience type aliases
export type Product = Database['public']['Tables']['products']['Row'];
export type ProductInsert = Database['public']['Tables']['products']['Insert'];
export type ProductUpdate = Database['public']['Tables']['products']['Update'];

export type Customer = Database['public']['Tables']['customers']['Row'];
export type CustomerInsert = Database['public']['Tables']['customers']['Insert'];

export type Order = Database['public']['Tables']['orders']['Row'];
export type OrderInsert = Database['public']['Tables']['orders']['Insert'];
export type OrderUpdate = Database['public']['Tables']['orders']['Update'];

export type FunnelEvent = Database['public']['Tables']['funnel_events']['Row'];
export type FunnelEventInsert = Database['public']['Tables']['funnel_events']['Insert'];

export type EmailTemplate = Database['public']['Tables']['email_templates']['Row'];
export type EmailLog = Database['public']['Tables']['email_logs']['Row'];

export type GatewayConfig = Database['public']['Tables']['gateway_configs']['Row'];
export type FbCapiConfig = Database['public']['Tables']['fb_capi_config']['Row'];
export type AdminUser = Database['public']['Tables']['admin_users']['Row'];
export type SmtpConfig = Database['public']['Tables']['smtp_configs']['Row'];

// Extended types with joins
export type OrderWithDetails = Order & {
  product?: Product | null;
  customer?: Customer | null;
};
