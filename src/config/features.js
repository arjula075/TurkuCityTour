/** Compile-time flags for web vs mobile (Capacitor) builds. */
export const isAdminEnabled = import.meta.env.VITE_ENABLE_ADMIN !== 'false';
export const isMobileBuild = import.meta.env.VITE_MOBILE_BUILD === 'true';
