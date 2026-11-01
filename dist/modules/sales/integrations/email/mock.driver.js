export class MockEmailDriver {
    providerName = 'mock';
    static sentEmails = [];
    shouldFailNext = false;
    failMessage = 'Simulated email provider failure';
    rateLimitRemaining = 1000;
    defaultFrom;
    defaultFromName;
    constructor(config) {
        this.defaultFrom = config?.defaultFrom || 'sales@talnova.com';
        this.defaultFromName = config?.defaultFromName || 'Talnova Sales';
    }
    /**
     * Send mail implementation for mock driver
     */
    async sendMail(payload) {
        if (this.shouldFailNext) {
            this.shouldFailNext = false;
            return {
                success: false,
                messageId: '',
                provider: 'mock',
                status: 'failed',
                timestamp: new Date().toISOString(),
                error: this.failMessage,
            };
        }
        if (this.rateLimitRemaining <= 0) {
            return {
                success: false,
                messageId: '',
                provider: 'mock',
                status: 'failed',
                timestamp: new Date().toISOString(),
                error: 'Rate limit exceeded: 429 Too Many Requests',
            };
        }
        this.rateLimitRemaining -= 1;
        const messageId = `mock-${Date.now()}-${Math.random().toString(36).slice(2, 9)}@talnova.internal`;
        const fromAddress = payload.from || this.defaultFrom;
        const fromName = payload.fromName || this.defaultFromName;
        const result = {
            success: true,
            messageId,
            provider: 'mock',
            status: 'sent',
            timestamp: new Date().toISOString(),
            rawResponse: {
                envelope: {
                    from: `${fromName} <${fromAddress}>`,
                    to: Array.isArray(payload.to) ? payload.to : [payload.to],
                },
                messageId,
            },
        };
        MockEmailDriver.sentEmails.push({
            payload,
            result,
            sentAt: new Date(),
        });
        return result;
    }
    /**
     * Validate mock connection
     */
    async testConnection() {
        return {
            success: true,
            message: 'Mock email provider is ready and connected for local execution.',
            details: {
                driver: 'mock',
                totalSentCount: MockEmailDriver.sentEmails.length,
                defaultFrom: this.defaultFrom,
            },
            validatedAt: new Date().toISOString(),
        };
    }
    /**
     * Validate incoming webhook
     */
    async validateWebhook(headers, body) {
        // In mock mode, if body is provided and valid object, accept
        return !!body && typeof body === 'object';
    }
    // --- Testing & Debugging Utility Helpers ---
    static getSentEmails() {
        return [...MockEmailDriver.sentEmails];
    }
    static getLastSentEmail() {
        return MockEmailDriver.sentEmails[MockEmailDriver.sentEmails.length - 1];
    }
    static clearSentEmails() {
        MockEmailDriver.sentEmails = [];
    }
    simulateNextSendFailure(message = 'Simulated provider error') {
        this.shouldFailNext = true;
        this.failMessage = message;
    }
    setRateLimitRemaining(remaining) {
        this.rateLimitRemaining = remaining;
    }
}
