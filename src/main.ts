import { createDropshipScheduler } from './bootstrap';
import { env } from './config/env';
import { scheduleConfig } from './config/schedule';
import { logger } from './logging/logger';

function main(): void {
  if (!env.SCHEDULER_ENABLED) {
    logger.warn('SCHEDULER_ENABLED=false — process will idle without registering cron jobs');
    return;
  }

  const scheduler = createDropshipScheduler();
  scheduler.start();

  logger.info('Dropship shop scheduler is running', {
    timezone: scheduleConfig.timezone,
    deactivateCron: scheduleConfig.routines.deactivate.cron,
    activateCron: scheduleConfig.routines.activate.cron,
    shopID: scheduleConfig.shop.shopID,
    merchantCode: env.MERCHANT_CODE,
  });
}

main();
