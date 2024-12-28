import { GrpcExceptionFilter } from './grpc-exception.filter';
import { status } from '@grpc/grpc-js';
import { HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';

describe('GrpcExceptionFilter', () => {
  let filter: GrpcExceptionFilter;
  let mockHttpArgumentsHost;

  beforeEach(() => {
    filter = new GrpcExceptionFilter();
    mockHttpArgumentsHost = {
      getResponse: jest.fn(),
      getRequest: jest.fn().mockReturnValue({
        url: '/test-url'
      }),
      getNext: jest.fn(),
    };
  });

  const mockArgumentsHost = {
    switchToHttp: () => mockHttpArgumentsHost,
    getArgByIndex: jest.fn(),
    getArgs: jest.fn(),
    getType: jest.fn(),
    switchToRpc: jest.fn(),
    switchToWs: jest.fn(),
  };

  it('should transform INVALID_ARGUMENT to BAD_REQUEST', () => {
    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockHttpArgumentsHost.getResponse.mockReturnValue(mockResponse);

    const error = {
      toString: () => '3 INVALID_ARGUMENT: Invalid input'
    };

    const exception = new RpcException(error);
    jest.spyOn(exception, 'getError').mockReturnValue(error);

    filter.catch(exception, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.BAD_REQUEST,
      message: 'Invalid input',
      path: '/test-url',
      timestamp: expect.any(String)
    });
  });

  it('should transform UNAUTHENTICATED to UNAUTHORIZED', () => {
    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockHttpArgumentsHost.getResponse.mockReturnValue(mockResponse);

    const error = {
      toString: () => '16 UNAUTHENTICATED: Unauthenticated request'
    };

    const exception = new RpcException(error);
    jest.spyOn(exception, 'getError').mockReturnValue(error);

    filter.catch(exception, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.UNAUTHORIZED,
      message: 'Unauthenticated request',
      path: '/test-url',
      timestamp: expect.any(String)
    });
  });

  it('should transform NOT_FOUND to NOT_FOUND', () => {
    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockHttpArgumentsHost.getResponse.mockReturnValue(mockResponse);

    const error = {
      toString: () => '5 NOT_FOUND: Resource not found'
    };

    const exception = new RpcException(error);
    jest.spyOn(exception, 'getError').mockReturnValue(error);

    filter.catch(exception, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.NOT_FOUND,
      message: 'Resource not found',
      path: '/test-url',
      timestamp: expect.any(String)
    });
  });

  it('should transform INTERNAL to INTERNAL_SERVER_ERROR', () => {
    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockHttpArgumentsHost.getResponse.mockReturnValue(mockResponse);

    const error = {
      toString: () => '13 INTERNAL: Internal server error'
    };

    const exception = new RpcException(error);
    jest.spyOn(exception, 'getError').mockReturnValue(error);

    filter.catch(exception, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      path: '/test-url',
      timestamp: expect.any(String)
    });
  });
});
