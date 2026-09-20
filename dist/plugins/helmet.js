import fastifyHelmet from "@fastify/helmet";
export async function registerHelmet(app) {
    await app.register(fastifyHelmet, {
        global: true,
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", "data:", "https:"],
                scriptSrc: ["'self'"],
            },
        },
    });
}
export default registerHelmet;
