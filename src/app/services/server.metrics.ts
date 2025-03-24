export class ServerMetrics {
  private activeConnections: number = 0;
  private requestsPerMinute: number = 0;
  private lastMinuteRequests: number = 0;
  private peakConnections: number = 0;
  private totalErrors: number = 0;
  private requestCounter: number = 0;

  constructor() {}

  public incrementRequests(): void {
    this.requestCounter++;
    this.lastMinuteRequests++;
  }

  public incrementErrors(): void {
    this.totalErrors++;
  }

  public setActiveConnections(count: number): void {
    this.activeConnections = count;
    this.peakConnections = Math.max(this.peakConnections, count);
  }

  public incrementConnections(): void {
    this.activeConnections++;
    this.peakConnections = Math.max(
      this.peakConnections,
      this.activeConnections
    );
  }

  public decrementConnections(): void {
    this.activeConnections--;
  }

  public updateMinuteMetrics(): void {
    this.requestsPerMinute = this.lastMinuteRequests;
    this.lastMinuteRequests = 0;
  }

  public resetRequestCounter(): void {
    this.requestCounter = 0;
  }

  public getMetrics(): any {
    return {
      activeConnections: this.activeConnections,
      requestsPerMinute: this.requestsPerMinute,
      lastMinuteRequests: this.lastMinuteRequests,
      peakConnections: this.peakConnections,
      totalErrors: this.totalErrors,
      requestCounter: this.requestCounter,
    };
  }
}
