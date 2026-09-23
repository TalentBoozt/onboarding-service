import { CalendarController } from "../controllers/calendar.controller.js";
import { CalendarService } from "../services/calendar.service.js";
import { authenticate, requireFeatureFlag } from "../../../middleware/auth.middleware.js";
import { connectCalendarSchema, createMeetingEventSchema, updateMeetingEventSchema, availabilityQuerySchema, } from "../schemas/calendar.schema.js";
export async function calendarRoutes(app) {
    const service = new CalendarService();
    const controller = new CalendarController(service);
    // Unauthenticated Public iCal (.ics) Feed Route (Token protected)
    app.get("/feed/:token", controller.getICalFeed);
    app.get("/feed/:token.ics", controller.getICalFeed);
    app.get("/events/:id/export.ics", controller.exportEventICal);
    // Authenticated Routes
    app.register(async (authApp) => {
        authApp.addHook("preHandler", authenticate);
        authApp.addHook("preHandler", requireFeatureFlag("calendar_integration"));
        authApp.post("/connection", { schema: { body: connectCalendarSchema } }, controller.connectProvider);
        authApp.get("/connection", controller.getConnection);
        authApp.get("/availability", { schema: { querystring: availabilityQuerySchema } }, controller.getAvailability);
        authApp.post("/events", { schema: { body: createMeetingEventSchema } }, controller.createMeetingEvent);
        authApp.get("/events", controller.listMeetingEvents);
        authApp.get("/events/:id/export", controller.exportEventICal);
        authApp.put("/events/:id", { schema: { body: updateMeetingEventSchema } }, controller.updateMeetingEvent);
        authApp.patch("/events/:id", { schema: { body: updateMeetingEventSchema } }, controller.updateMeetingEvent);
        authApp.delete("/events/:id", controller.cancelMeetingEvent);
        authApp.post("/events/:id/cancel", controller.cancelMeetingEvent);
        // Onboarding Pack (.ics) & Milestone Review Linking (Phase 3)
        authApp.get("/pack/export", controller.exportOnboardingPack);
        authApp.get("/pack/export.ics", controller.exportOnboardingPack);
        authApp.post("/milestones/:milestoneId/schedule-review", controller.scheduleMilestoneReview);
    });
}
export default calendarRoutes;
