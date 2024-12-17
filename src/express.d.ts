// express.d.ts

import { JwtPayload } from 'jsonwebtoken';

declare namespace Express {
  export interface Request {
    user?: {
      userId: string;
      role: 'admin' | 'trainer' | 'user';
    };
  }
}
