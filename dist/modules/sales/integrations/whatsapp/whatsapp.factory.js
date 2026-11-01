import mongoose from 'mongoose';
import { MockWhatsAppDriver } from './mock-whatsapp.driver.js';
import { MetaCloudWhatsAppDriver } from './meta-cloud.driver.js';
import { TwilioWhatsAppDriver } from './twilio-whatsapp.driver.js';
import SalesIntegration from '../../models/sales-integration.model.js';
import { SalesIntegrationService } from '../../services/sales-integration.service.js';
export class WhatsAppProviderFactory {
    static cachedProviders = new Map();
    static integrationService = new SalesIntegrationService();
    /**
     * Clear in-memory driver instance cache (useful on config updates or tests)
     */
    static clearCache() {
        this.cachedProviders.clear();
    }
    /**
     * Get active WhatsApp provider based on database configuration and environment
     */
    static async getActiveProvider() {
        // 1. Force mock mode if explicitly requested or if database is not connected
        if (process.env.SALES_WHATSAPP_DRIVER === 'mock' || mongoose.connection.readyState !== 1) {
            return this.getProvider('mock');
        }
        try {
            // 2. Query enabled WhatsApp integration from database
            const activeIntegration = await SalesIntegration.findOne({
                category: 'whatsapp',
                enabled: true,
                status: { $in: ['valid', 'configured'] },
            }).sort({ updatedAt: -1 });
            if (activeIntegration &&
                ['meta_whatsapp', 'twilio_whatsapp'].includes(activeIntegration.provider)) {
                return this.getProvider(activeIntegration.provider);
            }
        }
        catch {
            // Fallback safely to mock driver
        }
        return this.getProvider('mock');
    }
    /**
     * Instantiate or return cached WhatsApp provider instance
     */
    static async getProvider(providerName, overrideConfig) {
        const cacheKey = overrideConfig
            ? `${providerName}-${JSON.stringify(overrideConfig)}`
            : providerName;
        if (this.cachedProviders.has(cacheKey) && !overrideConfig) {
            return this.cachedProviders.get(cacheKey);
        }
        let publicConfig = overrideConfig?.publicConfig || {};
        let secrets = overrideConfig?.secrets || {};
        // If no overrides provided and not mock, fetch stored settings & decrypt secrets
        if (!overrideConfig && providerName !== 'mock') {
            try {
                const integration = await SalesIntegration.findOne({
                    category: 'whatsapp',
                    provider: providerName,
                });
                if (integration) {
                    publicConfig = integration.publicConfig || {};
                    const decrypted = await this.integrationService.getDecryptedSecrets('whatsapp', providerName);
                    secrets = decrypted || {};
                }
            }
            catch {
                // Fallback to empty if DB query fails
            }
        }
        let driver;
        switch (providerName) {
            case 'meta_whatsapp': {
                driver = new MetaCloudWhatsAppDriver({
                    accessToken: secrets.accessToken || process.env.META_WA_ACCESS_TOKEN || '',
                    phoneNumberId: publicConfig.phoneNumberId || process.env.META_WA_PHONE_NUMBER_ID || '',
                    wabaId: publicConfig.wabaId || process.env.META_WA_WABA_ID,
                    appSecret: secrets.appSecret || process.env.META_APP_SECRET,
                    apiVersion: publicConfig.apiVersion || 'v18.0',
                });
                break;
            }
            case 'twilio_whatsapp': {
                driver = new TwilioWhatsAppDriver({
                    accountSid: secrets.accountSid || process.env.TWILIO_ACCOUNT_SID || '',
                    authToken: secrets.authToken || process.env.TWILIO_AUTH_TOKEN || '',
                    fromPhoneNumber: publicConfig.fromPhoneNumber || process.env.TWILIO_WA_FROM_NUMBER || '+14155238886',
                });
                break;
            }
            case 'mock':
            default: {
                driver = new MockWhatsAppDriver();
                break;
            }
        }
        this.cachedProviders.set(cacheKey, driver);
        return driver;
    }
}
export default WhatsAppProviderFactory;
