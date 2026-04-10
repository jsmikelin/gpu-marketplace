export type Role = 'admin' | 'customer' | 'supplier' | 'reseller'
export type Status = 'active' | 'suspended' | 'pending'
export type OrderStatus =
  | 'pending_payment' | 'paid' | 'processing'
  | 'active' | 'completed' | 'cancelled' | 'refunded' | 'disputed'
export type BillingType = 'hourly' | 'monthly'

export interface Profile {
  id: string
  role: Role
  full_name: string | null
  company: string | null
  country: string | null
  phone: string | null
  status: Status
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Supplier {
  id: string
  commission_rate: number
  payment_method: string | null
  payment_details: Record<string, string> | null
  approved_at: string | null
  approved_by: string | null
  rejection_reason: string | null
  total_revenue: number
  total_orders: number
  notes: string | null
  profile?: Profile
}

export interface Reseller {
  id: string
  commission_rate: number
  referral_code: string
  approved_at: string | null
  approved_by: string | null
  rejection_reason: string | null
  total_commission: number
  total_orders: number
  customer_count: number
  notes: string | null
  profile?: Profile
}

export interface Customer {
  id: string
  reseller_id: string | null
  use_case: string | null
  total_spent: number
  total_orders: number
  credit_balance: number
  kyc_status: 'none' | 'pending' | 'verified' | 'rejected'
  notes: string | null
  profile?: Profile
  reseller?: Profile
}

export interface Product {
  id: string
  supplier_id: string
  name: string
  gpu_model: string
  gpu_count: number
  vram_gb: number | null
  vcpus: number | null
  ram_gb: number | null
  storage_tb: number | null
  location: string
  region_code: string | null
  price_hourly: number
  price_monthly: number | null
  available_units: number
  status: 'active' | 'inactive' | 'draft'
  description: string | null
  tags: string[] | null
  created_at: string
  updated_at: string
  supplier?: { full_name: string | null; company: string | null }
}

export interface Order {
  id: string
  order_number: string
  customer_id: string
  product_id: string
  supplier_id: string
  reseller_id: string | null
  quantity: number
  billing_type: BillingType
  duration_value: number
  unit_price: number
  subtotal: number
  platform_commission_rate: number
  platform_commission: number
  reseller_commission_rate: number
  reseller_commission: number
  supplier_payout: number
  status: OrderStatus
  stripe_session_id: string | null
  stripe_payment_intent_id: string | null
  paid_at: string | null
  started_at: string | null
  expires_at: string | null
  completed_at: string | null
  cancelled_at: string | null
  cancel_reason: string | null
  admin_notes: string | null
  created_at: string
  product?: Product
  customer?: Profile
  supplier?: Profile
  reseller?: Profile
}

export interface OrderCredential {
  id: string
  order_id: string
  credential_type: 'ssh' | 'api_key' | 'console' | 'vpn' | 'other'
  host: string | null
  port: number | null
  username: string | null
  password: string | null
  api_key: string | null
  console_url: string | null
  extra_info: Record<string, string> | null
  delivered_at: string
}

export interface Transaction {
  id: string
  order_id: string | null
  profile_id: string
  type: 'payment' | 'payout' | 'refund' | 'commission' | 'credit'
  amount: number
  currency: string
  status: 'pending' | 'completed' | 'failed'
  stripe_id: string | null
  description: string | null
  created_at: string
}

export interface DashboardStats {
  totalRevenue: number
  totalOrders: number
  activeOrders: number
  pendingApprovals: number
  totalSuppliers: number
  totalResellers: number
  totalCustomers: number
  revenueThisMonth: number
}
