/** Plain (unsigned) HttpOnly cookie carrying the JWT. */
export const SESSION_COOKIE_NAME = 'eai_session';

/** Scoped to /api so the cookie is never sent to non-API paths. */
export const SESSION_COOKIE_PATH = '/api';
