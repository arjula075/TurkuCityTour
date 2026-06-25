/** Compile-time flags for web vs mobile (Capacitor) builds. */
export const isAdminEnabled = import.meta.env.VITE_ENABLE_ADMIN !== 'false';
export const isMobileBuild = import.meta.env.VITE_MOBILE_BUILD === 'true';
/** Set VITE_ENABLE_REGISTRATION=false for invite-only (also disable signup in Supabase Auth). */
export const isRegistrationEnabled =
    import.meta.env.VITE_ENABLE_REGISTRATION !== 'false';
