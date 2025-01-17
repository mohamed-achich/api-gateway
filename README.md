# API Gateway Demo

[![CI/CD Pipeline](https://github.com/mohamed-achich/api-gateway/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/mohamed-achich/api-gateway/actions)

## About This Demo Project

This API Gateway is part of a demonstration project showcasing my implementation of a scalable microservices architecture. While it uses an e-commerce context, the focus is on demonstrating clean code, proper system design, and microservices best practices rather than implementing a full e-commerce solution.

### Related Components

- **[E-commerce Platform](https://github.com/mohamed-achich/ecommerce-deployment)** - Main deployment and infrastructure demo
- **[Users Service](https://github.com/mohamed-achich/users-microservice)** - Basic user management
- **[Products Service](https://github.com/mohamed-achich/products-microservice)** - Simple product catalog
- **[Orders Service](https://github.com/mohamed-achich/orders-microservice)** - Basic order processing

## Service Overview

This gateway demonstrates API management patterns using NestJS. It showcases routing, authentication, and service communication implementations in a microservices architecture.

### Implementation Highlights

- Basic request routing
- Simple authentication flow
- Rate limiting example
- Service discovery demonstration
- Error handling patterns
- Basic request transformation
- Swagger documentation setup

## Features

- Request routing to appropriate microservices
- Authentication and authorization
- Rate limiting with Redis
- JWT token management
- gRPC communication with microservices
- Error handling and request validation
- Request/Response transformation
- Service discovery
- API documentation with Swagger

## Technical Stack

- **Framework**: NestJS
- **Language**: TypeScript
- **Cache**: Redis
- **Communication**: REST, gRPC
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest
- **CI/CD**: GitHub Actions

## Architecture

The API Gateway implements a layered architecture:

1. **Controllers**: Handle HTTP requests and response formatting
2. **Guards**: Implement authentication and authorization
3. **Services**: Contain business logic and microservice communication
4. **DTOs**: Define data transfer objects for validation
5. **Interceptors**: Handle cross-cutting concerns

## Error Handling

The service implements global error handling for:
- Validation errors
- Authentication errors
- Authorization errors
- Service unavailability
- Rate limiting
- Generic errors

## Security Features

- JWT-based authentication
- Rate limiting
- Request validation
- CORS protection
- Helmet security headers
- Token refresh mechanism
- Token blacklisting

## Authentication Flow

### User Authentication
1. Client sends authentication request to API Gateway
2. API Gateway forwards credentials to Users Microservice via gRPC
3. Users Microservice validates credentials and returns user data
4. API Gateway generates JWT tokens (access + refresh) and stores session in Redis
5. Tokens are returned to client

### Service-to-Service Authentication
1. Each microservice has a unique service token for inter-service communication
2. Service tokens are validated by the Users Microservice
3. API Gateway acts as the authentication middleware for all service-to-service calls
4. Service authentication uses the `ValidateServiceToken` gRPC endpoint

### Security Implementation
- Password hashing is handled exclusively by Users Microservice using scrypt
- JWT tokens are generated and validated by API Gateway
- Redis stores refresh tokens and session data
- Service tokens are short-lived (1 hour) and scope-limited

### Authentication Endpoints
- POST `/auth/login` - User login
- POST `/auth/register` - User registration
- POST `/auth/refresh` - Refresh access token
- POST `/auth/logout` - User logout
- POST `/auth/service-token` - Generate service token (internal use)

### Microservices Communication
1. Users Microservice:
   - Handles user management and password hashing
   - Validates user credentials
   - Validates service tokens
   - Exposes gRPC endpoints for auth operations

2. API Gateway:
   - Generates and validates JWT tokens
   - Manages user sessions
   - Routes requests to appropriate microservices
   - Handles service-to-service authentication

### Security Considerations
- Passwords are never stored or hashed outside Users Microservice
- All inter-service communication is authenticated
- Refresh tokens are stored in Redis with expiration
- Service tokens have limited scope and short lifetime

## Related Services
- [Users Service](https://github.com/mohamed-achich/users-microservice) - User Management Service
- [Orders Service](https://github.com/mohamed-achich/orders-microservice) - Order Management Service
- [Products Service](https://github.com/mohamed-achich/products-microservice) - Product Catalog Service
- [E-commerce Deployment](https://github.com/mohamed-achich/ecommerce-deployment) - Infrastructure and Deployment

## API Documentation

### Authentication Endpoints

```
POST /auth/register
- Register a new user
- Public endpoint
- Body: { email, password, name }
- Returns: { access_token, refresh_token }

POST /auth/login
- Login existing user
- Public endpoint
- Body: { email, password }
- Returns: { access_token, refresh_token }

POST /auth/refresh
- Refresh access token
- Public endpoint
- Body: { refresh_token }
- Returns: { access_token, refresh_token }

POST /auth/logout
- Logout user
- Protected endpoint
- Requires valid JWT
```

### Products Endpoints

```
GET /products
- List all products
- Public endpoint

GET /products/:id
- Get single product details
- Public endpoint

POST /products
- Create new product
- Protected endpoint
- Requires valid JWT
- Body: Product details

PUT /products/:id
- Update product
- Protected endpoint
- Requires valid JWT
- Body: Updated product details

DELETE /products/:id
- Delete product
- Protected endpoint
- Requires valid JWT
```

### Orders Endpoints

```
GET /orders
- List all orders
- Protected endpoint
- Requires valid JWT

GET /orders/:id
- Get single order details
- Protected endpoint
- Requires valid JWT

POST /orders
- Create new order
- Protected endpoint
- Requires valid JWT
- Body: Order details

PUT /orders/:id/status
- Update order status
- Protected endpoint
- Requires valid JWT
- Body: { status }

DELETE /orders/:id
- Delete order
- Protected endpoint
- Requires valid JWT
```

## Setup and Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file with the following variables:
```env
# Server
PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Microservices
USERS_SERVICE_URL=localhost:5002
PRODUCTS_SERVICE_URL=localhost:5000
ORDERS_SERVICE_URL=localhost:5001
```

4. Run the service:
```bash
# Development
npm run start:dev

# Production
npm run start:prod
```

## Docker Support

Build and run using Docker:

```bash
# Build the image
docker build -t api-gateway .

# Run the container
docker run -p 3000:3000 api-gateway
```

Using Docker Compose:

```bash
docker-compose up
```

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
