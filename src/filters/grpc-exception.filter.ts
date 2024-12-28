import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Response } from 'express';

@Catch(RpcException)
export class GrpcExceptionFilter implements ExceptionFilter {
  private grpcToHttpStatus(grpcCode: number): number {
    const statusMap = {
      0: HttpStatus.OK,                  // OK
      1: HttpStatus.INTERNAL_SERVER_ERROR, // CANCELLED
      2: HttpStatus.INTERNAL_SERVER_ERROR, // UNKNOWN
      3: HttpStatus.BAD_REQUEST,         // INVALID_ARGUMENT
      4: HttpStatus.GATEWAY_TIMEOUT,     // DEADLINE_EXCEEDED
      5: HttpStatus.NOT_FOUND,           // NOT_FOUND
      6: HttpStatus.CONFLICT,            // ALREADY_EXISTS
      7: HttpStatus.FORBIDDEN,           // PERMISSION_DENIED
      8: HttpStatus.TOO_MANY_REQUESTS,   // RESOURCE_EXHAUSTED
      9: HttpStatus.PRECONDITION_FAILED, // FAILED_PRECONDITION
      10: HttpStatus.CONFLICT,           // ABORTED
      11: HttpStatus.BAD_REQUEST,        // OUT_OF_RANGE
      12: HttpStatus.NOT_IMPLEMENTED,    // UNIMPLEMENTED
      13: HttpStatus.INTERNAL_SERVER_ERROR, // INTERNAL
      14: HttpStatus.SERVICE_UNAVAILABLE,  // UNAVAILABLE
      15: HttpStatus.INTERNAL_SERVER_ERROR, // DATA_LOSS
      16: HttpStatus.UNAUTHORIZED,       // UNAUTHENTICATED
    };
    return statusMap[grpcCode] || HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private extractGrpcError(error: string): { code: number; message: string } {
    // Remove 'Error: ' prefix if it exists
    const cleanError = error.replace(/^Error:\s*/, '');
    
    // Format: "6 ALREADY_EXISTS: Username or email already exists"
    const match = cleanError.match(/^(\d+)\s+([A-Z_]+):\s+(.+)$/);
    if (match) {
      return {
        code: parseInt(match[1], 10),
        message: match[3]
      };
    }
    return {
      code: HttpStatus.INTERNAL_SERVER_ERROR,
      message: error
    };
  }

  catch(exception: RpcException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const rpcError = exception.getError();

    console.log('Raw RPC Error:', rpcError);

    // Extract error details from the gRPC error message
    const error = this.extractGrpcError(rpcError.toString());
    console.log('Processed Error:', error);

    // Map gRPC status code to HTTP status code
    const httpStatus = this.grpcToHttpStatus(error.code);

    const errorResponse = {
      statusCode: httpStatus,
      message: error.message,
      path: ctx.getRequest().url,
      timestamp: new Date().toISOString()
    };

    console.log('Final Error Response:', errorResponse);
    
    response.status(httpStatus).json(errorResponse);
  }
}
