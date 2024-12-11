import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RedisService } from './services/redis.service';
import { User } from './entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private redisService: RedisService,
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.redisService.getUser(username);
    
    if (user && await bcrypt.compare(password, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    throw new UnauthorizedException('Invalid credentials');
  }

  async login(user: any) {
    const payload = { username: user.username, sub: user.id, roles: user.roles };
    const token = this.jwtService.sign(payload);
    
    // Save session to Redis
    await this.redisService.saveSession({
      userId: user.id,
      username: user.username,
      roles: user.roles,
      exp: this.getTokenExpiration(token),
    });

    return {
      access_token: token,
    };
  }

  async generateServiceToken(serviceName: string): Promise<string> {
    const payload = {
      service: serviceName,
      type: 'service',
    };
    return this.jwtService.sign(payload);
  }

  private getTokenExpiration(token: string): number {
    const decoded = this.jwtService.decode(token) as { exp: number };
    return decoded.exp;
  }

  // Helper method to create initial admin user
  async createInitialAdminUser() {
    const existingAdmin = await this.redisService.getUser('admin');
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('admin', 10);
      const adminUser: User = {
        id: 1,
        username: 'admin',
        password: hashedPassword,
        roles: ['admin'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await this.redisService.saveUser(adminUser);
    }
  }
}
