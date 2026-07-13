/**
 * Typed API endpoints matching docs/TECHNICAL_PLAN.md §14 exactly.
 * FROZEN interface — workstreams consume, never edit.
 */
import type {
  AskQuestionRequest,
  AskQuestionResponse,
  GenerateListingRequest,
  GenerateListingResponse,
  LoginRequest,
  LogoutResponse,
  PropertyDto,
  PropertyListQuery,
  PropertyListResponse,
  RegisterRequest,
  UserDto,
} from '@estateai/shared-types';
import { request } from './client';

// ---- Auth ----

export function register(body: RegisterRequest): Promise<UserDto> {
  return request<UserDto>('/api/auth/register', { method: 'POST', body });
}

export function login(body: LoginRequest): Promise<UserDto> {
  return request<UserDto>('/api/auth/login', { method: 'POST', body });
}

export function logout(): Promise<LogoutResponse> {
  return request<LogoutResponse>('/api/auth/logout', { method: 'POST' });
}

export function getMe(): Promise<UserDto> {
  return request<UserDto>('/api/auth/me');
}

// ---- Properties ----

export function getProperties(query: PropertyListQuery = {}): Promise<PropertyListResponse> {
  const params = new URLSearchParams();
  if (query.location) params.set('location', query.location);
  if (query.propertyType) params.set('propertyType', query.propertyType);
  if (query.minBedrooms !== undefined) params.set('minBedrooms', String(query.minBedrooms));
  if (query.maxPrice !== undefined) params.set('maxPrice', String(query.maxPrice));
  const qs = params.toString();
  return request<PropertyListResponse>(`/api/properties${qs ? `?${qs}` : ''}`);
}

export function getProperty(id: string): Promise<PropertyDto> {
  return request<PropertyDto>(`/api/properties/${encodeURIComponent(id)}`);
}

// ---- AI ----

export function askProperty(id: string, body: AskQuestionRequest): Promise<AskQuestionResponse> {
  return request<AskQuestionResponse>(`/api/properties/${encodeURIComponent(id)}/ask`, {
    method: 'POST',
    body,
  });
}

export function generateListing(body: GenerateListingRequest): Promise<GenerateListingResponse> {
  return request<GenerateListingResponse>('/api/ai/generate-listing', { method: 'POST', body });
}
