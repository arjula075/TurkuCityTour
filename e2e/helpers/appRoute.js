/**
 * Resolve a client route for Playwright page.goto.
 * Mobile builds use HashRouter — direct paths like /privacy need /#/privacy.
 */
export function appRoute(path) {
    const mobile = process.env.VITE_MOBILE_BUILD === 'true';
    if (!mobile || path === '/') {
        return path;
    }
    return `/#${path}`;
}
