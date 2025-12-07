#!/bin/bash

# QUBIX SSL Certificate Setup Script
# Uses Let's Encrypt for free SSL certificates

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  QUBIX SSL Certificate Setup          ${NC}"
echo -e "${GREEN}========================================${NC}"

# Check if domain is provided
if [ -z "$1" ]; then
    echo -e "${YELLOW}Usage: $0 <domain> [email]${NC}"
    echo -e "Example: $0 qubix.io admin@qubix.io"
    exit 1
fi

DOMAIN=$1
EMAIL=${2:-"admin@$DOMAIN"}

# Check for certbot
if ! command -v certbot &> /dev/null; then
    echo -e "${YELLOW}Installing certbot...${NC}"
    
    if command -v apt-get &> /dev/null; then
        sudo apt-get update
        sudo apt-get install -y certbot
    elif command -v yum &> /dev/null; then
        sudo yum install -y certbot
    elif command -v brew &> /dev/null; then
        brew install certbot
    else
        echo -e "${RED}Error: Could not install certbot. Please install manually.${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✓ Certbot is installed${NC}"

# Create SSL directory
mkdir -p ssl

# Stop any running services on port 80
echo -e "\n${YELLOW}Stopping services on port 80...${NC}"
if docker compose -f docker-compose.prod.yml ps 2>/dev/null | grep -q "frontend"; then
    docker compose -f docker-compose.prod.yml stop frontend
fi

# Generate certificate
echo -e "\n${YELLOW}Generating SSL certificate for $DOMAIN...${NC}"
sudo certbot certonly \
    --standalone \
    --preferred-challenges http \
    --agree-tos \
    --email "$EMAIL" \
    -d "$DOMAIN" \
    -d "www.$DOMAIN" \
    --non-interactive

# Copy certificates
echo -e "\n${YELLOW}Copying certificates...${NC}"
sudo cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ./ssl/
sudo cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" ./ssl/
sudo chown $USER:$USER ./ssl/*.pem
chmod 600 ./ssl/*.pem

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}  SSL Certificate Setup Complete!       ${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "\nCertificates saved to ./ssl/"
echo -e "  - fullchain.pem"
echo -e "  - privkey.pem"
echo -e "\n${YELLOW}Certificate will expire in 90 days.${NC}"
echo -e "Setup auto-renewal with:"
echo -e "  sudo certbot renew --dry-run"
echo -e "\nAdd to crontab for auto-renewal:"
echo -e "  0 0 1 * * certbot renew --quiet && docker compose -f docker-compose.prod.yml restart frontend"
