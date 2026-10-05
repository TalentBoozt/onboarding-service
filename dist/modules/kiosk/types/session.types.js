/**
 * State machine status values for discrete kiosk sessions (ADR-001, DEF-004).
 */
export const KIOSK_SESSION_STATUSES = [
    "active",
    "awaiting_supervisor",
    "completed",
    "aborted",
    "timed_out",
];
/**
 * Permitted verification methods for supervisor witness attestation (ADR-008).
 */
export const SUPERVISOR_WITNESS_METHODS = ["pin", "badge", "biometric"];
