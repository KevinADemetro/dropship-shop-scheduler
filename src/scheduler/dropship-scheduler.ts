import cron, { ScheduledTask } from 'node-cron';
import { DropshipRoutineName, scheduleConfig } from '../config/schedule';
import { logger } from '../logging/logger';
import { ToggleDropshipService } from '../services/toggle-dropship.service';
import { RoutineMutex } from './mutex';

export interface DropshipSchedulerOptions {
  service: ToggleDropshipService;
  mutex?: RoutineMutex;
  cronSchedule?: typeof cron.schedule;
  validate?: typeof cron.validate;
}

let started = false;

/**
 * Registers both daily cron jobs once. Errors in one run never stop future ticks.
 */
export class DropshipScheduler {
  private readonly tasks: ScheduledTask[] = [];
  private readonly mutex: RoutineMutex;
  private readonly cronSchedule: typeof cron.schedule;
  private readonly validate: typeof cron.validate;

  constructor(private readonly options: DropshipSchedulerOptions) {
    this.mutex = options.mutex ?? new RoutineMutex();
    this.cronSchedule = options.cronSchedule ?? cron.schedule;
    this.validate = options.validate ?? cron.validate;
  }

  start(): void {
    if (started) {
      logger.warn('Dropship scheduler already started — skipping re-initialization');
      return;
    }

    for (const routine of Object.keys(scheduleConfig.routines) as DropshipRoutineName[]) {
      const { cron: expression, description } = scheduleConfig.routines[routine];

      if (!this.validate(expression)) {
        throw new Error(`Invalid cron expression for ${routine}: ${expression}`);
      }

      const task = this.cronSchedule(
        expression,
        () => {
          void this.runRoutine(routine);
        },
        { timezone: scheduleConfig.timezone },
      );

      this.tasks.push(task);
      logger.info('Dropship cron registered', {
        routine,
        cron: expression,
        timezone: scheduleConfig.timezone,
        description,
      });
    }

    started = true;
  }

  stop(): void {
    for (const task of this.tasks) {
      task.stop();
    }
    this.tasks.length = 0;
    started = false;
  }

  /** Exposed for tests / manual orchestration with the same locking rules as cron. */
  async runRoutine(routine: DropshipRoutineName): Promise<void> {
    if (!this.mutex.tryAcquire(routine)) {
      logger.warn('Dropship routine skipped — previous run still in progress', { routine });
      return;
    }

    try {
      await this.options.service.run(routine);
    } catch (error) {
      logger.error('Dropship routine finished with error (scheduler continues)', {
        routine,
        errorMessage: error instanceof Error ? error.message : String(error),
      });
    } finally {
      this.mutex.release(routine);
    }
  }
}

/** Test helper — resets the module-level once-guard. */
export function resetSchedulerStartedFlagForTests(): void {
  started = false;
}
