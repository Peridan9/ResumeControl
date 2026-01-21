# Multi-stage build for Go backend
# Stage 1: Build the application
FROM golang:1.21-alpine AS builder

# Install build dependencies (git for go modules, ca-certificates for HTTPS)
RUN apk add --no-cache git ca-certificates

# Set working directory
WORKDIR /build

# Copy go mod files first (for better layer caching)
COPY go.mod go.sum ./
# Download dependencies (cached layer if go.mod/go.sum don't change)
RUN go mod download

# Copy the rest of the source code
COPY . .

# Build the binary
# CGO_ENABLED=0 creates a statically linked binary
# -ldflags="-w -s" reduces binary size by stripping debug info
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o resumecontrol-backend ./main.go

# Stage 2: Minimal runtime image
FROM alpine:latest

# Install ca-certificates for HTTPS connections and wget for health checks
RUN apk --no-cache add ca-certificates wget

# Create non-root user for security
RUN addgroup -g 1000 appuser && \
    adduser -D -u 1000 -G appuser appuser

WORKDIR /app

# Copy the binary from builder stage
COPY --from=builder /build/resumecontrol-backend .

# Change ownership to non-root user
RUN chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose port (default 8080, can be overridden via PORT env var)
EXPOSE 8080

# Health check to verify the container is running
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/health || exit 1

# Run the application
CMD ["./resumecontrol-backend"]
