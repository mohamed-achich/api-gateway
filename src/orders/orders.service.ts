import { Injectable, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { Client, ClientGrpc } from '@nestjs/microservices';
import { ordersGrpcOptions } from '../config/grpc.config';
import { Observable, lastValueFrom } from 'rxjs';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Metadata } from '@grpc/grpc-js';

export interface Order {
  id: string;
  userId: string;
  products: Array<{
    productId: string;
    quantity: number;
  }>;
  status: string;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

interface OrdersGrpcService {
  findAll(data: {}, metadata?: Metadata): Observable<{ orders: Order[] }>;
  findOne(data: { id: string }, metadata?: Metadata): Observable<Order>;
  createOrder(data: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>, metadata?: Metadata): Observable<Order>;
  updateStatus(data: { id: string; status: string }, metadata?: Metadata): Observable<Order>;
  remove(data: { id: string }, metadata?: Metadata): Observable<Order>;
}

@Injectable()
export class OrdersService implements OnModuleInit {
  @Client(ordersGrpcOptions)
  private readonly client: ClientGrpc;
  
  private ordersService: OrdersGrpcService;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit() {
    this.ordersService = this.client.getService<OrdersGrpcService>('OrdersService');
  }

  private getServiceMetadata(): Metadata {
    const token = this.jwtService.sign(
      {
        type: 'service',
        service: 'api-gateway',
        iat: Math.floor(Date.now() / 1000),
      },
      {
        secret: this.configService.get<string>('JWT_SERVICE_SECRET'),
        expiresIn: '1h',
      },
    );

    const metadata = new Metadata();
    metadata.set('authorization', `Bearer ${token}`);
    return metadata;
  }

  async findAll() {
    try {
      const metadata = this.getServiceMetadata();
      const response = await lastValueFrom(this.ordersService.findAll({}, metadata));
      return response.orders;
    } catch (error) {
      if (error.code === 16) { // UNAUTHENTICATED in gRPC
        throw new UnauthorizedException(error.details || 'Unauthorized');
      }
      throw error;
    }
  }

  async findOne(data: { id: string }) {
    try {
      const metadata = this.getServiceMetadata();
      return lastValueFrom(this.ordersService.findOne(data, metadata));
    } catch (error) {
      if (error.code === 16) { // UNAUTHENTICATED in gRPC
        throw new UnauthorizedException(error.details || 'Unauthorized');
      }
      throw error;
    }
  }

  async create(data: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      const metadata = this.getServiceMetadata();
      return lastValueFrom(this.ordersService.createOrder(data, metadata));
    } catch (error) {
      if (error.code === 16) { // UNAUTHENTICATED in gRPC
        throw new UnauthorizedException(error.details || 'Unauthorized');
      }
      throw error;
    }
  }

  async updateStatus(data: { id: string; status: string }) {
    try {
      const metadata = this.getServiceMetadata();
      return lastValueFrom(this.ordersService.updateStatus(data, metadata));
    } catch (error) {
      if (error.code === 16) { // UNAUTHENTICATED in gRPC
        throw new UnauthorizedException(error.details || 'Unauthorized');
      }
      throw error;
    }
  }

  async remove(data: { id: string }) {
    try {
      const metadata = this.getServiceMetadata();
      return lastValueFrom(this.ordersService.remove(data, metadata));
    } catch (error) {
      if (error.code === 16) { // UNAUTHENTICATED in gRPC
        throw new UnauthorizedException(error.details || 'Unauthorized');
      }
      throw error;
    }
  }
}
