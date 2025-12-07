#!/bin/bash
# Script para verificar variáveis de ambiente no Railway
# Execute no Railway Shell: bash check-railway-env.sh

echo "=== VERIFICAÇÃO DE VARIÁVEIS NO RAILWAY ==="
echo ""

echo "1. DATABASE_URL:"
if [ -z "$DATABASE_URL" ]; then
    echo "   ❌ NÃO ENCONTRADA"
else
    echo "   ✅ ENCONTRADA: ${DATABASE_URL:0:30}..."
fi

echo ""
echo "2. REDIS_URL:"
if [ -z "$REDIS_URL" ]; then
    echo "   ❌ NÃO ENCONTRADA"
else
    echo "   ✅ ENCONTRADA: ${REDIS_URL:0:30}..."
fi

echo ""
echo "3. NODE_ENV:"
if [ -z "$NODE_ENV" ]; then
    echo "   ⚠️  NÃO DEFINIDA"
else
    echo "   ✅ $NODE_ENV"
fi

echo ""
echo "4. JWT_SECRET:"
if [ -z "$JWT_SECRET" ]; then
    echo "   ❌ NÃO ENCONTRADA"
else
    echo "   ✅ ENCONTRADA (${#JWT_SECRET} caracteres)"
fi

echo ""
echo "5. QUBIC_NETWORK:"
if [ -z "$QUBIC_NETWORK" ]; then
    echo "   ⚠️  NÃO DEFINIDA"
else
    echo "   ✅ $QUBIC_NETWORK"
fi

echo ""
echo "=== TODAS AS VARIÁVEIS DISPONÍVEIS ==="
env | grep -E "DATABASE|REDIS|POSTGRES|NODE_ENV|JWT|QUBIC" | sort

echo ""
echo "=== DIAGNÓSTICO ==="
if [ -z "$DATABASE_URL" ]; then
    echo "❌ PROBLEMA CRÍTICO: DATABASE_URL não está configurada!"
    echo ""
    echo "SOLUÇÃO:"
    echo "1. Vá no Railway Dashboard"
    echo "2. Clique no serviço Backend"
    echo "3. Vá na aba 'Variables'"
    echo "4. Adicione: DATABASE_URL = \${{Postgres.DATABASE_URL}}"
    echo "   (ou o nome do seu serviço PostgreSQL)"
fi

if [ -z "$REDIS_URL" ]; then
    echo "❌ PROBLEMA: REDIS_URL não está configurada!"
    echo ""
    echo "SOLUÇÃO:"
    echo "1. Vá no Railway Dashboard"
    echo "2. Clique no serviço Backend"
    echo "3. Vá na aba 'Variables'"
    echo "4. Adicione: REDIS_URL = redis://default:\${{Redis.REDIS_PASSWORD}}@\${{Redis.RAILWAY_PRIVATE_DOMAIN}}:6379"
fi

echo ""
echo "=== FIM DO DIAGNÓSTICO ==="
