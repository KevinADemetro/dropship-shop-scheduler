import { env } from '../src/config/env';
import { buildUpdateShopPayload, scheduleConfig } from '../src/config/schedule';

describe('scheduleConfig', () => {
  it('uses SCHEDULE_TIMEZONE and cron expressions from env', () => {
    expect(scheduleConfig.timezone).toBe(env.SCHEDULE_TIMEZONE);
    expect(scheduleConfig.routines.deactivate.cron).toBe(env.DEACTIVATE_CRON);
    expect(scheduleConfig.routines.activate.cron).toBe(env.ACTIVATE_CRON);
  });

  it('targets Dropship with isActive false on deactivate and true on activate', () => {
    expect(scheduleConfig.shop).toEqual({ tenantName: 'Dropship', shopID: 'dropship' });
    expect(scheduleConfig.routines.deactivate.isActive).toBe(false);
    expect(scheduleConfig.routines.activate.isActive).toBe(true);
  });

  it('points to the existing login and order-split update routes', () => {
    expect(scheduleConfig.routes.login).toBe('/auth/login');
    expect(scheduleConfig.routes.updateShop).toBe('/merchants/order-split/shops');
  });

  it('builds the merchants-api PATCH payload with isActive', () => {
    expect(buildUpdateShopPayload({ merchantCode: 'Incycle', isActive: false })).toEqual({
      shops: [
        {
          merchantCode: 'Incycle',
          tenantName: 'Dropship',
          shopID: 'dropship',
          isActive: false,
        },
      ],
    });

    expect(buildUpdateShopPayload({ merchantCode: 'Incycle', isActive: true })).toEqual({
      shops: [
        {
          merchantCode: 'Incycle',
          tenantName: 'Dropship',
          shopID: 'dropship',
          isActive: true,
        },
      ],
    });
  });
});
