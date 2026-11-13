/**
 * Central schedule / route / payload configuration.
 *
 * Cron expressions and timezone come from env (`DEACTIVATE_CRON`, `ACTIVATE_CRON`,
 * `SCHEDULE_TIMEZONE`). Paths, shop identity and payloads stay here.
 * Credentials live in `env.ts` / `.env` — never hardcode secrets in this file.
 *
 * Field names match the real merchants-api contract (`isActive`), not a fictional `active`.
 */

import { env } from './env';

export type DropshipRoutineName = 'deactivate' | 'activate';

export interface ShopIdentity {
  tenantName: string;
  shopID: string;
}

export interface ScheduleConfig {
  timezone: string;
  routines: Record<
    DropshipRoutineName,
    {
      /** node-cron expression (server timezone overridden by `timezone`). */
      cron: string;
      /** Value sent as `isActive` on PATCH merchants/order-split/shops. */
      isActive: boolean;
      description: string;
    }
  >;
  routes: {
    login: string;
    updateShop: string;
  };
  shop: ShopIdentity;
}

export const scheduleConfig: ScheduleConfig = {
  timezone: env.SCHEDULE_TIMEZONE,
  routines: {
    deactivate: {
      cron: env.DEACTIVATE_CRON,
      isActive: false,
      description: `Deactivate Dropship (${env.DEACTIVATE_CRON} ${env.SCHEDULE_TIMEZONE})`,
    },
    activate: {
      cron: env.ACTIVATE_CRON,
      isActive: true,
      description: `Activate Dropship (${env.ACTIVATE_CRON} ${env.SCHEDULE_TIMEZONE})`,
    },
  },
  routes: {
    /** auth-service: POST /auth/login (via Kong as `auth/login`). */
    login: '/auth/login',
    /** merchants-api: PATCH /order-split/shops (via Kong as `merchants/order-split/shops`). */
    updateShop: '/merchants/order-split/shops',
  },
  shop: {
    tenantName: 'Dropship',
    shopID: 'dropship',
  },
};

export function buildUpdateShopPayload(params: {
  merchantCode: string;
  isActive: boolean;
  shop?: ShopIdentity;
}): { shops: Array<{ merchantCode: string; tenantName: string; shopID: string; isActive: boolean }> } {
  const shop = params.shop ?? scheduleConfig.shop;

  return {
    shops: [
      {
        merchantCode: params.merchantCode,
        tenantName: shop.tenantName,
        shopID: shop.shopID,
        isActive: params.isActive,
      },
    ],
  };
}
