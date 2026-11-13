# Dropship Shop Scheduler

Automação Node.js com `node-cron` que, duas vezes ao dia, autentica via a rota existente de login e atualiza o status `isActive` da Shop **Dropship** no Fulfillment Priority (merchants-api).

| Horário (`America/Los_Angeles`) | Ação |
| --- | --- |
| `0 18 * * *` (18:00) | Login → `PATCH` com `isActive: false` |
| `0 23 * * *` (23:00) | Novo login → `PATCH` com `isActive: true` |

## Rotas reutilizadas (sem endpoints novos)

| Passo | Rota real | Origem |
| --- | --- | --- |
| Login | `POST /auth/login` | auth-service / Kong (`auth/login` no web) |
| Update | `PATCH /merchants/order-split/shops` | merchants-api (`merchants/order-split/shops` no web) |

Payload de update (contrato real da merchants-api — campo `isActive`, não `active`):

```json
{
  "shops": [
    {
      "merchantCode": "Incycle",
      "tenantName": "Dropship",
      "shopID": "dropship",
      "isActive": false
    }
  ]
}
```

## Setup

```bash
cd dropship-shop-scheduler
cp .env.example .env
# edite API_BASE_URL, AUTH_EMAIL, AUTH_PASSWORD, MERCHANT_CODE
yarn install
```

## Onde configurar

| O quê | Onde |
| --- | --- |
| Horários cron + timezone | `.env` → `DEACTIVATE_CRON`, `ACTIVATE_CRON`, `SCHEDULE_TIMEZONE` |
| Rotas de login / update | `src/config/schedule.ts` → `routes` |
| Shop (`dropship` / `Dropship`) | `src/config/schedule.ts` → `shop` |
| Payloads `isActive` | `src/config/schedule.ts` → `routines.*.isActive` |
| Credenciais e `API_BASE_URL` | `.env` (schema em `src/config/env.ts`) |
| `MERCHANT_CODE` | `.env` |

## Como a automação inicia

```bash
yarn dev          # ts-node src/main.ts — registra os crons uma vez e fica em execução
yarn build && yarn start
```

`src/main.ts` chama `createDropshipScheduler().start()`. Um guard de módulo impede registro duplo dos crons.

## Execução manual (dev)

Não altera o comportamento do agendamento em produção:

```bash
yarn run:deactivate   # login + isActive=false
yarn run:activate     # login + isActive=true
# ou
yarn cli deactivate
yarn cli activate
```

## Testes

```bash
yarn test
yarn typecheck
```

## Comportamento de resiliência

- Login sempre imediato antes do PATCH; token da rotina anterior nunca é reutilizado.
- Se o login falhar, o update **não** é chamado.
- Erro em uma execução é logado; o cron continua nas próximas.
- Mutex por rotina evita overlap se a request demorar mais que o intervalo.
