/**
 * EstateAI API contract — the single source of truth for request/response shapes.
 *
 * This package is types-only (no runtime values) so both apps can consume it
 * with `import type` and zero build tooling. Do not add runtime exports.
 *
 * FROZEN after Foundation: changes require an integration-level decision,
 * never a mid-workstream edit. See docs/TECHNICAL_PLAN.md §14.
 */

// ---------- Shared unions ----------

export type PropertyType = 'apartment' | 'house' | 'studio' | 'townhouse';

export type Tone = 'professional' | 'warm' | 'premium' | 'concise';

export type Confidence = 'high' | 'medium' | 'low';

// ---------- Errors ----------

/** Uniform error body returned by every API endpoint. */
export interface ApiErrorBody {
  statusCode: number;
  message: string;
  requestId?: string;
}

// ---------- Health ----------

export interface HealthResponse {
  status: 'ok';
}

// ---------- Auth / Users ----------

/** Safe user shape — passwordHash is never serialized. */
export interface UserDto {
  id: string;
  name: string;
  email: string;
  /** ISO 8601 */
  createdAt: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LogoutResponse {
  success: boolean;
}

// ---------- Properties ----------

export interface PropertyDto {
  id: string;
  title: string;
  description: string;
  /** EUR */
  price: number;
  address: string;
  city: string;
  country: string;
  bedrooms: number;
  bathrooms: number;
  areaSqm: number;
  propertyType: PropertyType;
  /** Display-only feature tags. */
  features: string[];
  /** ISO 8601 */
  createdAt: string;
  /** ISO 8601 */
  updatedAt: string;
}

export interface PropertyListQuery {
  /** Matches against city (case-insensitive substring). */
  location?: string;
  propertyType?: PropertyType;
  minBedrooms?: number;
  maxPrice?: number;
}

export interface PropertyListResponse {
  items: PropertyDto[];
  total: number;
}

// ---------- AI Feature 1: Property Q&A ----------

/** The client sends ONLY the question; the backend owns the property context. */
export interface AskQuestionRequest {
  /** 1–500 chars. */
  question: string;
}

export interface AskQuestionResponse {
  answer: string;
  highlights: string[];
  caveats: string[];
  confidence: Confidence;
}

// ---------- AI Feature 2: Smart Listing Generator ----------

export interface GenerateListingRequest {
  /** 1–120 chars. */
  location: string;
  /** EUR, > 0. */
  price: number;
  /** 0–20 integer. */
  bedrooms: number;
  /** 0–20 integer. */
  bathrooms: number;
  /** > 0. */
  areaSqm: number;
  propertyType: PropertyType;
  /** Untrusted free text, max 1000 chars. */
  optionalFeatures?: string;
  tone?: Tone;
}

export interface GenerateListingResponse {
  headline: string;
  description: string;
  highlights: string[];
  targetAudience: string;
}
