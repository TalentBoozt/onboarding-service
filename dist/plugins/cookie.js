import fastifyCookie from "@fastify/cookie";
import jwtConfig from "../config/jwt.config.js";
export async function registerCookie(app) {
    await app.register(fastifyCookie, {
        secret: jwtConfig.cookieSecret,
    });
}
export default registerCookie;
