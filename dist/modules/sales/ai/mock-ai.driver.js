import { AISchemaValidationError, } from "./ai-provider.interface.js";
export class MockAISalesDriver {
    providerName = "mock";
    defaultModel = "mock-model";
    responseQueue = [];
    callHistory = [];
    customHandler;
    simulatedError = null;
    connectionResult = {
        success: true,
        message: "Mock AI provider connection verified.",
        latencyMs: 12,
    };
    /**
     * Enqueue a deterministic response object
     */
    enqueueResponse(response) {
        this.responseQueue.push(response);
        return this;
    }
    /**
     * Enqueue multiple responses
     */
    enqueueResponses(responses) {
        this.responseQueue.push(...responses);
        return this;
    }
    /**
     * Set dynamic response generator callback
     */
    setCustomHandler(handler) {
        this.customHandler = handler;
        return this;
    }
    /**
     * Set simulated error for next call(s)
     */
    setSimulatedError(error) {
        this.simulatedError = error;
        return this;
    }
    /**
     * Override connection test status
     */
    setConnectionStatus(status) {
        this.connectionResult = status;
        return this;
    }
    /**
     * Retrieve all recorded invocations
     */
    getCallHistory() {
        return [...this.callHistory];
    }
    /**
     * Reset mock state (queue, history, errors)
     */
    reset() {
        this.responseQueue = [];
        this.callHistory = [];
        this.customHandler = undefined;
        this.simulatedError = null;
        this.connectionResult = {
            success: true,
            message: "Mock AI provider connection verified.",
            latencyMs: 12,
        };
    }
    /**
     * Generates a structured response strictly parsed and validated against a Zod schema
     */
    async generateStructuredResponse(prompt, schema, systemContext, options) {
        this.callHistory.push({
            prompt,
            systemContext,
            options,
            timestamp: new Date(),
        });
        if (this.simulatedError) {
            const err = this.simulatedError;
            throw err;
        }
        let rawData;
        if (this.customHandler) {
            rawData = await this.customHandler(prompt, schema, systemContext, options);
        }
        else if (this.responseQueue.length > 0) {
            rawData = this.responseQueue.shift();
        }
        else {
            // Default fallback mock response
            rawData = {
                summary: `Mock AI summary for: ${prompt.slice(0, 30)}...`,
                recommendations: ["Follow up in 24 hours", "Confirm budget authority"],
                riskLevel: "medium",
                score: 75,
                status: "ok",
            };
        }
        // Validate strictly against provided schema
        const validationResult = schema.safeParse(rawData);
        if (!validationResult.success) {
            throw new AISchemaValidationError(this.providerName, validationResult.error.errors, JSON.stringify(rawData));
        }
        return validationResult.data;
    }
    /**
     * Generates a freeform natural language response for sales chat assistance
     */
    async generateChatResponse(prompt, systemContext, options) {
        this.callHistory.push({
            prompt,
            systemContext,
            options,
            timestamp: new Date(),
        });
        if (this.simulatedError) {
            throw this.simulatedError;
        }
        if (this.responseQueue.length > 0) {
            const dequeued = this.responseQueue.shift();
            if (typeof dequeued === "string")
                return dequeued;
            if (dequeued && dequeued.reply)
                return dequeued.reply;
            return JSON.stringify(dequeued);
        }
        const lower = prompt.toLowerCase();
        if (lower.includes("progress") || lower.includes("stuck") || lower.includes("risk")) {
            return "Based on live pipeline telemetry, 3 key deals show extended duration in their current stage. Primary risk factors include decision-maker inertia and pricing objections. Recommended action: deploy the executive rescue playbook and schedule a value-assurance review.";
        }
        if (lower.includes("healthcare") || lower.includes("industry") || lower.includes("lead")) {
            return "Analyzing active leads: We have high-scoring leads in the pipeline demonstrating strong digital engagement. For optimal conversion, reach out within 24 hours to schedule personalized solution demonstrations.";
        }
        if (lower.includes("pipeline") || lower.includes("metric") || lower.includes("value")) {
            return "Live Sales Intelligence Summary: Current pipeline velocity is steady. Focusing on the top 2 at-risk enterprise deals in Negotiation could protect crucial projected ARR for the quarter.";
        }
        return "Live Sales AI Assistant: I've analyzed your current CRM records. Overall deal velocity is stable, but several opportunities in negotiation require stakeholder follow-ups to mitigate stalling.";
    }
    /**
     * Tests connection, API key validity, and model readiness
     */
    async testConnection() {
        const validatedAt = new Date().toISOString();
        return {
            success: this.connectionResult.success ?? true,
            message: this.connectionResult.message || "Mock AI provider connection verified.",
            latencyMs: this.connectionResult.latencyMs ?? 10,
            details: {
                model: this.defaultModel,
                queuedResponses: this.responseQueue.length,
                ...(this.connectionResult.details || {}),
            },
            validatedAt,
        };
    }
}
