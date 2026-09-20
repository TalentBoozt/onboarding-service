export * from "./common.schema.js";
export * from "./block.schema.js";
export * from "./step.schema.js";
export * from "./journey.schema.js";
export * from "./device.schema.js";
export * from "./analytics.schema.js";
export * from "./player.schema.js";
export * from "./builder.schema.js";
/**
 * Validates data against a schema and throws a structured ZodError if invalid.
 */
export function validateOrThrow(schema, data) {
    return schema.parse(data);
}
/**
 * Validates data against a schema safely, returning a Zod SafeParseResult.
 */
export function validateSafe(schema, data) {
    return schema.safeParse(data);
}
