import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from '@nestjs/common';

type Bucket = { count: number; resetAt: number };

@Injectable()
export class AuthRateLimitGuard implements CanActivate {
  private readonly buckets = new Map<string, Bucket>();
  private readonly windowMs = 15 * 60 * 1000;
  private readonly maxAttempts = 8;

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<{ ip?: string; path?: string; body?: { email?: string } }>();
    const identity = `${String(request.ip || 'unknown').trim().toLowerCase()}:${String(request.body?.email || '').trim().toLowerCase()}`;
    const key = `${request.path || 'auth'}:${identity}`;
    const now = Date.now();
    const current = this.buckets.get(key);
    const bucket = !current || current.resetAt <= now ? { count: 0, resetAt: now + this.windowMs } : current;
    bucket.count += 1;
    this.buckets.set(key, bucket);
    if (bucket.count > this.maxAttempts) {
      throw new HttpException('Too many authentication attempts. Please try again later.', HttpStatus.TOO_MANY_REQUESTS);
    }
    if (this.buckets.size > 5000) {
      for (const [bucketKey, value] of this.buckets) if (value.resetAt <= now) this.buckets.delete(bucketKey);
    }
    return true;
  }
}
