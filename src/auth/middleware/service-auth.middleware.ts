import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class ServiceAuthMiddleware implements NestMiddleware {
  constructor(private jwtService: JwtService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const token = req.headers['service-auth'] as string;

    if (!token) {
      throw new UnauthorizedException('Service authentication token is missing');
    }

    try {
      const payload = await this.jwtService.verify(token);
      if (payload.type !== 'service') {
        throw new UnauthorizedException('Invalid service token');
      }
      req['service'] = payload.service;
      next();
    } catch (error) {
      throw new UnauthorizedException('Invalid service token');
    }
  }
}
