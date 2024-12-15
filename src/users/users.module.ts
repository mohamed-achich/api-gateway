import { Module } from '@nestjs/common';
import { UsersGrpcService } from './users.service';

@Module({
  providers: [UsersGrpcService],
  exports: [UsersGrpcService],
})
export class UsersModule {}
