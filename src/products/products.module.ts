import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { join } from 'path';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GrpcMetadataInterceptor } from '../interceptors/grpc-metadata.interceptor';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'PRODUCTS_PACKAGE',
        transport: Transport.GRPC,
        options: {
          url: process.env.PRODUCTS_SERVICE_URL || 'localhost:5000',
          package: 'products',
          protoPath: join(__dirname, '../protos/products.proto'),
        },
      },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SERVICE_SECRET'),
      }),
      inject: [ConfigService],
    }),
    ConfigModule,
  ],
  controllers: [ProductsController],
  providers: [ProductsService, GrpcMetadataInterceptor],
  exports: [ProductsService],
})
export class ProductsModule {}
