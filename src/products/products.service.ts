import { Injectable, OnModuleInit } from '@nestjs/common';
import { Client, ClientGrpc } from '@nestjs/microservices';
import { productsGrpcOptions } from '../config/grpc.config';
import { Observable, lastValueFrom } from 'rxjs';

interface ProductsGrpcService {
  findAll(data: {}): Observable<any>;
  findOne(data: { id: string }): Observable<any>;
  create(data: any): Observable<any>;
  update(data: any): Observable<any>;
  remove(data: { id: string }): Observable<any>;
}

@Injectable()
export class ProductsService implements OnModuleInit {
  @Client(productsGrpcOptions)
  private readonly client: ClientGrpc;
  
  private productsService: ProductsGrpcService;

  onModuleInit() {
    this.productsService = this.client.getService<ProductsGrpcService>('ProductsService');
  }

  async findAll() {
    return lastValueFrom(this.productsService.findAll({}));
  }

  async findOne(data: { id: string }) {
    return lastValueFrom(this.productsService.findOne(data));
  }

  async create(data: any) {
    return lastValueFrom(this.productsService.create(data));
  }

  async update(data: any) {
    return lastValueFrom(this.productsService.update(data));
  }

  async remove(data: { id: string }) {
    return lastValueFrom(this.productsService.remove(data));
  }
}
