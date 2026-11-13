import { createToggleDropshipService } from './bootstrap';
import { DropshipRoutineName } from './config/schedule';
import { logger } from './logging/logger';

const USAGE = `Usage: yarn cli <deactivate|activate>

Manual development runners (do not change production cron behaviour):
  yarn run:deactivate   # login + PATCH isActive=false
  yarn run:activate     # login + PATCH isActive=true
`;

async function main(): Promise<void> {
  const routine = process.argv[2] as DropshipRoutineName | undefined;

  if (routine !== 'deactivate' && routine !== 'activate') {
    console.error(USAGE);
    process.exitCode = 1;
    return;
  }

  const service = createToggleDropshipService();

  try {
    const result = await service.run(routine);
    logger.info('Manual Dropship routine completed', result as unknown as Record<string, unknown>);
  } catch (error) {
    logger.error('Manual Dropship routine failed', {
      routine,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    process.exitCode = 1;
  }
}

void main();
