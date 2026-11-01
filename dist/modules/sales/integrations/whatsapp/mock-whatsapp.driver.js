import { normalizeToE164, } from './whatsapp-provider.interface.js';
export const PRE_APPROVED_MOCK_TEMPLATES = [
    {
        name: 'welcome_onboarding',
        language: 'en_US',
        status: 'APPROVED',
        category: 'UTILITY',
        components: [
            {
                type: 'BODY',
                text: 'Welcome to Talnova! We are excited to partner with you.',
            },
        ],
    },
    {
        name: 'demo_followup',
        language: 'en_US',
        status: 'APPROVED',
        category: 'MARKETING',
        components: [
            {
                type: 'BODY',
                text: 'Thank you for attending the enterprise demo. Here are the review materials.',
            },
        ],
    },
    {
        name: 'payment_reminder',
        language: 'en_US',
        status: 'APPROVED',
        category: 'UTILITY',
        components: [
            {
                type: 'BODY',
                text: 'Your enterprise subscription payment is scheduled for processing.',
            },
        ],
    },
    {
        name: 'lead_reactivation',
        language: 'en_US',
        status: 'APPROVED',
        category: 'MARKETING',
        components: [
            {
                type: 'BODY',
                text: 'We noticed your team paused exploration. Would you like a fresh roadmap update?',
            },
        ],
    },
];
export class MockWhatsAppDriver {
    providerName = 'mock';
    static sentMessages = [];
    shouldFailNext = false;
    failMessage = 'Simulated WhatsApp dispatch failure';
    rateLimitRemaining = 1000;
    approvedTemplates = [...PRE_APPROVED_MOCK_TEMPLATES];
    /**
     * Send template message via mock provider
     */
    async sendTemplateMessage(payload) {
        const timestamp = new Date().toISOString();
        // 1. Strict E.164 normalization
        let normalizedRecipient;
        try {
            normalizedRecipient = normalizeToE164(payload.to);
        }
        catch (err) {
            return {
                success: false,
                messageId: '',
                provider: 'mock',
                status: 'failed',
                recipient: payload.to,
                timestamp,
                error: err.message,
            };
        }
        // 2. Validate template approval
        const templateExists = this.approvedTemplates.some((t) => t.name === payload.templateName && t.status === 'APPROVED');
        if (!templateExists) {
            return {
                success: false,
                messageId: '',
                provider: 'mock',
                status: 'failed',
                recipient: normalizedRecipient,
                timestamp,
                error: `Template "${payload.templateName}" is not pre-approved or registered with WhatsApp Business`,
            };
        }
        // 3. Failure & rate limit simulations
        if (this.shouldFailNext) {
            this.shouldFailNext = false;
            return {
                success: false,
                messageId: '',
                provider: 'mock',
                status: 'failed',
                recipient: normalizedRecipient,
                timestamp,
                error: this.failMessage,
            };
        }
        if (this.rateLimitRemaining <= 0) {
            return {
                success: false,
                messageId: '',
                provider: 'mock',
                status: 'failed',
                recipient: normalizedRecipient,
                timestamp,
                error: 'WhatsApp Cloud API rate limit exceeded: Tier limit reached (429)',
            };
        }
        this.rateLimitRemaining -= 1;
        const messageId = `wamid.mock_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
        const result = {
            success: true,
            messageId,
            provider: 'mock',
            status: 'sent',
            recipient: normalizedRecipient,
            timestamp,
            rawResponse: {
                messaging_product: 'whatsapp',
                contacts: [{ input: payload.to, wa_id: normalizedRecipient.replace('+', '') }],
                messages: [{ id: messageId, message_status: 'accepted' }],
            },
        };
        MockWhatsAppDriver.sentMessages.push({
            payload: { ...payload, to: normalizedRecipient },
            result,
            sentAt: new Date(),
        });
        return result;
    }
    /**
     * Send text message (session-based)
     */
    async sendTextMessage(to, message) {
        const timestamp = new Date().toISOString();
        const normalizedRecipient = normalizeToE164(to);
        const messageId = `wamid.mock_txt_${Date.now()}`;
        const result = {
            success: true,
            messageId,
            provider: 'mock',
            status: 'sent',
            recipient: normalizedRecipient,
            timestamp,
            rawResponse: { message },
        };
        MockWhatsAppDriver.sentMessages.push({
            payload: { to: normalizedRecipient, templateName: 'text_session' },
            result,
            sentAt: new Date(),
        });
        return result;
    }
    /**
     * Return synced approved templates
     */
    async syncApprovedTemplates() {
        return [...this.approvedTemplates];
    }
    /**
     * Test connection
     */
    async testConnection() {
        return {
            success: true,
            message: 'Mock WhatsApp Cloud provider is active and ready for local development.',
            details: {
                driver: 'mock',
                approvedTemplatesCount: this.approvedTemplates.length,
                sentMessagesCount: MockWhatsAppDriver.sentMessages.length,
            },
            validatedAt: new Date().toISOString(),
        };
    }
    /**
     * Validate webhook
     */
    validateWebhook(_signature, payload) {
        return !!payload && typeof payload === 'object';
    }
    // --- Testing & Debugging Utility Helpers ---
    static getSentMessages() {
        return [...MockWhatsAppDriver.sentMessages];
    }
    static getLastSentMessage() {
        return MockWhatsAppDriver.sentMessages[MockWhatsAppDriver.sentMessages.length - 1];
    }
    static clearSentMessages() {
        MockWhatsAppDriver.sentMessages = [];
    }
    simulateNextSendFailure(message = 'Simulated WhatsApp provider error') {
        this.shouldFailNext = true;
        this.failMessage = message;
    }
    setRateLimitRemaining(remaining) {
        this.rateLimitRemaining = remaining;
    }
    addApprovedTemplate(template) {
        this.approvedTemplates.push(template);
    }
}
