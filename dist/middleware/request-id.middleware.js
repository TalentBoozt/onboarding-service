export function registerRequestId(app) {
    app.addHook("onRequest", async (request, reply) => {
        reply.header("X-Request-Id", request.id);
    });
}
export default registerRequestId;
