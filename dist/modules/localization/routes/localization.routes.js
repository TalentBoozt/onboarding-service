import { LocalizationController } from "../controllers/localization.controller.js";
import { authenticate, requireRole } from "../../../middleware/auth.middleware.js";
import { extractLocale } from "../../../middleware/locale.middleware.js";
export async function localizationRoutes(app) {
    const controller = new LocalizationController();
    // ── Public: read-only ──────────────────────────────────────────────────────
    /** Returns supported locales — frontend uses this for the LanguageSwitcher */
    app.get("/supported-locales", controller.getSupportedLocales);
    /** Translate text in real-time */
    app.post("/translate-realtime", controller.translateRealtime);
    /** Get approved translations for an entity in the resolved locale */
    app.get("/:entityType/:entityId", { preHandler: [extractLocale] }, controller.getEntityTranslations);
    // ── Admin: translation management ─────────────────────────────────────────
    const adminAuth = [authenticate, requireRole(["owner", "admin", "super_admin"])];
    /** List all translations for an entity (all statuses, all languages) */
    app.get("/admin/:entityType/:entityId/translations", { preHandler: adminAuth }, controller.listTranslations);
    /** Upsert a translation for a specific entity field and language */
    app.put("/admin/:entityType/:entityId/:field/:lang", { preHandler: adminAuth }, controller.upsertTranslation);
    /** Approve a translation → status: APPROVED → visible in production */
    app.post("/admin/:entityType/:entityId/:field/:lang/approve", { preHandler: adminAuth }, controller.approveTranslation);
    // ── Admin readiness: translation dashboard ─────────────────────────────────
    /** List entity+field pairs missing approved translations for a language */
    app.get("/admin/missing", { preHandler: adminAuth }, controller.listMissingTranslations);
    /** List all OUTDATED translations (English source changed, not re-approved) */
    app.get("/admin/outdated", { preHandler: adminAuth }, controller.listOutdatedTranslations);
    /** Translation coverage stats: approved vs total per language per field */
    app.get("/admin/coverage", { preHandler: adminAuth }, controller.translationCoverage);
}
export default localizationRoutes;
