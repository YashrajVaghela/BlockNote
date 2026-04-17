FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy application code
COPY . .

# Expose backend port
EXPOSE 5000

# Default command (can be overridden by docker-compose)
CMD ["npm", "run", "dev"]
