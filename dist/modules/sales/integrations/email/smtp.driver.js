import nodemailer from 'nodemailer';
export class SmtpEmailDriver {
    providerName = 'smtp';
    config;
    transporter;
    defaultFrom;
    defaultFromName;
    constructor(config) {
        this.config = config;
        this.defaultFrom = config.defaultFrom || config.auth?.user || 'noreply@talnova.com';
        this.defaultFromName = config.defaultFromName || 'Talnova';
        this.transporter = nodemailer.createTransport({
            host: config.host,
            port: config.port,
            secure: config.secure ?? (config.port === 465),
            auth: config.auth?.user && config.auth?.pass ? {
                user: config.auth.user,
                pass: config.auth.pass,
            } : undefined,
            tls: config.tls || { rejectUnauthorized: false },
            pool: config.pool ?? true,
            maxConnections: config.maxConnections || 5,
            maxMessages: config.maxMessages || 100,
        });
    }
    /**
     * Helper to format recipient into email or "Name <email>"
     */
    formatRecipient(recipient) {
        if (typeof recipient === 'string')
            return recipient;
        if (recipient.name)
            return `"${recipient.name}" <${recipient.email}>`;
        return recipient.email;
    }
    normalizeRecipients(recipients) {
        if (!recipients)
            return undefined;
        if (Array.isArray(recipients)) {
            return recipients.map((r) => this.formatRecipient(r));
        }
        return [this.formatRecipient(recipients)];
    }
    /**
     * Send email using SMTP
     */
    async sendMail(payload) {
        const timestamp = new Date().toISOString();
        try {
            const fromEmail = payload.from || this.defaultFrom;
            const fromName = payload.fromName || this.defaultFromName;
            const from = fromName ? `"${fromName}" <${fromEmail}>` : fromEmail;
            const to = this.normalizeRecipients(payload.to);
            if (!to || to.length === 0) {
                throw new Error('At least one recipient ("to") must be specified');
            }
            const cc = this.normalizeRecipients(payload.cc);
            const bcc = this.normalizeRecipients(payload.bcc);
            const attachments = payload.attachments?.map((att) => ({
                filename: att.filename,
                content: att.content,
                contentType: att.contentType,
                path: att.path,
                cid: att.cid,
            }));
            // Extra headers for tracking
            const headers = {
                ...(payload.headers || {}),
            };
            if (payload.campaignId)
                headers['X-Talnova-Campaign-ID'] = payload.campaignId;
            if (payload.leadId)
                headers['X-Talnova-Lead-ID'] = payload.leadId;
            if (payload.contactId)
                headers['X-Talnova-Contact-ID'] = payload.contactId;
            const mailOptions = {
                from,
                to: to.join(', '),
                cc: cc ? cc.join(', ') : undefined,
                bcc: bcc ? bcc.join(', ') : undefined,
                replyTo: payload.replyTo,
                subject: payload.subject,
                text: payload.text,
                html: payload.html,
                attachments,
                headers,
            };
            const info = await this.transporter.sendMail(mailOptions);
            return {
                success: true,
                messageId: info.messageId || `smtp-${Date.now()}`,
                provider: 'smtp',
                status: 'sent',
                timestamp,
                rawResponse: {
                    response: info.response,
                    accepted: info.accepted,
                    rejected: info.rejected,
                    messageId: info.messageId,
                },
            };
        }
        catch (err) {
            return {
                success: false,
                messageId: '',
                provider: 'smtp',
                status: 'failed',
                timestamp,
                error: err.message || 'SMTP send failure',
            };
        }
    }
    /**
     * Verify SMTP credentials and host connectivity
     */
    async testConnection() {
        const validatedAt = new Date().toISOString();
        try {
            await this.transporter.verify();
            return {
                success: true,
                message: `Connected successfully to SMTP server at ${this.config.host}:${this.config.port}`,
                details: {
                    host: this.config.host,
                    port: this.config.port,
                    secure: this.config.secure ?? (this.config.port === 465),
                    authenticatedUser: this.config.auth?.user || 'Anonymous',
                },
                validatedAt,
            };
        }
        catch (err) {
            return {
                success: false,
                message: `SMTP connection failed: ${err.message}`,
                details: {
                    host: this.config.host,
                    port: this.config.port,
                    code: err.code,
                },
                validatedAt,
            };
        }
    }
    /**
     * Validate webhook request for SMTP (token/header check if applicable)
     */
    async validateWebhook(headers, body) {
        // Custom SMTP setups can provide a shared secret in header
        const tokenHeader = headers['x-webhook-token'] || headers['x-talnova-secret'];
        if (typeof tokenHeader === 'string' && tokenHeader.length > 0) {
            return true;
        }
        return !!body;
    }
}
