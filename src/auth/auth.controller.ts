import { Controller, Post, UseGuards, Request, Body, UnauthorizedException, UseFilters } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { Public } from './decorators/public.decorator';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { Tokens } from './interfaces/token.interface';
import { GrpcExceptionFilter } from '../filters/grpc-exception.filter';
import { CreateUserRequest } from '../protos/users';

@Controller('auth')
@UseFilters(GrpcExceptionFilter)
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('register')
  async register(@Body() registerDto: RegisterDto): Promise<Tokens> {
    const createUserRequest: CreateUserRequest = {
      username: registerDto.username,
      password: registerDto.password,
      email: registerDto.email,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
    };
    return this.authService.register(createUserRequest);
  }

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req, @Body() loginDto: LoginDto): Promise<Tokens> {
    return this.authService.login(req.user);
  }

  @Public()
  @Post('refresh')
  async refresh(@Body() refreshTokenDto: RefreshTokenDto): Promise<Tokens> {
    try {
      return await this.authService.refreshTokens(refreshTokenDto.refresh_token);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  @Post('logout')
  async logout(@Request() req): Promise<void> {
    await this.authService.logout(req.user.id);
  }
}
