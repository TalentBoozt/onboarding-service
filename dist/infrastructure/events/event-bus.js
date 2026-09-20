import crypto from "crypto";
export class EventBus {
    static instance;
    handlers = new Map();
    constructor() {
        // Singleton
    }
    static getInstance() {
        if (!EventBus.instance) {
            EventBus.instance = new EventBus();
        }
        return EventBus.instance;
    }
    subscribe(eventType, handler) {
        if (!this.handlers.has(eventType)) {
            this.handlers.set(eventType, new Set());
        }
        this.handlers.get(eventType).add(handler);
        return () => {
            const set = this.handlers.get(eventType);
            if (set) {
                set.delete(handler);
            }
        };
    }
    async publish(firstArg, secondArg) {
        const params = typeof firstArg === "string"
            ? { eventName: firstArg, ...secondArg }
            : firstArg;
        const envelope = {
            eventId: crypto.randomUUID(),
            eventName: params.eventName,
            eventVersion: "1.0.0",
            occurredAt: new Date(),
            organizationId: params.organizationId,
            actorId: params.actorId,
            entityId: params.entityId,
            payload: params.payload,
            correlationId: params.correlationId || crypto.randomUUID(),
        };
        const subscribers = this.handlers.get(params.eventName);
        if (subscribers && subscribers.size > 0) {
            let firstError = null;
            const promises = Array.from(subscribers).map(async (handler) => {
                try {
                    await handler(envelope);
                }
                catch (error) {
                    console.error(`[EventBus] Error handling event ${params.eventName} (${envelope.eventId}):`, error);
                    if (!firstError)
                        firstError = error;
                }
            });
            await Promise.allSettled(promises);
            if (firstError) {
                throw firstError;
            }
        }
        return envelope;
    }
    clearSubscribers() {
        this.handlers.clear();
    }
}
export const eventBus = EventBus.getInstance();
export default eventBus;
