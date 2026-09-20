import fastifyMultipart from "@fastify/multipart";
import storageConfig from "../config/storage.config.js";
export async function registerMultipart(app) {
    await app.register(fastifyMultipart, {
        limits: {
            fileSize: storageConfig.maxUploadSize,
        },
    });
}
export default registerMultipart;
