# Use official Node.js image
FROM node:18-alpine

# Set working directory inside container
WORKDIR /app

# Copy prisma files
COPY prisma ./prisma/

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the app
COPY . .

# Build TypeScript
RUN npm run build

# Expose port 3000
EXPOSE 3000

# Run migrations, seed data, and start the app
CMD npx prisma migrate deploy && npx ts-node prisma/seed.ts && npm start
