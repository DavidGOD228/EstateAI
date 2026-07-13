// Augments Express types shared across the app: a per-request correlation id
// (assigned by RequestIdMiddleware) and the authenticated user shape attached
// by JwtStrategy's `validate()`.
declare global {
  namespace Express {
    interface Request {
      requestId: string;
    }

    interface User {
      id: string;
    }
  }
}

export {};
