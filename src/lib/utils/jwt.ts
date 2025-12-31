/**
 * JWT utilities for admin authentication
 * Uses jose library for secure JWT signing and verification
 * 
 * @module jwt
 */

import { SignJWT, jwtVerify, JWTPayload as JoseJWTPayload } from 'jose';

/**
 * JWT payload structure for admin tokens
 */
export interface JWTPayload {
  /** Admin ID (subject) */
  sub: string;
  /** Admin email */
  email: string;
  /** Issued at timestamp (Unix seconds) */
  iat: number;
  /** Expiration timestamp (Unix seconds) */
  exp: number;
}

/**
 * Input for signing a new token (without iat/exp which are auto-generated)
 */
export interface SignTokenInput {
  /** Admin ID (subject) */
  sub: string;
  /** Admin email */
  email: string;
}

/**
 * Token expiry duration in hours
 */
const TOKEN_EXPIRY_HOURS = 8;

/**
 * Environment variable name for JWT secret
 */
const JWT_SECRET_ENV = 'ADMIN_JWT_SECRET';

/**
 * Get the JWT secret from environment variables
 * @throws Error if ADMIN_JWT_SECRET is not set
 */
function getJWTSecret(): Uint8Array {
  const secret = process.env[JWT_SECRET_ENV];
  
  if (!secret) {
    throw new Error(`${JWT_SECRET_ENV} environment variable is not set`);
  }
  
  return new TextEncoder().encode(secret);
}

/**
 * Sign a JWT token for admin authentication
 * 
 * @param payload - Token payload with sub (admin id) and email
 * @returns Promise resolving to signed JWT string
 * @throws Error if ADMIN_JWT_SECRET is not set
 * 
 * @example
 * const token = await signToken({ sub: 'admin-uuid', email: 'admin@example.com' });
 * // Returns: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
 */
export async function signToken(payload: SignTokenInput): Promise<string> {
  const secret = getJWTSecret();
  
  const token = await new SignJWT({ email: payload.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${TOKEN_EXPIRY_HOURS}h`)
    .sign(secret);
  
  return token;
}

/**
 * Verify a JWT token and extract the payload
 * 
 * @param token - JWT token string to verify
 * @returns Promise resolving to JWTPayload if valid, null if invalid/expired
 * 
 * @example
 * const payload = await verifyToken(token);
 * if (payload) {
 *   console.log('Admin ID:', payload.sub);
 *   console.log('Email:', payload.email);
 * }
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  // Early return for empty/invalid input
  if (!token || typeof token !== 'string') {
    return null;
  }
  
  try {
    const secret = getJWTSecret();
    
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ['HS256']
    });
    
    // Validate required claims exist and have correct types
    if (!isValidPayload(payload)) {
      return null;
    }
    
    return {
      sub: payload.sub as string,
      email: payload.email as string,
      iat: payload.iat as number,
      exp: payload.exp as number
    };
  } catch {
    // Return null for any verification failure
    // This includes: invalid signature, expired token, malformed token
    return null;
  }
}

/**
 * Validate that a JWT payload has all required claims with correct types
 */
function isValidPayload(payload: JoseJWTPayload): boolean {
  return (
    typeof payload.sub === 'string' &&
    payload.sub.length > 0 &&
    typeof payload.email === 'string' &&
    payload.email.length > 0 &&
    typeof payload.iat === 'number' &&
    typeof payload.exp === 'number'
  );
}
