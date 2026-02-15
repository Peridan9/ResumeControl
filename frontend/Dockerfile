# Multi-stage build for React/Vite frontend
# Stage 1: Build the application
FROM node:20-alpine AS builder

# Build-time env for Clerk (Vite bakes VITE_* into the bundle)
ARG VITE_CLERK_PUBLISHABLE_KEY
ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY

# Set working directory
WORKDIR /app

# Copy package files first (for better layer caching)
COPY package.json package-lock.json ./

# Install dependencies (cached layer if package files don't change)
RUN npm ci

# Copy the rest of the source code
COPY . .

# Build the application for production
# This creates optimized static files in the dist/ directory
RUN npm run build

# Stage 2: Serve static files with nginx
FROM nginx:alpine

# Copy custom nginx config (if needed for SPA routing)
# For now, we'll use the default nginx config and copy built files
# The main nginx reverse proxy will handle serving these files

# Copy built static files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config for SPA (handles client-side routing)
# This ensures React Router works correctly - all routes serve index.html
RUN echo 'server { \
    listen 80; \
    server_name _; \
    root /usr/share/nginx/html; \
    index index.html; \
    \
    # Gzip compression for better performance \
    gzip on; \
    gzip_vary on; \
    gzip_min_length 1024; \
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript; \
    \
    # Serve static files \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    \
    # Cache static assets \
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ { \
        expires 1y; \
        add_header Cache-Control "public, immutable"; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Expose port 80 (nginx default)
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
