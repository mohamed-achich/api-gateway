import { Injectable, UnauthorizedException, ConflictException, Inject, OnModuleInit } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from './services/redis.service';
import { ConfigService } from '@nestjs/config';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { TokenPayload, Tokens } from './interfaces/token.interface';
import { UsersServiceClient, CreateUserRequest } from '../protos/users';

@Injectable()
export class AuthService implements OnModuleInit {
  private usersService: UsersServiceClient;

  constructor(
    private jwtService: JwtService,
    private redisService: RedisService,
    private configService: ConfigService,
    @Inject('USERS_SERVICE') private usersClient: ClientGrpc
  ) {}

  onModuleInit() {
    console.log('Initializing Users Service client...');
    this.usersService = this.usersClient.getService<UsersServiceClient>('UsersService');
    console.log('Users Service client initialized');
  }

  async validateUser(username: string, password: string): Promise<any> {
    try {
      console.log('Attempting to validate credentials for user:', username);
      if (!this.usersService) {
        console.error('Users service is not initialized!');
        throw new Error('Users service not initialized');
      }
      
      console.log('Calling users service validateCredentials...');
      const response = await firstValueFrom(
        this.usersService.validateCredentials({ username, password })
      );
      
      console.log('Validation response received:', { isValid: response.isValid });
      if (response.isValid) {
        console.log('User validated successfully');
        return response.user;
      }
      console.log('Invalid credentials received from users service');
    } catch (error) {
      console.error('Error during validation:', error);
      if (error.code === 14) { // UNAVAILABLE in gRPC
        console.error('Users service is unavailable');
        throw new Error('Users service is unavailable');
      }
      throw new UnauthorizedException('Invalid credentials');
    }
    throw new UnauthorizedException('Invalid credentials');
  }

  async register(registerDto: any): Promise<Tokens> {
    try {
      const createUserRequest: CreateUserRequest = {
        username: registerDto.username,
        email: registerDto.email,
        password: registerDto.password,
        firstName: registerDto.firstName || '',
        lastName: registerDto.lastName || ''
      };

      const user = await firstValueFrom(
        this.usersService.create(createUserRequest)
      );
      
      const tokens = await this.generateTokens(user);
      await this.redisService.saveRefreshToken(user.id, tokens.refresh_token);
      await this.redisService.saveSession({
        userId: user.id,
        username: user.username,
        roles: user.roles,
        exp: this.getTokenExpiration(tokens.access_token),
        accessToken: tokens.access_token
      });
      
      return tokens;
    } catch (error) {
      if (error.status === 409) {
        throw new ConflictException('Username or email already exists');
      }
      throw error;
    }
  }

  async login(user: any): Promise<Tokens> {
    console.log('Login called with user:', user);
    const tokens = await this.generateTokens(user);
    console.log('Generated tokens');
    
    try {
      await this.redisService.saveRefreshToken(user.id, tokens.refresh_token);
      console.log('Saved refresh token');
      await this.redisService.saveSession({
        userId: user.id,
        username: user.username,
        roles: user.roles,
        exp: this.getTokenExpiration(tokens.access_token),
        accessToken: tokens.access_token,
      });
      console.log('Saved session');
      return tokens;
    } catch (error) {
      console.error('Redis error during login:', error);
      throw error;
    }
  }

  async refreshTokens(refreshToken: string): Promise<Tokens> {
    try {
      const decoded = this.jwtService.verify<TokenPayload>(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const storedToken = await this.redisService.getRefreshToken(decoded.sub);
      if (!storedToken || storedToken !== refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const user = await firstValueFrom(
        this.usersService.findOne({ id: decoded.sub.toString() })
      );

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Generate new tokens
      const tokens = await this.generateTokens(user);

      // Invalidate old refresh token and save new one
      await this.redisService.removeRefreshToken(user.id);
      await this.redisService.saveRefreshToken(user.id, tokens.refresh_token);

      // Update session with new token expiration
      await this.redisService.saveSession({
        userId: user.id,
        username: user.username,
        roles: user.roles,
        exp: this.getTokenExpiration(tokens.access_token),
        accessToken: tokens.access_token
      });

      return tokens;
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string): Promise<void> {
    const session = await this.redisService.getSession(userId);
    if (session) {
      // Add the current access token to blacklist
      await this.redisService.addToBlacklist(session.accessToken, session.exp);
    }
    
    // Remove refresh token and session
    await this.redisService.removeRefreshToken(userId);
    await this.redisService.removeSession(userId);
  }

  private async generateTokens(user: any): Promise<Tokens> {
    const payload: TokenPayload = {
      sub: user.id,
      username: user.username,
      roles: user.roles,
    };

    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SERVICE_SECRET'),
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      }),
    ]);

    return {
      access_token,
      refresh_token,
    };
  }

  private getTokenExpiration(token: string): number {
    const decoded = this.jwtService.decode(token) as { exp: number };
    return decoded.exp;
  }
}
