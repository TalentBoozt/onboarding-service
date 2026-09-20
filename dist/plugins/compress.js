import fastifyCompress from "@fastify/compress";
export async function registerCompress(app) {
    await app.register(fastifyCompress, { global: true });
}
export default registerCompress;
