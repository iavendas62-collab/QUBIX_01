# 🚀 Integração Qubic - Backend

## ⚡ Quick Start

```bash
# Testar integração
npm run test:qubic

# Ver exemplos práticos
npm run exemplo:qubic
```

## 📚 Documentação

### 🎯 Comece aqui
- **[GUIA_RAPIDO_QUBIC.md](./GUIA_RAPIDO_QUBIC.md)** - Guia rápido em português

### 📖 Documentação completa
- **[QUBIC_LIBRARY_INTEGRATION.md](./QUBIC_LIBRARY_INTEGRATION.md)** - Detalhes técnicos
- **[../INTEGRACAO_QUBIC_COMPLETA.md](../INTEGRACAO_QUBIC_COMPLETA.md)** - Visão geral
- **[../RESUMO_INTEGRACAO_QUBIC.md](../RESUMO_INTEGRACAO_QUBIC.md)** - Resumo executivo

## 💻 Código

### Serviço principal
```typescript
import qubicWallet from './src/services/qubic-wallet';

// Criar carteira
const wallet = await qubicWallet.createWallet();
console.log('Identity:', wallet.identity);

// Consultar saldo
await qubicWallet.initializeClient();
const balance = await qubicWallet.getBalance(wallet.identity);
console.log('Saldo:', balance.energyQubic, 'QUBIC');
```

### Exemplos práticos
- **[src/scripts/exemplo-qubic.ts](./src/scripts/exemplo-qubic.ts)** - 6 exemplos completos
- **[src/scripts/test-qubic-wallet.ts](./src/scripts/test-qubic-wallet.ts)** - Testes básicos

## 🔧 Configuração

Crie/edite `.env`:

```env
QUBIC_NETWORK=testnet
QUBIC_RPC_URL=https://testnet-rpc.qubic.org
QUBIC_PLATFORM_SEED=seu-seed-aqui
QUBIC_PLATFORM_ADDRESS=sua-identity-aqui
```

## ✅ Funcionalidades

- ✅ Criar carteiras
- ✅ Importar via seed
- ✅ Consultar saldo
- ✅ Enviar transações
- ✅ Validar identities
- ✅ Converter valores

## 📦 Biblioteca

Usando `@qubic-lib/qubic-ts-library` v0.1.6

## 🎯 Próximos passos

1. Execute `npm run exemplo:qubic`
2. Financie carteira na testnet
3. Teste transação real
4. Integre com API

## 📞 Ajuda

Leia: **[GUIA_RAPIDO_QUBIC.md](./GUIA_RAPIDO_QUBIC.md)**

---

✅ **Status**: Pronto para uso!
