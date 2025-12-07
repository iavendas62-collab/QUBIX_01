#!/bin/bash

# QUBIX Production Deployment Script
# Requirements: All - Deploy and configure production environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  QUBIX Production Deployment Script   ${NC}"
echo -e "${GREEN}========================================${NC}"

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo -e "${YELLOW}Warning: Running as root. Consider using a non-root user with docker permissions.${NC}"
fi

# Check for required tools
check_requirements() {
    echo -e "\n${YELLOW}Checking requirements...${NC}"
    
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}Error: Docker is not installed${NC}"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        echo -e "${RED}Error: Docker Compose is not installed${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Docker and Docker Compose are installed${NC}"
}

# Check for environment file
check_env() {
    echo -e "\n${YELLOW}Checking environment configuration...${NC}"
    
    if [ ! -f ".env.production" ]; then
        echo -e "${RED}Error: .env.production file not found${NC}"
        echo -e "${YELLOW}Please copy .env.production.example to .env.production and configure it${NC}"
        exit 1
    fi
    
    # Source the env file
    set -a
    source .env.production
    set +a
    
    # Check required variables
    required_vars=("POSTGRES_PASSWORD" "REDIS_PASSWORD" "JWT_SECRET" "QUBIC_PLATFORM_ADDRESS")
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            echo -e "${RED}Error: $var is not set in .env.production${NC}"
            exit 1
        fi
    done
    
    echo -e "${GREEN}✓ Environment configuration is valid${NC}"
}

# Check SSL certificates
check_ssl() {
    echo -e "\n${YELLOW}Checking SSL certificates...${NC}"
    
    if [ ! -d "ssl" ]; then
        mkdir -p ssl
    fi
    
    if [ ! -f "ssl/fullchain.pem" ] || [ ! -f "ssl/privkey.pem" ]; then
        echo -e "${YELLOW}Warning: SSL certificates not found in ./ssl/${NC}"
        echo -e "${YELLOW}For production, generate certificates with Let's Encrypt:${NC}"
        echo -e "  certbot certonly --webroot -w /var/www/certbot -d your-domain.com"
        echo -e "\n${YELLOW}Creating self-signed certificates for testing...${NC}"
        
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout ssl/privkey.pem \
            -out ssl/fullchain.pem \
            -subj "/C=US/ST=State/L=City/O=QUBIX/CN=localhost" 2>/dev/null
        
        echo -e "${GREEN}✓ Self-signed certificates created (for testing only!)${NC}"
    else
        echo -e "${GREEN}✓ SSL certificates found${NC}"
    fi
}

# Build and deploy
deploy() {
    echo -e "\n${YELLOW}Building and deploying QUBIX...${NC}"
    
    # Use docker compose (v2) or docker-compose (v1)
    if docker compose version &> /dev/null; then
        COMPOSE_CMD="docker compose"
    else
        COMPOSE_CMD="docker-compose"
    fi
    
    # Pull latest images
    echo -e "\n${YELLOW}Pulling latest base images...${NC}"
    $COMPOSE_CMD -f docker-compose.prod.yml pull postgres redis
    
    # Build application images
    echo -e "\n${YELLOW}Building application images...${NC}"
    $COMPOSE_CMD -f docker-compose.prod.yml build --no-cache
    
    # Stop existing containers
    echo -e "\n${YELLOW}Stopping existing containers...${NC}"
    $COMPOSE_CMD -f docker-compose.prod.yml down
    
    # Start services
    echo -e "\n${YELLOW}Starting services...${NC}"
    $COMPOSE_CMD -f docker-compose.prod.yml --env-file .env.production up -d
    
    # Wait for services to be healthy
    echo -e "\n${YELLOW}Waiting for services to be healthy...${NC}"
    sleep 10
    
    # Run database migrations
    echo -e "\n${YELLOW}Running database migrations...${NC}"
    $COMPOSE_CMD -f docker-compose.prod.yml exec -T backend npx prisma migrate deploy
    
    echo -e "\n${GREEN}========================================${NC}"
    echo -e "${GREEN}  Deployment Complete!                  ${NC}"
    echo -e "${GREEN}========================================${NC}"
}

# Health check
health_check() {
    echo -e "\n${YELLOW}Running health checks...${NC}"
    
    # Check backend health
    if curl -sf http://localhost:3001/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Backend is healthy${NC}"
    else
        echo -e "${RED}✗ Backend health check failed${NC}"
    fi
    
    # Check frontend health
    if curl -sf http://localhost/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Frontend is healthy${NC}"
    else
        echo -e "${RED}✗ Frontend health check failed${NC}"
    fi
    
    # Show container status
    echo -e "\n${YELLOW}Container Status:${NC}"
    docker ps --filter "name=qubix" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
}

# Main execution
main() {
    check_requirements
    check_env
    check_ssl
    deploy
    health_check
    
    echo -e "\n${GREEN}QUBIX is now running!${NC}"
    echo -e "Frontend: https://localhost (or your domain)"
    echo -e "Backend API: https://localhost/api"
    echo -e "WebSocket: wss://localhost/ws"
    echo -e "\n${YELLOW}View logs with: docker compose -f docker-compose.prod.yml logs -f${NC}"
}

# Run main function
main "$@"
