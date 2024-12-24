FROM node:18-alpine

# Create app directory and set permissions
WORKDIR /app

# Add node user and set ownership
RUN addgroup -S appgroup && adduser -S appuser -G appgroup && \
    chown -R appuser:appgroup /app

# Copy package files
COPY package*.json ./

RUN npm install

# Copy application code
COPY . .

RUN npm run build

CMD ["npm", "run", "start:prod"]
