/**
 * NoOpEventBus — default implementation that discards all events.
 * Replace with a real implementation when needed.
 */
export class NoOpEventBus {
    publish(_event) {
        // No-op
    }
    subscribe(_type, _handler) {
        // No-op
    }
    unsubscribe(_type, _handler) {
        // No-op
    }
}
