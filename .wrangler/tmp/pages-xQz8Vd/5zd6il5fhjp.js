// <define:__ROUTES__>
var define_ROUTES_default = {
  version: 1,
  include: [
    "/*"
  ],
  exclude: [
    "/_astro/*",
    "/.assetsignore",
    "/favicon.ico",
    "/favicon.svg",
    "/shop/kodak-portra-400"
  ]
};

// node_modules/wrangler/templates/pages-dev-pipeline.ts
import worker from "C:\\Users\\ravaa\\OneDrive\\Documents\\smolbo1\\darkroom\\.wrangler\\tmp\\pages-xQz8Vd\\bundledWorker-0.13281088439562694.mjs";
import { isRoutingRuleMatch } from "C:\\Users\\ravaa\\OneDrive\\Documents\\smolbo1\\darkroom\\node_modules\\wrangler\\templates\\pages-dev-util.ts";
export * from "C:\\Users\\ravaa\\OneDrive\\Documents\\smolbo1\\darkroom\\.wrangler\\tmp\\pages-xQz8Vd\\bundledWorker-0.13281088439562694.mjs";
var routes = define_ROUTES_default;
var pages_dev_pipeline_default = {
  fetch(request, env, context) {
    const { pathname } = new URL(request.url);
    for (const exclude of routes.exclude) {
      if (isRoutingRuleMatch(pathname, exclude)) {
        return env.ASSETS.fetch(request);
      }
    }
    for (const include of routes.include) {
      if (isRoutingRuleMatch(pathname, include)) {
        const workerAsHandler = worker;
        if (workerAsHandler.fetch === void 0) {
          throw new TypeError("Entry point missing `fetch` handler");
        }
        return workerAsHandler.fetch(request, env, context);
      }
    }
    return env.ASSETS.fetch(request);
  }
};
export {
  pages_dev_pipeline_default as default
};
//# sourceMappingURL=5zd6il5fhjp.js.map
