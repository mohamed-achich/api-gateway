import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UnauthorizedException } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    refreshTokens: jest.fn(),
    logout: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const registerDto: RegisterDto = {
        username: 'testuser',
        password: 'password123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
      };

      const expectedTokens = {
        access_token: 'mock_access_token',
        refresh_token: 'mock_refresh_token',
      };

      mockAuthService.register.mockResolvedValue(expectedTokens);

      const result = await controller.register(registerDto);

      expect(result).toEqual(expectedTokens);
      expect(mockAuthService.register).toHaveBeenCalledWith({
        username: registerDto.username,
        password: registerDto.password,
        email: registerDto.email,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
      });
    });

    it('should handle registration errors', async () => {
      const registerDto: RegisterDto = {
        username: 'testuser',
        password: 'password123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
      };

      mockAuthService.register.mockRejectedValue(new Error('Registration failed'));

      await expect(controller.register(registerDto)).rejects.toThrow('Registration failed');
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const loginDto: LoginDto = {
        username: 'testuser',
        password: 'password123',
      };

      const req = {
        user: { id: '1', username: 'testuser' },
      };

      const expectedTokens = {
        access_token: 'mock_access_token',
        refresh_token: 'mock_refresh_token',
      };

      mockAuthService.login.mockResolvedValue(expectedTokens);

      const result = await controller.login(req, loginDto);

      expect(result).toEqual(expectedTokens);
      expect(mockAuthService.login).toHaveBeenCalledWith(req.user);
    });
  });

  describe('refresh', () => {
    it('should refresh tokens successfully', async () => {
      const refreshTokenDto: RefreshTokenDto = {
        refresh_token: 'old_refresh_token',
      };

      const expectedTokens = {
        access_token: 'new_access_token',
        refresh_token: 'new_refresh_token',
      };

      mockAuthService.refreshTokens.mockResolvedValue(expectedTokens);

      const result = await controller.refresh(refreshTokenDto);

      expect(result).toEqual(expectedTokens);
      expect(mockAuthService.refreshTokens).toHaveBeenCalledWith(refreshTokenDto.refresh_token);
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      const refreshTokenDto: RefreshTokenDto = {
        refresh_token: 'invalid_token',
      };

      mockAuthService.refreshTokens.mockRejectedValue(new Error('Invalid token'));

      await expect(controller.refresh(refreshTokenDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      const req = {
        user: { id: '1' },
      };

      await controller.logout(req);

      expect(mockAuthService.logout).toHaveBeenCalledWith(req.user.id);
    });
  });
});
