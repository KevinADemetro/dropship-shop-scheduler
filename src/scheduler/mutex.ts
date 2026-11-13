/**
 * Prevents overlapping runs of the same routine when a request exceeds the cron interval.
 */
export class RoutineMutex {
  private readonly locks = new Set<string>();

  tryAcquire(key: string): boolean {
    if (this.locks.has(key)) {
      return false;
    }
    this.locks.add(key);
    return true;
  }

  release(key: string): void {
    this.locks.delete(key);
  }

  isLocked(key: string): boolean {
    return this.locks.has(key);
  }
}
