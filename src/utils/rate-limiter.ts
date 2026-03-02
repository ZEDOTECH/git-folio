export class RateLimiter {
  private lastCall = 0;
  private readonly minInterval: number;

  constructor({ requestsPerSecond }: { requestsPerSecond: number }) {
    this.minInterval = 1000 / requestsPerSecond;
  }

  async throttle(): Promise<void> {
    const now = Date.now();
    const wait = Math.max(0, this.lastCall + this.minInterval - now);
    if (wait > 0) {
      await new Promise<void>(r => setTimeout(r, wait));
    }
    this.lastCall = Date.now();
  }
}
