import { KnowledgeBaseController } from "../controllers/article.controller.js";
import { KnowledgeBaseService } from "../services/article.service.js";
import { KnowledgeBaseRepository } from "../repositories/article.repository.js";
import { QuickLinkController } from "../controllers/quick-link.controller.js";
import { QuickLinkService } from "../services/quick-link.service.js";
import { QuickLinkRepository } from "../repositories/quick-link.repository.js";
import { authenticate, optionalAuthenticate, requireRole } from "../../../middleware/auth.middleware.js";
import { extractLocale } from "../../../middleware/locale.middleware.js";
import { createArticleSchema, updateArticleSchema } from "../schemas/article.schema.js";
export async function knowledgeBaseRoutes(app) {
    const repository = new KnowledgeBaseRepository();
    const service = new KnowledgeBaseService(repository);
    const controller = new KnowledgeBaseController(service);
    const qlRepository = new QuickLinkRepository();
    const qlService = new QuickLinkService(qlRepository);
    const qlController = new QuickLinkController(qlService);
    // Quick Links routes
    app.get("/quick-links", { preHandler: [optionalAuthenticate] }, qlController.getQuickLinks);
    app.post("/quick-links", { preHandler: [authenticate, requireRole(["owner", "admin"])] }, qlController.createQuickLink);
    app.patch("/quick-links/:id", { preHandler: [authenticate, requireRole(["owner", "admin"])] }, qlController.updateQuickLink);
    app.delete("/quick-links/:id", { preHandler: [authenticate, requireRole(["owner", "admin"])] }, qlController.deleteQuickLink);
    // GET /api/v1/knowledge-base/popular
    app.get("/popular", { preHandler: [optionalAuthenticate, extractLocale] }, controller.getPopularArticles);
    // GET /api/v1/knowledge-base
    app.get("/", { preHandler: [optionalAuthenticate, extractLocale] }, controller.listArticles);
    // GET /api/v1/knowledge-base/:id
    app.get("/:id", { preHandler: [optionalAuthenticate, extractLocale] }, controller.getArticle);
    // POST /api/v1/knowledge-base
    app.post("/", {
        preHandler: [authenticate, requireRole(["owner", "admin"])],
        schema: { body: createArticleSchema },
    }, controller.createArticle);
    // PATCH /api/v1/knowledge-base/:id
    app.patch("/:id", {
        preHandler: [authenticate, requireRole(["owner", "admin"])],
        schema: { body: updateArticleSchema },
    }, controller.updateArticle);
    // DELETE /api/v1/knowledge-base/:id
    app.delete("/:id", { preHandler: [authenticate, requireRole(["owner", "admin"])] }, controller.deleteArticle);
    // POST /api/v1/knowledge-base/:id/publish
    app.post("/:id/publish", { preHandler: [authenticate, requireRole(["owner", "admin"])] }, controller.publishArticle);
    // POST /api/v1/knowledge-base/:id/archive
    app.post("/:id/archive", { preHandler: [authenticate, requireRole(["owner", "admin"])] }, controller.archiveArticle);
    // Aliases for /articles (e.g. /api/v1/kb/articles or /api/v1/knowledge-base/articles)
    app.get("/articles", { preHandler: [optionalAuthenticate, extractLocale] }, controller.listArticles);
    app.get("/articles/:id", { preHandler: [optionalAuthenticate, extractLocale] }, controller.getArticle);
    app.post("/articles", {
        preHandler: [authenticate, requireRole(["owner", "admin"])],
        schema: { body: createArticleSchema },
    }, controller.createArticle);
    app.patch("/articles/:id", {
        preHandler: [authenticate, requireRole(["owner", "admin"])],
        schema: { body: updateArticleSchema },
    }, controller.updateArticle);
    app.delete("/articles/:id", { preHandler: [authenticate, requireRole(["owner", "admin"])] }, controller.deleteArticle);
    app.post("/articles/:id/publish", { preHandler: [authenticate, requireRole(["owner", "admin"])] }, controller.publishArticle);
    app.post("/articles/:id/archive", { preHandler: [authenticate, requireRole(["owner", "admin"])] }, controller.archiveArticle);
    // Knowledge Gap Routes
    const { KnowledgeGapController } = await import("../controllers/knowledge-gap.controller.js");
    const gapController = new KnowledgeGapController();
    app.get("/gaps", { preHandler: [authenticate, requireRole(["owner", "admin", "manager", "hr_admin"])] }, gapController.listGaps.bind(gapController));
    app.post("/gaps/:id/quick-answer", { preHandler: [authenticate, requireRole(["owner", "admin"])] }, gapController.resolveWithQuickAnswer.bind(gapController));
    app.post("/gaps/:id/link-article", { preHandler: [authenticate, requireRole(["owner", "admin"])] }, gapController.resolveWithArticle.bind(gapController));
    app.post("/gaps/:id/dismiss", { preHandler: [authenticate, requireRole(["owner", "admin"])] }, gapController.dismissGap.bind(gapController));
    app.post("/reindex", { preHandler: [authenticate, requireRole(["owner", "admin"])] }, gapController.reindexAll.bind(gapController));
}
export default knowledgeBaseRoutes;
