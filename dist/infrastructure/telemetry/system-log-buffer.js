export class SystemLogBuffer {
    static CAPACITY = 1000;
    static buffer = new Array(SystemLogBuffer.CAPACITY).fill(null);
    static head = 0;
    static count = 0;
    /**
     * Record a runtime system log entry into the circular ring buffer.
     */
    static record(entry) {
        const now = Date.now();
        const level = entry.level || "info";
        const msg = entry.description || entry.message || `System event ${entry.eventType}`;
        const item = {
            id: `sys-${now}-${Math.random().toString(36).substring(2, 7)}`,
            timestamp: now,
            level,
            severity: level,
            source: entry.source || "server",
            eventType: entry.eventType || "SYSTEM_EVENT",
            action: entry.action || (entry.eventType ? entry.eventType.toLowerCase() : "log"),
            message: msg,
            description: msg,
            organizationId: entry.organizationId,
            metadata: entry.metadata,
            createdAt: new Date(now).toISOString(),
        };
        SystemLogBuffer.buffer[SystemLogBuffer.head] = item;
        SystemLogBuffer.head = (SystemLogBuffer.head + 1) % SystemLogBuffer.CAPACITY;
        if (SystemLogBuffer.count < SystemLogBuffer.CAPACITY) {
            SystemLogBuffer.count++;
        }
    }
    /**
     * Retrieve recent system log records with optional filtering.
     */
    static getLogs(filterOrLimit, maybeFilter) {
        let limit = 50;
        let organizationId;
        let severity;
        let source;
        if (typeof filterOrLimit === "number") {
            limit = filterOrLimit;
            organizationId = maybeFilter?.organizationId;
            severity = maybeFilter?.severity;
            source = maybeFilter?.source;
        }
        else if (filterOrLimit && typeof filterOrLimit === "object") {
            limit = filterOrLimit.limit || 50;
            organizationId = filterOrLimit.organizationId;
            severity = filterOrLimit.severity;
            source = filterOrLimit.source;
        }
        limit = Math.min(100, Math.max(1, limit));
        const results = [];
        // Traverse from newest to oldest
        for (let i = 0; i < SystemLogBuffer.count; i++) {
            const idx = (SystemLogBuffer.head - 1 - i + SystemLogBuffer.CAPACITY) % SystemLogBuffer.CAPACITY;
            const item = SystemLogBuffer.buffer[idx];
            if (!item)
                continue;
            if (organizationId && organizationId !== "all" && item.organizationId !== organizationId) {
                continue;
            }
            if (severity && severity !== "all" && item.severity !== severity) {
                continue;
            }
            if (source && source !== "all" && item.source !== source) {
                continue;
            }
            results.push(item);
            if (results.length >= limit)
                break;
        }
        return results;
    }
    /**
     * Clear the ring buffer (useful in test teardown).
     */
    static clear() {
        SystemLogBuffer.buffer = new Array(SystemLogBuffer.CAPACITY).fill(null);
        SystemLogBuffer.head = 0;
        SystemLogBuffer.count = 0;
    }
    static getCount() {
        return SystemLogBuffer.count;
    }
}
export default SystemLogBuffer;
