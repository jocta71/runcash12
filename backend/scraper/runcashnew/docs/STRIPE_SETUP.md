# Configuração do Stripe para RunCash

Este guia explica como configurar as chaves do Stripe para o projeto RunCash.

## 1. Onde devem ficar as chaves do Stripe

As chaves do Stripe devem ser configuradas em dois lugares:

### Backend (Chave Secreta)

A chave secreta (`sk_...`) deve ficar **exclusivamente no backend**, nunca no frontend. Configure-a no arquivo `.env` do backend:

```
# Arquivo: backend/api/.env
STRIPE_SECRET_KEY=sk_test_your_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

### Frontend (Chave Publicável)

A chave publicável (`pk_...`) pode ser usada no frontend. Está configurada no arquivo:

```typescript
// Arquivo: frontend/src/integrations/stripe/client.ts
const STRIPE_PUBLIC_KEY = 'pk_test_your_publishable_key';
```

## 2. Como obter as chaves do Stripe

1. Crie uma conta no [Stripe](https://stripe.com) ou faça login na existente
2. Acesse o [Dashboard > Desenvolvedores > Chaves de API](https://dashboard.stripe.com/apikeys)
3. Use as chaves de teste (`sk_test_` e `pk_test_`) para desenvolvimento
4. Use as chaves de produção (`sk_live_` e `pk_live_`) quando estiver pronto para receber pagamentos reais

## 3. Configurar o Webhook do Stripe

1. Acesse [Dashboard > Desenvolvedores > Webhooks](https://dashboard.stripe.com/webhooks)
2. Adicione um endpoint (ex: `https://sua-api.com/api/webhook`)
3. Selecione os eventos: `checkout.session.completed`, `invoice.payment_succeeded`, `customer.subscription.deleted`
4. Copie a chave de assinatura (Signing Secret) e adicione ao seu `.env`

## 4. Como funciona no ambiente de desenvolvimento vs. produção

### Desenvolvimento

Em desenvolvimento, um cliente simulado é usado quando a API não está disponível. Isso permite testar o fluxo sem uma API real.

### Produção

Para produção:

1. Certifique-se de que seu backend está online e acessível
2. Use as chaves `live` em vez das chaves `test`
3. Configure corretamente os produtos e preços no Stripe
4. Atualize os IDs de preços no seu backend:

```javascript
// Arquivo: backend/api/index.js
const planPriceMap = {
  'free': { priceId: null, amount: 0 },
  'basic': { priceId: 'price_seu_id_basico', amount: 1990 },
  'pro': { priceId: 'price_seu_id_pro', amount: 4990 },
  'premium': { priceId: 'price_seu_id_premium', amount: 9990 },
};
```

## 5. Testes com cartões de crédito

Para testar pagamentos, use os cartões de teste do Stripe:

- **Pagamento bem-sucedido:** 4242 4242 4242 4242
- **Pagamento que requer autenticação:** 4000 0025 0000 3155
- **Pagamento recusado:** 4000 0000 0000 9995

Use uma data futura qualquer e um CVC de 3 dígitos. 