import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'emfrontier-secret-key-2026';

export interface TokenPayload {
  id: number;
  email: string;
  type: 'client' | 'admin';
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    return null;
  }
}
