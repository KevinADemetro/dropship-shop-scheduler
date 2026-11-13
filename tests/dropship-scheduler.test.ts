import { DropshipScheduler, resetSchedulerStartedFlagForTests } from '../src/scheduler/dropship-scheduler';
import { RoutineMutex } from '../src/scheduler/mutex';
import { ToggleDropshipService } from '../src/services/toggle-dropship.service';
import { scheduleConfig } from '../src/config/schedule';

describe('DropshipScheduler', () => {
  beforeEach(() => {
    resetSchedulerStartedFlagForTests();
  });

  it('registers both cron jobs once with the configured timezone', () => {
    const schedule = jest.fn().mockReturnValue({ stop: jest.fn() });
    const validate = jest.fn().mockReturnValue(true);
    const service = { run: jest.fn() } as unknown as ToggleDropshipService;

    const scheduler = new DropshipScheduler({
      service,
      cronSchedule: schedule as never,
      validate: validate as never,
    });

    scheduler.start();
    scheduler.start();

    expect(validate).toHaveBeenCalledWith(scheduleConfig.routines.deactivate.cron);
    expect(validate).toHaveBeenCalledWith(scheduleConfig.routines.activate.cron);
    expect(schedule).toHaveBeenCalledTimes(2);
    expect(schedule).toHaveBeenCalledWith(
      scheduleConfig.routines.deactivate.cron,
      expect.any(Function),
      { timezone: 'America/Sao_Paulo' },
    );
    expect(schedule).toHaveBeenCalledWith(
      scheduleConfig.routines.activate.cron,
      expect.any(Function),
      { timezone: 'America/Sao_Paulo' },
    );
  });

  it('blocks concurrent runs of the same routine', async () => {
    let resolveRun!: () => void;
    const runPromise = new Promise<void>((resolve) => {
      resolveRun = resolve;
    });

    const service = {
      run: jest.fn().mockReturnValue(runPromise),
    } as unknown as ToggleDropshipService;

    const mutex = new RoutineMutex();
    const scheduler = new DropshipScheduler({ service, mutex });

    const first = scheduler.runRoutine('deactivate');
    const second = scheduler.runRoutine('deactivate');

    await second;
    expect(service.run).toHaveBeenCalledTimes(1);

    resolveRun();
    await first;
  });

  it('keeps scheduling after a routine error', async () => {
    const service = {
      run: jest
        .fn()
        .mockRejectedValueOnce(new Error('transient'))
        .mockResolvedValueOnce({
          routine: 'activate',
          isActive: true,
          executedAt: new Date().toISOString(),
          loginSucceeded: true,
          updateSucceeded: true,
        }),
    } as unknown as ToggleDropshipService;

    const scheduler = new DropshipScheduler({ service });

    await scheduler.runRoutine('activate');
    await scheduler.runRoutine('activate');

    expect(service.run).toHaveBeenCalledTimes(2);
  });
});
