import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  
  // Enable shutdown hooks
  app.enableShutdownHooks();

  // Handle shutdown signals
  const signals = ['SIGTERM', 'SIGINT'];
  signals.forEach(signal => {
    process.on(signal, async () => {
      logger.log(`${signal} received. Starting graceful shutdown...`);
      try {
        // First close the NestJS application
        logger.log('Closing NestJS application...');
        await app.close();
        logger.log('NestJS application closed');

        // Then close all gRPC channels
        const grpcServices = [
          'ORDERS_PACKAGE',
          'PRODUCTS_PACKAGE',
          'USERS_SERVICE'
        ];

        // Close each gRPC connection
        for (const serviceName of grpcServices) {
          try {
            const service = app.get(serviceName) as any;
            if (service?.close) {
              logger.log(`Closing ${serviceName} connection...`);
              await service.close();
              logger.log(`${serviceName} connection closed`);
            }
          } catch (error) {
            // Log but don't throw - we want to try closing other connections
            logger.error(`Error closing ${serviceName}:`, error);
          }
        }

        logger.log('All connections closed successfully');
        process.exit(0);
      } catch (error) {
        logger.error('Error during shutdown:', error);
        // Force exit after error
        process.exit(1);
      }
    });
  });

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  
  // Enable CORS
  app.enableCors();

  try {
    // Bind to all interfaces (0.0.0.0) to allow external access
    await app.listen(port);
    logger.log(`Application is running on port ${port}`);
  } catch (error) {
    logger.error(`Failed to start server on port ${port}:`, error);
    process.exit(1);
  }
}

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

bootstrap().catch(error => {
  console.error('Fatal error during startup:', error);
  process.exit(1);
});
