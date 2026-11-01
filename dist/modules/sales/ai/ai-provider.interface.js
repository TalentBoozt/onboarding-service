import AppError from "../../../common/errors/app-error.js";
export class ProviderNotConfiguredError extends AppError {
    constructor(providerName, message) {
        super(400, "PROVIDER_NOT_CONFIGURED", message || `AI Provider '${providerName}' is not configured. Missing required API key or credentials.`);
        this.name = "ProviderNotConfiguredError";
    }
}
export class AISchemaValidationError extends AppError {
    constructor(providerName, validationErrors, rawResponse) {
        super(502, "AI_SCHEMA_VALIDATION_FAILED", `AI model output from '${providerName}' failed validation against the requested schema.`, { errors: validationErrors, rawResponse });
        this.name = "AISchemaValidationError";
    }
}
export class AIRateLimitError extends AppError {
    constructor(providerName, retryAfterSeconds) {
        super(429, "AI_RATE_LIMIT_EXCEEDED", `Rate limit exceeded for AI provider '${providerName}'. Please try again later.`, { retryAfterSeconds });
        this.name = "AIRateLimitError";
    }
}
export class AIProviderError extends AppError {
    constructor(providerName, statusCode, message, details) {
        super(statusCode || 500, "AI_PROVIDER_ERROR", `AI Provider '${providerName}' error: ${message}`, details);
        this.name = "AIProviderError";
    }
}
