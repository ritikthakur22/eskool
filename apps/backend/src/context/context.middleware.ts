import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { requestContext } from './context.js';
import { randomUUID } from 'crypto';

@Injectable()
export class ContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const requestId = (req.headers['x-request-id'] as string) || randomUUID();
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    
    requestContext.run({ requestId, ipAddress, userAgent }, () => {
      next();
    });
  }
}
