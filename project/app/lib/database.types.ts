export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string;
          category: string;
          subcategory: string | null;
          price: number;
          compare_at_price: number | null;
          images: string[];
          variants: Json;
          tags: string[];
          status: string;
          featured: boolean;
          best_seller: boolean;
          new_arrival: boolean;
          materials: string | null;
          care_instructions: string | null;
          fit_guide: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['products']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['products']['Insert']>;
      };
      collections: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string;
          image: string;
          product_ids: string[];
          featured: boolean;
          season: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['collections']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['collections']['Insert']>;
      };
      reviews: {
        Row: {
          id: string;
          product_id: string;
          user_id: string;
          user_name: string;
          rating: number;
          title: string;
          body: string;
          verified_purchase: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['reviews']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['reviews']['Insert']>;
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          phone: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          user_id: string;
          items: Json;
          shipping_address: Json;
          status: string;
          subtotal: number;
          shipping_cost: number;
          tax: number;
          total: number;
          tracking_number: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['orders']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['orders']['Insert']>;
      };
      wishlist: {
        Row: {
          id: string;
          user_id: string;
          product_id: string;
          added_at: string;
        };
        Insert: Omit<Database['public']['Tables']['wishlist']['Row'], 'id' | 'added_at'>;
        Update: Partial<Database['public']['Tables']['wishlist']['Insert']>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
