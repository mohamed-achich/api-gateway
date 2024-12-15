import { Injectable, OnModuleInit } from '@nestjs/common';
import { Client, ClientGrpc } from '@nestjs/microservices';
import { productsGrpcOptions } from '../config/grpc.config';
import { Observable, lastValueFrom } from 'rxjs';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Metadata } from '@grpc/grpc-js';
import { UnauthorizedException } from '@nestjs/common';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  category: string;
  isActive: boolean;
}

interface ProductsGrpcService {
  findAll(data: {}, metadata?: Metadata): Observable<{ products: Product[] }>;
  findOne(data: { id: string }, metadata?: Metadata): Observable<Product>;
  create(data: Omit<Product, 'id'>, metadata?: Metadata): Observable<Product>;
  update(data: Product, metadata?: Metadata): Observable<Product>;
  remove(data: { id: string }, metadata?: Metadata): Observable<Product>;
}

@Injectable()
export class ProductsService implements OnModuleInit {
  @Client(productsGrpcOptions)
  private readonly client: ClientGrpc;
  
  private productsService: ProductsGrpcService;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit() {
    this.productsService = this.client.getService<ProductsGrpcService>('ProductsService');
  }

  private getServiceMetadata(): Metadata {
    const secret = this.configService.get<string>('JWT_SERVICE_SECRET');
    console.log('Using secret for signing:', secret);
    
    const token = this.jwtService.sign(
      {
        type: 'service',
        service: 'api-gateway',
        iat: Math.floor(Date.now() / 1000),
      },
      {
        secret: secret,
        expiresIn: '1h',
      },
    );
    console.log('Generated token:', token);

    const metadata = new Metadata();
    metadata.set('authorization', `Bearer ${token}`);
    return metadata;
  }

  async findAll() {
    try {
      const metadata = this.getServiceMetadata();
      const response = await lastValueFrom(this.productsService.findAll({}, metadata));
      return response.products;
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
      return lastValueFrom(this.productsService.findOne(data, metadata));
    } catch (error) {
      if (error.code === 16) { // UNAUTHENTICATED in gRPC
        throw new UnauthorizedException(error.details || 'Unauthorized');
      }
      throw error;
    }
  }

  async create(data: Omit<Product, 'id'>) {
    try {
      const metadata = this.getServiceMetadata();
      return lastValueFrom(this.productsService.create(data, metadata));
    } catch (error) {
      if (error.code === 16) { // UNAUTHENTICATED in gRPC
        throw new UnauthorizedException(error.details || 'Unauthorized');
      }
      throw error;
    }
  }

  async update(data: Product) {
    try {
      const metadata = this.getServiceMetadata();
      return lastValueFrom(this.productsService.update(data, metadata));
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
      return lastValueFrom(this.productsService.remove(data, metadata));
    } catch (error) {
      if (error.code === 16) { // UNAUTHENTICATED in gRPC
        throw new UnauthorizedException(error.details || 'Unauthorized');
      }
      throw error;
    }
  }
}
