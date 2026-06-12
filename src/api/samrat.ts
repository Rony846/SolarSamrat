import api from './client';
import type {
  Member, Post, Group, Question, Answer, Lead, Quote, Comment,
  AiQuoteResult, SamratMeta, LeaderboardEntry,
} from './types';

// ---- profile / meta ----
export async function getMeta(): Promise<SamratMeta> {
  return (await api.get('/samrat/meta')).data;
}

export async function getMyMembership(): Promise<{ member: Member | null }> {
  return (await api.get('/samrat/me')).data;
}

export interface ApplyInput {
  business_name: string;
  owner_name: string;
  phone: string;
  email?: string;
  role: string;
  gstin?: string;
  pan?: string;
  city?: string;
  state?: string;
  pincode?: string;
  years_in_business?: number;
  categories?: string[];
  logo_url?: string;
  proof_url?: string;
}

export async function applyMembership(input: ApplyInput): Promise<{ member_id: string; status: string }> {
  return (await api.post('/samrat/apply', input)).data;
}

// ---- community ----
export async function getGroups(): Promise<{ groups: Group[] }> {
  return (await api.get('/samrat/groups')).data;
}

export async function getFeed(group?: string): Promise<{ posts: Post[] }> {
  return (await api.get('/samrat/feed', { params: group ? { group } : {} })).data;
}

export async function getPost(id: string): Promise<Post> {
  return (await api.get(`/samrat/posts/${id}`)).data;
}

export async function createPost(body: string, group?: string, image_url?: string): Promise<Post> {
  return (await api.post('/samrat/posts', { body, group, image_url })).data;
}

export async function likePost(id: string): Promise<{ liked: boolean }> {
  return (await api.post(`/samrat/posts/${id}/like`)).data;
}

export async function commentPost(id: string, body: string): Promise<Comment> {
  return (await api.post(`/samrat/posts/${id}/comments`, { body })).data;
}

// ---- Q&A ----
export async function getQuestions(): Promise<{ questions: Question[] }> {
  return (await api.get('/samrat/questions')).data;
}

export async function getQuestion(id: string): Promise<Question> {
  return (await api.get(`/samrat/questions/${id}`)).data;
}

export async function askQuestion(title: string, body?: string, category?: string): Promise<Question> {
  return (await api.post('/samrat/questions', { title, body, category })).data;
}

export async function answerQuestion(qid: string, body: string): Promise<Answer> {
  return (await api.post(`/samrat/questions/${qid}/answers`, { body })).data;
}

export async function upvoteAnswer(aid: string): Promise<{ upvoted: boolean }> {
  return (await api.post(`/samrat/answers/${aid}/upvote`)).data;
}

export async function markBestAnswer(qid: string, aid: string): Promise<{ best_answer_id: string }> {
  return (await api.post(`/samrat/questions/${qid}/best/${aid}`)).data;
}

// ---- leads ----
export async function getLeads(status = 'open'): Promise<{ leads: Lead[] }> {
  return (await api.get('/samrat/leads', { params: { status } })).data;
}

export async function getLead(id: string): Promise<Lead> {
  return (await api.get(`/samrat/leads/${id}`)).data;
}

export interface LeadInput {
  title: string;
  description?: string;
  type?: string;
  category?: string;
  quantity?: string;
  location?: string;
  budget?: string;
  timeline?: string;
}

export async function createLead(input: LeadInput): Promise<Lead> {
  return (await api.post('/samrat/leads', input)).data;
}

export async function quoteLead(id: string, message: string, price?: string): Promise<Quote> {
  return (await api.post(`/samrat/leads/${id}/quotes`, { message, price })).data;
}

// ---- AI quote ----
export interface AiQuoteInput {
  monthly_units?: number;
  monthly_bill?: number;
  load_kw?: number;
  appliances?: string;
  roof_area_sqft?: number;
  state?: string;
  backup_required?: boolean;
}

export async function aiQuote(input: AiQuoteInput): Promise<AiQuoteResult> {
  return (await api.post('/samrat/ai/quote', input)).data;
}

// ---- directory / leaderboard ----
export async function getLeaderboard(state?: string, role?: string): Promise<{ leaderboard: LeaderboardEntry[] }> {
  return (await api.get('/samrat/leaderboard', { params: { state, role } })).data;
}

export async function getDirectory(params: { role?: string; state?: string; q?: string } = {}): Promise<{ members: LeaderboardEntry[] }> {
  return (await api.get('/samrat/directory', { params })).data;
}
