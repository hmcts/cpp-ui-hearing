// Development proxy — routes all XHR/fetch API calls through the local dev server to avoid CORS.
//
// The backend services have a mixed CORS configuration:
// - Most APIs (usersgroups, hearing, referencedata, etc.) have CORS enabled and could be called
//   directly from the browser, but routing them through the proxy keeps all traffic consistent
//   and avoids issues if CORS configuration changes.
// - The validation service (/api/validation/validate) has no CORS headers at all, so direct
//   browser requests are blocked. The proxy is essential for this service to work in development.
//
// This file is only active during `ng serve` and has no effect on production builds.

module.exports = {
  '^/': {
    target: 'https://steccm86.ingress01.dev.nl.cjscp.org.uk',
    // Ignore SSL certificate errors on the dev backend
    secure: false,
    // Rewrite the Host header to match the target, required to avoid CORS errors
    changeOrigin: true,
    // Rewrite cookie domains to localhost so the browser stores them for the dev server
    cookieDomainRewrite: 'localhost',
    bypass: req => {
      const { url } = req;
      // Only proxy XHR/fetch requests; let Vite serve scripts, styles and HMR internally
      if (req.headers['sec-fetch-dest'] !== 'empty') return url;
      // Serve Angular assets (configs, i18n) locally — only /hearing/api is a real backend route
      if (url.startsWith('/hearing/') && !url.startsWith('/hearing/api')) return url;
      return null;
    }
  }
};
