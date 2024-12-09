import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  async findAll() {
    return this.ordersService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.ordersService.findOne({ id });
  }

  @Post()
  async create(@Body() createOrderDto: any) {
    return this.ordersService.create(createOrderDto);
  }

  @Put(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.ordersService.updateStatus({ id, status });
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.ordersService.remove({ id });
  }
}
