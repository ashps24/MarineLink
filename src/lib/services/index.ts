/**
 * The application's data layer.
 *
 * Every screen reads through this module. Each domain file fetches from the
 * Catalyst Data Store via `live-source`, then applies the role and
 * organization scoping in `lib/permissions/visibility`.
 */
export * from "./client";
export * from "./types";
export * from "./dealers";
export * from "./customers";
export * from "./equipment";
export * from "./service-requests";
export * from "./dashboard";
export * from "./executive";
export * from "./products";
export * from "./phase2-dashboard";
export * from "./service-events";
