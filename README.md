# cpp-ui-hearing

## Development proxy

The dev server proxies API calls to a remote backend so the app can be run locally against a real environment. The proxy is defined in `src/app/config/proxy.conf.js` and wired into `ng serve` via the `proxyConfig` option in `angular.json`.

### Why it is needed

- Some backend services do not return CORS headers, so the browser blocks any direct cross-origin request to them. The only way to reach those services from a local dev build is to route the call through the dev server, which is same-origin from the browser's point of view.
- Other services (for example `usersgroups`, `hearing`, `referencedata`) do allow CORS, but routing them through the same proxy keeps every request consistent and protects the app from breaking if a service's CORS configuration changes.
- The proxy also handles SSL (`secure: false`), rewrites the `Host` header (`changeOrigin: true`) and rewrites cookie domains to `localhost` so authenticated sessions work in development.
- The proxy is only active during `ng serve`; production builds are unaffected.
  The remote target lives in `proxy.conf.js`:

```js
target: 'https://steccm86.ingress01.dev.nl.cjscp.org.uk',
```

Change this value to point at a different dev environment.

### How to use it with `app.override.config.json`

`src/app/config/app.override.config.json` is loaded at runtime by `AppConfigService` and overrides values from `app.config.json`. For the proxy to actually be hit, `apiRoot` must point at the dev server (not directly at the remote backend). Hearing dev server runs on http://localhost:4600/ so the apiRoot needs to be as follows:

```json
{
  "apiRoot": "localhost:4600"
}
```
