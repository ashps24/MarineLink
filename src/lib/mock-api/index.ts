/**
 * Mock service layer.
 *
 * Every screen reads through this module, never from `@/data` directly. When
 * the Zoho-backed services arrive, these functions are the only things that
 * change — see the mapping notes in each domain file.
 */
export * from "./client";
export * from "./types";
export * from "./users";
export * from "./dealers";
export * from "./customers";
export * from "./equipment";
export * from "./service-requests";
export * from "./dashboard";
export * from "./executive";
export * from "./products";
export * from "./phase2-dashboard";
