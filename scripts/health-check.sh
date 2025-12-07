#!/bin/bash

# QUBIX Production Health Check Script
# Verifies all services are running correctly

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  QUBIX Health Check                   ${NC}"
echo -e "${GREEN}========================================${NC}"

# Configuration
DOMAIN=${1:-"localhost"}
PROTOCOL=${2:-"https"}
BASE_URL="$PROTOCOL://$DOMAIN"

PASSED=0
FAILED=0

check() {
    local name=$1
    local url=$2
    local expected=${3:-200}
    
    echo -n "Checking $name... "
    
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 -k "$url" 2>/dev/null || echo "000")
    
    if [ "$HTTP_CODE" = "$expected" ]; then
        echo -e "${GREEN}✓ OK (HTTP $HTTP_CODE)${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAILED (HTTP $HTTP_CODE, expected $expected)${NC}"
        ((FAILED++))
    fi
}

# Container checks
echo -e "\n${YELLOW}Container Status:${NC}"
docker ps --filter "name=qubix" --format "  {{.Names}}: {{.Status}}"

# Service health checks
echo -e "\n${YELLOW}Service Health Checks:${NC}"

# Frontend
check "Frontend" "$BASE_URL/health"

# Backend API
check "Backend Health" "$BASE_URL/api/health"

# Backend Readiness
check "Backend Ready" "$BASE_URL/api/health/ready"

# Backend Liveness
check "Backend Live" "$BASE_URL/api/health/live"

# Database (via backend)
echo -n "Checking Database... "
DB_STATUS=$(curl -s -k "$BASE_URL/api/health/detailed" 2>/dev/null | grep -o '"database":{[^}]*"status":"[^"]*"' | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
if [ "$DB_STATUS" = "up" ]; then
    echo -e "${GREEN}✓ OK (status: $DB_STATUS)${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ FAILED (status: $DB_STATUS)${NC}"
    ((FAILED++))
fi

# WebSocket check
echo -n "Checking WebSocket... "
WS_URL=$(echo "$BASE_URL" | sed 's/http/ws/')
if command -v wscat &> /dev/null; then
    if timeout 5 wscat -c "$WS_URL/ws" --execute "ping" 2>/dev/null; then
        echo -e "${GREEN}✓ OK${NC}"
        ((PASSED++))
    else
        echo -e "${YELLOW}⚠ Could not verify (wscat timeout)${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Skipped (wscat not installed)${NC}"
fi

# SSL Certificate check
if [ "$PROTOCOL" = "https" ]; then
    echo -n "Checking SSL Certificate... "
    CERT_EXPIRY=$(echo | openssl s_client -servername "$DOMAIN" -connect "$DOMAIN:443" 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)
    if [ -n "$CERT_EXPIRY" ]; then
        EXPIRY_EPOCH=$(date -d "$CERT_EXPIRY" +%s 2>/dev/null || date -j -f "%b %d %T %Y %Z" "$CERT_EXPIRY" +%s 2>/dev/null)
        NOW_EPOCH=$(date +%s)
        DAYS_LEFT=$(( (EXPIRY_EPOCH - NOW_EPOCH) / 86400 ))
        
        if [ $DAYS_LEFT -gt 30 ]; then
            echo -e "${GREEN}✓ OK (expires in $DAYS_LEFT days)${NC}"
            ((PASSED++))
        elif [ $DAYS_LEFT -gt 0 ]; then
            echo -e "${YELLOW}⚠ Warning (expires in $DAYS_LEFT days)${NC}"
            ((PASSED++))
        else
            echo -e "${RED}✗ EXPIRED${NC}"
            ((FAILED++))
        fi
    else
        echo -e "${YELLOW}⚠ Could not verify${NC}"
    fi
fi

# Summary
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}  Health Check Summary                 ${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"

if [ $FAILED -gt 0 ]; then
    echo -e "\n${RED}Some checks failed. Please investigate.${NC}"
    exit 1
else
    echo -e "\n${GREEN}All checks passed!${NC}"
    exit 0
fi
