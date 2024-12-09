import { Injectable, OnModuleInit } from '@nestjs/common';
import { Client, ClientGrpc } from '@nestjs/microservices';
import { ordersGrpcOptions } from '../config/grpc.config';
import { Observable, lastValueFrom } from 'rxjs';

interface OrdersGrpcService {
  findAll(data: {}): Observable<any>;
  findOne(data: { id: string }): Observable<any>;
  createOrder(data: any): Observable<any>;
  updateStatus(data: { id: string; status: string }): Observable<any>;
  remove(data: { id: string }): Observable<any>;
}

@Injectable()
export class OrdersService implements OnModuleInit {
  @Client(ordersGrpcOptions)
  private readonly client: ClientGrpc;
  
  private ordersService: OrdersGrpcService;

  onModuleInit() {
    this.ordersService = this.client.getService<OrdersGrpcService>('OrdersService');
  }

  async findAll() {
    return lastValueFrom(this.ordersService.findAll({}));
  }

  async findOne(data: { id: string }) {
    return lastValueFrom(this.ordersService.findOne(data));
  }

  async create(data: any) {
    return lastValueFrom(this.ordersService.createOrder(data));
  }

  async updateStatus(data: { id: string; status: string }) {
    return lastValueFrom(this.ordersService.updateStatus(data));
  }

  async remove(data: { id: string }) {
    return lastValueFrom(this.ordersService.remove(data));
  }
}
