import fastifyRateLimit from "@fastify/rate-limit";
export async function registerRateLimit(app) {
    await app.register(fastifyRateLimit, {
        max: process.env.NODE_ENV === "test" ? 10000 : 100,
        timeWindow: "1 minute",
        errorResponseBuilder: (request, context) => {
            return {
                success: false,
                message: "Too many requests.",
                error: {
                    code: "RATE_LIMIT_EXCEEDED",
                },
            };
        },
    });
}
export default registerRateLimit;
