import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../services/redis.service';

@Injectable()
export class ServiceAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private redisService: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const metadata = context.getArgByIndex(1); // gRPC metadata
    const authorization = metadata.get('authorization');

    if (!authorization) {
      throw new UnauthorizedException('No authorization token provided');
    }

    const token = authorization[0].replace('Bearer ', '');

    try {
      // Verify token
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SERVICE_SECRET'),
      });

      // Check if token is blacklisted
      const isBlacklisted = await this.redisService.isBlacklisted(token);
      if (isBlacklisted) {
        throw new UnauthorizedException('Token has been revoked');
      }

      // Verify token type
      if (payload.type !== 'service') {
        throw new UnauthorizedException('Invalid token type');
      }

      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
