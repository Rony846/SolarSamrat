import api from './client';

export interface Customer {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  notes?: string | null;
  created_at?: string;
}

export interface QuoteItem {
  name: string;
  qty: number;
  unit_price: number;
  cost_price?: number;
  gst_pct?: number;
}

export interface Quote {
  id: string;
  number: string;
  customer_id?: string | null;
  customer_name: string;
  customer_phone?: string | null;
  items?: QuoteItem[];
  discount: number;
  notes?: string | null;
  validity_days: number;
  subtotal: number;
  gst_amount: number;
  discount_amount: number;
  total: number;
  total_cost: number;
  profit: number;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
  public_token?: string;
  public_url?: string;
  pdf_url?: string;
  created_at: string;
}

export interface Sale {
  id: string;
  customer_name: string;
  title?: string | null;
  revenue: number;
  cost: number;
  profit: number;
  status: string;
  sale_date: string;
}

export interface BizSummary {
  revenue: number;
  profit: number;
  cost: number;
  sales_count: number;
  customers_count: number;
  quotes_count: number;
  pending_quotes: number;
  by_month: { month: string; revenue: number; profit: number }[];
}

// customers
export async function listCustomers(q?: string): Promise<{ customers: Customer[] }> {
  return (await api.get('/samrat/customers', { params: q ? { q } : {} })).data;
}
export async function createCustomer(input: Partial<Customer> & { name: string }): Promise<Customer> {
  return (await api.post('/samrat/customers', input)).data;
}

// quotes
export async function listQuotes(status?: string): Promise<{ quotes: Quote[] }> {
  return (await api.get('/samrat/quotes', { params: status ? { status } : {} })).data;
}
export async function getQuote(id: string): Promise<Quote> {
  return (await api.get(`/samrat/quotes/${id}`)).data;
}
export interface CreateQuoteInput {
  customer_id?: string;
  customer_name: string;
  customer_phone?: string;
  items: QuoteItem[];
  discount?: number;
  notes?: string;
  validity_days?: number;
}
export async function createQuote(input: CreateQuoteInput): Promise<Quote> {
  return (await api.post('/samrat/quotes', input)).data;
}
export async function setQuoteStatus(id: string, status: string): Promise<void> {
  await api.post(`/samrat/quotes/${id}/status`, { status });
}

// sales
export async function listSales(): Promise<{ sales: Sale[] }> {
  return (await api.get('/samrat/sales')).data;
}
export async function createSale(input: { customer_name: string; title?: string; revenue: number; cost?: number }): Promise<Sale> {
  return (await api.post('/samrat/sales', input)).data;
}

// dashboard
export async function getBizSummary(): Promise<BizSummary> {
  return (await api.get('/samrat/biz/summary')).data;
}
