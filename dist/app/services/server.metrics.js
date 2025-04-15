"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerMetrics = void 0;
class ServerMetrics {
    constructor() {
        this.activeConnections = 0;
        this.requestsPerMinute = 0;
        this.lastMinuteRequests = 0;
        this.peakConnections = 0;
        this.totalErrors = 0;
        this.requestCounter = 0;
    }
    incrementRequests() {
        this.requestCounter++;
        this.lastMinuteRequests++;
    }
    incrementErrors() {
        this.totalErrors++;
    }
    setActiveConnections(count) {
        this.activeConnections = count;
        this.peakConnections = Math.max(this.peakConnections, count);
    }
    incrementConnections() {
        this.activeConnections++;
        this.peakConnections = Math.max(this.peakConnections, this.activeConnections);
    }
    decrementConnections() {
        this.activeConnections--;
    }
    updateMinuteMetrics() {
        this.requestsPerMinute = this.lastMinuteRequests;
        this.lastMinuteRequests = 0;
    }
    resetRequestCounter() {
        this.requestCounter = 0;
    }
    getMetrics() {
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
exports.ServerMetrics = ServerMetrics;
