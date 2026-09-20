import mongoose from "mongoose";
import KnowledgeChunk from "../models/knowledge-chunk.model.js";
import Article from "../models/article.model.js";
import EmbeddingService from "./embedding.service.js";
import KnowledgeIndexingService from "./knowledge-indexing.service.js";
export class KnowledgeRetrievalService {
    embeddingService;
    indexingService;
    static RELEVANCE_THRESHOLD = 0.40;
    constructor() {
        this.embeddingService = new EmbeddingService();
        this.indexingService = new KnowledgeIndexingService();
    }
    /**
     * Build authorization filter ensuring unauthorized company knowledge is NEVER sent to the LLM.
     */
    buildVisibilityFilter(userRole, userId, departmentId) {
        // Admins and owners have unrestricted access within their tenant
        if (userRole === "owner" || userRole === "admin" || userRole === "super_admin") {
            return {};
        }
        const conditions = [{ "visibility.access": "all" }];
        if (departmentId) {
            conditions.push({
                "visibility.access": "department",
                "visibility.departments": departmentId,
            });
        }
        conditions.push({
            "visibility.access": "custom",
            "visibility.users": userId,
        });
        return { $or: conditions };
    }
    /**
     * Centralized tenant-safe hybrid knowledge retrieval.
     */
    async retrieveOrganizationKnowledge(params) {
        const orgObjectId = new mongoose.Types.ObjectId(params.organizationId.toString());
        const userObjectId = new mongoose.Types.ObjectId(params.userId.toString());
        const deptObjectId = params.departmentId ? new mongoose.Types.ObjectId(params.departmentId.toString()) : undefined;
        const limit = params.limit || 3;
        // 1. Mandatory Tenant Boundary and Active Status Filter
        const queryFilter = {
            organizationId: orgObjectId,
            status: "active",
        };
        // 2. Pre-Retrieval Authorization Filter
        const visibilityFilter = this.buildVisibilityFilter(params.userRole, userObjectId, deptObjectId);
        if (visibilityFilter.$or) {
            queryFilter.$or = visibilityFilter.$or;
        }
        // 3. Generate Query Embedding
        const queryEmbedding = await this.embeddingService.generateEmbedding(params.query, params.providerConfig, params.secrets);
        // 4. Tokenize search terms for keyword scoring
        const STOP_WORDS = new Set([
            "what", "is", "the", "for", "during", "and", "or", "in", "on", "at", "to", "a", "an", "of",
            "how", "can", "tell", "about", "please", "me", "are", "do", "does", "with", "this", "that",
            "from", "your", "our", "policy", "guidelines", "rules", "company"
        ]);
        const keywords = params.query
            .toLowerCase()
            .replace(/[^\w\s]/g, "")
            .split(/\s+/)
            .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
        // 5. Fetch authorized candidate chunks (with automatic sync for unindexed tenant articles)
        let candidates = await KnowledgeChunk.find(queryFilter).limit(50);
        if (candidates.length === 0) {
            const unindexedArticles = await Article.find({
                organizationId: orgObjectId,
                "publishing.status": "published",
                isDeleted: { $ne: true },
            });
            if (unindexedArticles.length > 0) {
                for (const art of unindexedArticles) {
                    await this.indexingService.indexArticle(art, params.providerConfig, params.secrets);
                }
                candidates = await KnowledgeChunk.find(queryFilter).limit(50);
            }
        }
        if (candidates.length === 0) {
            return {
                hasRelevantKnowledge: false,
                topScore: 0,
                chunks: [],
                citations: [],
            };
        }
        // 6. Compute hybrid score (Semantic vector similarity + lexical keyword match)
        const scoredChunks = candidates.map((chunk) => {
            const vectorScore = this.embeddingService.cosineSimilarity(queryEmbedding, chunk.embedding || []);
            let keywordScore = 0;
            const titleLower = chunk.title.toLowerCase();
            const headingLower = (chunk.heading || "").toLowerCase();
            const contentLower = chunk.content.toLowerCase();
            for (const kw of keywords) {
                if (titleLower.includes(kw))
                    keywordScore += 12;
                if (headingLower.includes(kw))
                    keywordScore += 8;
                if (contentLower.includes(kw))
                    keywordScore += 4;
            }
            const normalizedKeywordScore = Math.min(keywordScore, 30) / 30;
            // Weighted hybrid fusion
            const hybridScore = vectorScore > 0 ? (0.55 * vectorScore + 0.45 * normalizedKeywordScore) : normalizedKeywordScore;
            return {
                chunk,
                score: hybridScore,
                vectorScore,
                keywordScore,
            };
        });
        // 7. Sort by highest relevance
        scoredChunks.sort((a, b) => b.score - a.score);
        const topCandidate = scoredChunks[0];
        const topScore = topCandidate?.score || 0;
        // 8. Strict Relevance Thresholding: prevents hallucinations
        const isRelevant = topCandidate && (topCandidate.vectorScore >= 0.60 || topCandidate.keywordScore >= 8 || topScore >= KnowledgeRetrievalService.RELEVANCE_THRESHOLD);
        if (!isRelevant) {
            return {
                hasRelevantKnowledge: false,
                topScore,
                chunks: [],
                citations: [],
            };
        }
        const selected = scoredChunks.filter((s) => s.score > 0.15).slice(0, limit);
        const chunks = selected.map((s) => ({
            title: s.chunk.title,
            heading: s.chunk.heading,
            content: s.chunk.content,
            resourceId: s.chunk.resourceId.toString(),
            resourceType: s.chunk.resourceType,
            score: s.score,
        }));
        // Deduplicate citations by resourceId
        const seenResourceIds = new Set();
        const citations = [];
        for (const c of chunks) {
            if (!seenResourceIds.has(c.resourceId)) {
                seenResourceIds.add(c.resourceId);
                citations.push({
                    title: c.title,
                    url: `/kb/${c.resourceId}`,
                    articleId: c.resourceId,
                });
            }
        }
        return {
            hasRelevantKnowledge: true,
            topScore,
            chunks,
            citations,
        };
    }
}
export default KnowledgeRetrievalService;
