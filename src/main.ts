import { createDropshipScheduler } from './bootstrap';
import { env } from './config/env';
import { scheduleConfig } from './config/schedule';
import { logger } from './logging/logger';

function main(): void {
  if (!env.SCHEDULER_ENABLED) {
    logger.error(
      'SCHEDULER_ENABLED=false — misconfiguration: refusing to start. Set SCHEDULER_ENABLED=true, or scale the deployment to zero.',
    );
    process.exit(1);
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
