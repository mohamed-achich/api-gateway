import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from './services/redis.service';
import { ConfigService } from '@nestjs/config';
import { ClientGrpc } from '@nestjs/microservices';
import { of, throwError } from 'rxjs';
import { status } from '@grpc/grpc-js';
import { InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';

describe('AuthService', () => {
  let service: AuthService;
  let mockUsersService: any;

  // Mock implementations
  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
    signAsync: jest.fn().mockResolvedValue('mock_token'),
    verifyAsync: jest.fn().mockResolvedValue({ sub: '1', username: 'testuser' }),
  };

  const mockRedisService = {
    set: jest.fn().mockResolvedValue('OK'),
    get: jest.fn(),
    removeRefreshToken: jest.fn().mockResolvedValue(1),
    saveRefreshToken: jest.fn().mockResolvedValue('OK'),
    getRefreshToken: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockUsersClient = {
    getService: jest.fn(),
  };

  beforeEach(async () => {
    // Reset all mocks
    mockUsersService = {
      validateCredentials: jest.fn(),
      create: jest.fn().mockReturnValue(of({
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        roles: ['user'],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })),
      findOne: jest.fn().mockReturnValue(of({
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        roles: ['user'],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })),
      findByUsername: jest.fn(),
      findById: jest.fn().mockReturnValue(of({
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        roles: ['user'],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })),
    };

    mockUsersClient.getService.mockReturnValue(mockUsersService);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: 'USERS_SERVICE',
          useValue: mockUsersClient,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    // Initialize the service
    service.onModuleInit();
  });

  describe('validateUser', () => {
    it('should return user when credentials are valid', async () => {
      const mockUser = {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        roles: ['user'],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockUsersService.validateCredentials.mockReturnValue(
        of({
          isValid: true,
          user: mockUser,
        })
      );

      const result = await service.validateUser('testuser', 'password');
      expect(result).toEqual(mockUser);
    });

    it('should return null when credentials are invalid', async () => {
      mockUsersService.validateCredentials.mockReturnValue(
        of({
          isValid: false,
          user: null,
        })
      );

      const result = await service.validateUser('testuser', 'wrongpassword');
      expect(result).toBeNull();
    });

    it('should handle service unavailable error', async () => {
      mockUsersService.validateCredentials.mockReturnValue(
        throwError(() => ({ code: status.UNAVAILABLE }))
      );

      await expect(service.validateUser('testuser', 'password')).rejects.toThrow(
        InternalServerErrorException
      );
    });
  });

  describe('register', () => {
    const mockCreateUserRequest = {
      username: 'newuser',
      password: 'password123',
      email: 'new@example.com',
      firstName: 'New',
      lastName: 'User',
    };

    it('should successfully register a new user', async () => {
      const mockCreatedUser = {
        id: '1',
        ...mockCreateUserRequest,
        roles: ['user'],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockUsersService.create.mockReturnValue(of(mockCreatedUser));
      mockJwtService.signAsync
        .mockResolvedValueOnce('mock_access_token')
        .mockResolvedValueOnce('mock_refresh_token');
      mockRedisService.saveRefreshToken.mockResolvedValue(true);
      mockConfigService.get.mockReturnValue('3600');

      const result = await service.register(mockCreateUserRequest);

      expect(result).toHaveProperty('access_token', 'mock_access_token');
      expect(result).toHaveProperty('refresh_token', 'mock_refresh_token');
      expect(mockUsersService.create).toHaveBeenCalledWith(mockCreateUserRequest);
    });

    it('should handle user already exists error', async () => {
      const error = {
        code: status.ALREADY_EXISTS,
        message: 'User already exists',
        details: 'Username or email already taken'
      };

      mockUsersService.create.mockReturnValue(throwError(() => error));

      await expect(service.register(mockCreateUserRequest)).rejects.toThrow(RpcException);
    });
  });

  describe('login', () => {
    const mockUser = {
      id: '1',
      username: 'testuser',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      roles: ['user'],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    it('should return tokens on successful login', async () => {
      mockJwtService.signAsync
        .mockResolvedValueOnce('mock_access_token')
        .mockResolvedValueOnce('mock_refresh_token');
      mockRedisService.saveRefreshToken.mockResolvedValue(true);
      mockConfigService.get.mockReturnValue('3600');

      const result = await service.login(mockUser);

      expect(result).toHaveProperty('access_token', 'mock_access_token');
      expect(result).toHaveProperty('refresh_token', 'mock_refresh_token');
      expect(mockRedisService.saveRefreshToken).toHaveBeenCalled();
    });
  });

  describe('refreshTokens', () => {
    const mockDecodedToken = {
      sub: '1',
      username: 'testuser',
    };

    beforeEach(() => {
      mockJwtService.verify.mockReturnValue(mockDecodedToken);
      mockConfigService.get.mockReturnValue('3600');
    });

    it('should refresh tokens successfully', async () => {
      mockRedisService.getRefreshToken.mockResolvedValue('valid_refresh_token');
      mockJwtService.verifyAsync.mockResolvedValue({ sub: '1', username: 'testuser' });
      mockUsersService.findOne.mockReturnValue(
        of({
          id: '1',
          username: 'testuser',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          roles: ['user'],
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
      );
      mockJwtService.signAsync
        .mockResolvedValueOnce('new_access_token')
        .mockResolvedValueOnce('new_refresh_token');
      mockRedisService.saveRefreshToken.mockResolvedValue(true);

      const result = await service.refreshTokens('valid_refresh_token');

      expect(result).toHaveProperty('access_token', 'new_access_token');
      expect(result).toHaveProperty('refresh_token', 'new_refresh_token');
    });

    it('should throw unauthorized for invalid refresh token', async () => {
      mockRedisService.getRefreshToken.mockResolvedValue(null);

      await expect(service.refreshTokens('invalid_token')).rejects.toThrow(
        UnauthorizedException
      );
    });
  });

  describe('logout', () => {
    it('should successfully logout user', async () => {
      mockRedisService.removeRefreshToken.mockResolvedValue(true);

      await service.logout('1');

      expect(mockRedisService.removeRefreshToken).toHaveBeenCalledWith('1');
    });
  });
});
