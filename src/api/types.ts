export interface AppUser {
  id: string;
  phone: string;
  name?: string;
}

export interface Member {
  id: string;
  user_id?: string;
  business_name: string;
  owner_name: string;
  phone: string;
  email?: string | null;
  role: SamratRole;
  gstin?: string | null;
  pan?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  years_in_business?: number | null;
  categories?: string[];
  logo_url?: string | null;
  proof_url?: string | null;
  upi_id?: string | null;
  status: 'pending' | 'active' | 'suspended';
  verification: 'pending' | 'verified' | 'rejected';
  verification_note?: string | null;
  rank: string;
  crowns: number;
  next_rank?: string | null;
  crowns_to_next?: number;
}

export type SamratRole = 'dealer' | 'distributor' | 'epc' | 'brand' | 'customer';

export interface Author {
  member_id: string;
  business_name: string;
  owner_name: string;
  role: SamratRole;
  rank: string;
  city?: string | null;
  state?: string | null;
}

export interface Post {
  id: string;
  body: string;
  image_url?: string | null;
  group?: string | null;
  author?: Author | null;
  like_count: number;
  liked: boolean;
  comment_count: number;
  comments?: Comment[];
  created_at: string;
}

export interface Comment {
  id: string;
  author_name?: string;
  body: string;
  created_at: string;
}

export interface Group {
  key: string;
  name: string;
  icon: string;
  posts: number;
}

export interface Question {
  id: string;
  title: string;
  body?: string;
  category?: string | null;
  status: string;
  answer_count: number;
  best_answer_id?: string | null;
  author?: Author | null;
  answers?: Answer[];
  user_id?: string;
  created_at: string;
}

export interface Answer {
  id: string;
  member_id?: string;
  author_name?: string;
  author_rank?: string;
  body: string;
  upvote_count?: number;
  upvoted?: boolean;
  created_at: string;
}

export interface Lead {
  id: string;
  number?: string;
  title: string;
  description?: string;
  type?: string;
  category?: string | null;
  quantity?: string | null;
  location?: string | null;
  budget?: string | null;
  timeline?: string | null;
  status: string;
  author?: Author | null;
  quotes?: Quote[];
  created_at: string;
}

export interface Quote {
  id: string;
  business_name?: string;
  rank?: string;
  message: string;
  price?: string | null;
  created_at: string;
}

export interface AiQuoteResult {
  system_size_kw?: number;
  panel_recommendation?: string;
  inverter_recommendation?: string;
  battery_recommendation?: string;
  structure?: string;
  estimated_cost_inr?: number;
  subsidy_inr?: number;
  net_cost_inr?: number;
  monthly_savings_inr?: number;
  payback_years?: number;
  monthly_units_offset?: number;
  summary?: string;
  assumptions?: string[];
}

export interface SamratMeta {
  roles: SamratRole[];
  categories: string[];
  ranks: { name: string; crowns: number }[];
}

export interface LeaderboardEntry {
  id: string;
  business_name: string;
  owner_name: string;
  role: SamratRole;
  state?: string | null;
  city?: string | null;
  rank: string;
  crowns: number;
}
