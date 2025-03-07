import { ClientOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';

export const productsGrpcOptions: ClientOptions = {
  transport: Transport.GRPC,
  options: {
    package: 'products',
    protoPath: join(__dirname, '../protos/products.proto'),
    url: 'products-service:5000',
  },
};

export const ordersGrpcOptions: ClientOptions = {
  transport: Transport.GRPC,
  options: {
    package: 'orders',
    protoPath: join(__dirname, '../protos/orders.proto'),
    url: 'orders-service:5001', // Orders service gRPC port
  },
};
