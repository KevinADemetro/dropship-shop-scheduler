import { buildUpdateShopPayload, scheduleConfig } from '../src/config/schedule';

describe('scheduleConfig', () => {
  it('uses America/Sao_Paulo and the expected daily cron expressions', () => {
    expect(scheduleConfig.timezone).toBe('America/Sao_Paulo');
    expect(scheduleConfig.routines.deactivate.cron).toBe('0 9 * * *');
    expect(scheduleConfig.routines.activate.cron).toBe('0 15 * * *');
  });

  it('targets Dropship with isActive false at 09:00 and true at 15:00', () => {
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
