import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GrpcMetadataInterceptor implements NestInterceptor {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  addMetadata() {
    const token = this.jwtService.sign(
      { type: 'service', service: 'api-gateway' },
      {
        secret: this.configService.get<string>('JWT_SERVICE_SECRET'),
        expiresIn: '1h',
      },
    );

    return {
      authorization: `Bearer ${token}`,
    };
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization;
    
    if (token) {
      // Add the token to gRPC metadata
      const metadata = new Map<string, string>();
      metadata.set('authorization', token);
      context.getArgByIndex(1).set('metadata', metadata);
    } else {
      const metadata = this.addMetadata();
      context.getArgByIndex(1).set('metadata', metadata);
    }

    return next.handle();
  }
}
