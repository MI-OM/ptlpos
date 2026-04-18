import { RoleName } from '@prisma/client';
import { Request } from 'express';

export interface AuthContext {
  userId: string;
  tenantId: string;
  role: RoleName;
  branchId?: string;
}

export interface RequestWithContext extends Request {
  auth?: AuthContext;
}
