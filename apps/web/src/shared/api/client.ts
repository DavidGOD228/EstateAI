/**
 * Minimal typed fetch wrapper. FROZEN interface — workstreams consume, never edit.
 *
 * - Always sends cookies (HttpOnly auth) via same-origin `/api` paths.
 * - Normalizes every failure into ApiError with a safe, displayable message.
 * - Never exposes raw response bodies to the UI.
 */

interface ErrorBodyShape {
  message?: string | string[];
}

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const FALLBACK_MESSAGES: Record<number, string> = {
  400: 'Some of the submitted values are invalid.',
  401: 'You need to be logged in to do that.',
  404: 'The requested resource was not found.',
  409: 'This request conflicts with existing data.',
  429: 'Too many requests. Please wait a moment and try again.',
  503: 'The service is temporarily unavailable. Please try again.',
};

function safeMessage(status: number, body: unknown): string {
  if (body && typeof body === 'object') {
    const { message } = body as ErrorBodyShape;
    if (typeof message === 'string' && message.length > 0 && message.length < 300) {
      return message;
    }
    if (Array.isArray(message) && message.length > 0 && typeof message[0] === 'string') {
      return message[0];
    }
  }
  return FALLBACK_MESSAGES[status] ?? 'Something went wrong. Please try again.';
}

export async function request<TResponse>(
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<TResponse> {
  let response: Response;
  try {
    response = await fetch(path, {
      method: init.method ?? 'GET',
      credentials: 'include',
      headers: init.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Check your connection and try again.');
  }

  let payload: unknown = null;
  const text = await response.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    throw new ApiError(response.status, safeMessage(response.status, payload));
  }

  return payload as TResponse;
}
