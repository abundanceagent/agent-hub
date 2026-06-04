// Named types for use throughout the app
export type Role = 'admin' | 'team' | 'partner'
export type Corridor = 'Moreton Bay' | 'Ipswich' | 'Sunshine Coast' | 'Logan' | 'Gold Coast'
export type ListingStatus = 'Available' | 'Under contract' | 'Sold'

export type Profile = {
  id: string
  name: string | null
  email: string | null
  role: Role
  company: string | null
  invited_by: string | null
  invite_date: string | null
  last_login: string | null
  is_active: boolean
  show_prices: boolean
}

export type Listing = {
  id: string
  suburb: string
  estate: string | null
  corridor: Corridor | null
  status: ListingStatus
  land_size_sqm: number | null
  land_price: number | null
  builder: string | null
  house_design: string | null
  house_sqm: number | null
  build_price: number | null
  total_package: number | null
  weekly_rent_estimate: number | null
  facade_image_url: string | null
  floor_plan_image_url: string | null
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export type ListingPartnerView = Omit<Listing, 'notes'>

export type ActivityLog = {
  id: string
  user_id: string | null
  action: string
  listing_id: string | null
  timestamp: string
}

// Supabase Database type — Row types must be inline (not named interfaces)
// to satisfy supabase-js GenericSchema constraint in strict mode
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string | null
          email: string | null
          role: 'admin' | 'team' | 'partner'
          company: string | null
          invited_by: string | null
          invite_date: string | null
          last_login: string | null
          is_active: boolean
          show_prices: boolean
        }
        Insert: {
          id: string
          role: 'admin' | 'team' | 'partner'
          name?: string | null
          email?: string | null
          company?: string | null
          invited_by?: string | null
          invite_date?: string | null
          last_login?: string | null
          is_active?: boolean
          show_prices?: boolean
        }
        Update: {
          role?: 'admin' | 'team' | 'partner'
          name?: string | null
          email?: string | null
          company?: string | null
          invited_by?: string | null
          invite_date?: string | null
          last_login?: string | null
          is_active?: boolean
          show_prices?: boolean
        }
        Relationships: []
      }
      listings: {
        Row: {
          id: string
          suburb: string
          estate: string | null
          corridor: 'Moreton Bay' | 'Ipswich' | 'Sunshine Coast' | 'Logan' | 'Gold Coast' | null
          status: 'Available' | 'Under contract' | 'Sold'
          land_size_sqm: number | null
          land_price: number | null
          builder: string | null
          house_design: string | null
          house_sqm: number | null
          build_price: number | null
          total_package: number | null
          weekly_rent_estimate: number | null
          facade_image_url: string | null
          floor_plan_image_url: string | null
          notes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          suburb: string
          estate?: string | null
          corridor?: 'Moreton Bay' | 'Ipswich' | 'Sunshine Coast' | 'Logan' | 'Gold Coast' | null
          status?: 'Available' | 'Under contract' | 'Sold'
          land_size_sqm?: number | null
          land_price?: number | null
          builder?: string | null
          house_design?: string | null
          house_sqm?: number | null
          build_price?: number | null
          total_package?: number | null
          weekly_rent_estimate?: number | null
          facade_image_url?: string | null
          floor_plan_image_url?: string | null
          notes?: string | null
          created_by?: string | null
        }
        Update: {
          suburb?: string
          estate?: string | null
          corridor?: 'Moreton Bay' | 'Ipswich' | 'Sunshine Coast' | 'Logan' | 'Gold Coast' | null
          status?: 'Available' | 'Under contract' | 'Sold'
          land_size_sqm?: number | null
          land_price?: number | null
          builder?: string | null
          house_design?: string | null
          house_sqm?: number | null
          build_price?: number | null
          total_package?: number | null
          weekly_rent_estimate?: number | null
          facade_image_url?: string | null
          floor_plan_image_url?: string | null
          notes?: string | null
        }
        Relationships: []
      }
      activity_logs: {
        Row: {
          id: string
          user_id: string | null
          action: string
          listing_id: string | null
          timestamp: string
        }
        Insert: {
          user_id?: string | null
          action: string
          listing_id?: string | null
        }
        Update: {
          action?: string
        }
        Relationships: []
      }
    }
    Views: {
      listings_partner_view: {
        Row: {
          id: string
          suburb: string
          estate: string | null
          corridor: 'Moreton Bay' | 'Ipswich' | 'Sunshine Coast' | 'Logan' | 'Gold Coast' | null
          status: 'Available' | 'Under contract' | 'Sold'
          land_size_sqm: number | null
          land_price: number | null
          builder: string | null
          house_design: string | null
          house_sqm: number | null
          build_price: number | null
          total_package: number | null
          weekly_rent_estimate: number | null
          facade_image_url: string | null
          floor_plan_image_url: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Relationships: []
      }
    }
    Functions: {}
  }
}
