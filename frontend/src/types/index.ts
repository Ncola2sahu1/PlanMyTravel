export interface User {
  id: number;
  email: string;
  name: string;
  full_name?: string;
  phone?: string;
  country?: string;
  preferred_currency: string;
  avatar_url?: string;
  bio?: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export interface AdminUser {
  id: number;
  email: string;
  name: string;
  role: string;
  is_active: boolean;
  last_login_at?: string;
  created_at: string;
}

export interface DestinationImage {
  id: number;
  destination_id: number;
  image_url: string;
  alt_text?: string;
  caption?: string;
  sort_order: number;
}

export interface Attraction {
  name: string;
  category?: string;
  rating?: number;
}

export interface Destination {
  id: number;
  name: string;
  slug: string;
  country?: string;
  region?: string;
  city?: string;
  tagline?: string;
  category?: string;
  short_description?: string;
  description?: string;
  hero_image_url?: string;
  image_url?: string;
  rating: number;
  is_featured: boolean;
  is_published: boolean;
  best_season?: string;
  cost_currency: string;
  estimated_cost_min?: number;
  estimated_cost_max?: number;
  ideal_stay?: string;
  weather_info?: string;
  travel_styles?: string[];
  attractions?: Attraction[];
  activities?: string[];
  gallery?: DestinationImage[];
  related_stays?: Stay[];
  insights?: Array<{ title: string; snippet: string; link?: string }>;
}

export interface Stay {
  id: string;
  provider_code?: string;
  name: string;
  city: string;
  country?: string;
  category: string;
  description: string;
  cover_image_url: string;
  images?: string[];
  nightly_rate: number;
  currency: string;
  rating: number;
  review_count?: number;
  amenities: string[];
  is_verified_provider: boolean;
  source: string;
  requires_partner_checkout: boolean;
}

export interface FlightOption {
  id?: string;
  airline: string;
  flight_number: string;
  departure_airport: string;
  arrival_airport: string;
  departure_time: string;
  arrival_time: string;
  duration: string;
  layovers?: string;
  stops?: string;
  estimated_price_per_person: number;
  booking_advice?: string;
  booking_url?: string;
}

export interface TransferOption {
  mode: string;
  from: string;
  to: string;
  duration: string;
  estimated_cost: number;
  tips?: string;
}

export interface ItineraryActivity {
  title: string;
  description: string;
  location: string;
  time: string;
  duration_min: number;
  estimated_cost: number;
}

export interface ItineraryDay {
  day_number: number;
  title: string;
  summary: string;
  morning?: ItineraryActivity;
  afternoon?: ItineraryActivity;
  evening?: ItineraryActivity;
}

export interface BudgetBreakdown {
  flights_total: number;
  accommodation_total: number;
  transfers_and_transit: number;
  activities_and_tickets: number;
  food_and_dining: number;
  contingency_fund: number;
  estimated_grand_total: number;
  remaining_budget: number;
  budget_status: string;
}

export interface Itinerary {
  title: string;
  summary: string;
  destination: string;
  origin: string;
  duration_days: number;
  travelers: number;
  currency: string;
  flights?: {
    outbound?: FlightOption;
    return?: FlightOption;
  };
  transfers?: TransferOption[];
  accommodations?: Stay[];
  verified_hotel_options?: Stay[];
  days: ItineraryDay[];
  budget_breakdown: BudgetBreakdown;
  practical_tips?: string[];
}

export interface Trip {
  id: string;
  user_id: number;
  destination_id?: number;
  title: string;
  start_date?: string;
  end_date?: string;
  travelers: number;
  total_budget?: number;
  currency: string;
  travel_style?: string;
  origin?: string;
  interests?: string[];
  status: string;
  notes?: string;
  destination?: {
    id: number;
    name: string;
    country?: string;
    hero_image_url?: string;
  };
  active_plan?: {
    id: string;
    title: string;
    summary?: string;
    estimated_total?: number;
    currency: string;
    payload?: Itinerary;
    days?: any[];
  };
  created_at: string;
}

export interface WalletTransaction {
  id: number;
  wallet_id: number;
  trip_id?: string;
  booking_id?: number;
  type: string;
  amount: number;
  status: string;
  currency: string;
  description?: string;
  reference?: string;
  created_at: string;
}

export interface Wallet {
  id: number;
  user_id: number;
  balance: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: number;
  booking_reference: string;
  user_id: number;
  trip_id?: string;
  status: string;
  travelers_count: number;
  total_amount: number;
  currency: string;
  contact_name?: string;
  contact_email?: string;
  payment_status: string;
  booked_at: string;
  created_at: string;
}

export interface AdminAuditLog {
  id: string;
  admin_id?: number;
  action: string;
  entity_type?: string;
  entity_id?: string;
  details: Record<string, any>;
  ip_address?: string;
  created_at: string;
}

