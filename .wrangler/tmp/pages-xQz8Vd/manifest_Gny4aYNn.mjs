globalThis.process ??= {}; globalThis.process.env ??= {};
import { o as decodeKey } from './chunks/astro/server_Cnns6-1q.mjs';
import './chunks/astro-designed-error-pages_CzUMYfja.mjs';
import { N as NOOP_MIDDLEWARE_FN } from './chunks/noop-middleware_B9KcFReD.mjs';

function sanitizeParams(params) {
  return Object.fromEntries(
    Object.entries(params).map(([key, value]) => {
      if (typeof value === "string") {
        return [key, value.normalize().replace(/#/g, "%23").replace(/\?/g, "%3F")];
      }
      return [key, value];
    })
  );
}
function getParameter(part, params) {
  if (part.spread) {
    return params[part.content.slice(3)] || "";
  }
  if (part.dynamic) {
    if (!params[part.content]) {
      throw new TypeError(`Missing parameter: ${part.content}`);
    }
    return params[part.content];
  }
  return part.content.normalize().replace(/\?/g, "%3F").replace(/#/g, "%23").replace(/%5B/g, "[").replace(/%5D/g, "]");
}
function getSegment(segment, params) {
  const segmentPath = segment.map((part) => getParameter(part, params)).join("");
  return segmentPath ? "/" + segmentPath : "";
}
function getRouteGenerator(segments, addTrailingSlash) {
  return (params) => {
    const sanitizedParams = sanitizeParams(params);
    let trailing = "";
    if (addTrailingSlash === "always" && segments.length) {
      trailing = "/";
    }
    const path = segments.map((segment) => getSegment(segment, sanitizedParams)).join("") + trailing;
    return path || "/";
  };
}

function deserializeRouteData(rawRouteData) {
  return {
    route: rawRouteData.route,
    type: rawRouteData.type,
    pattern: new RegExp(rawRouteData.pattern),
    params: rawRouteData.params,
    component: rawRouteData.component,
    generate: getRouteGenerator(rawRouteData.segments, rawRouteData._meta.trailingSlash),
    pathname: rawRouteData.pathname || void 0,
    segments: rawRouteData.segments,
    prerender: rawRouteData.prerender,
    redirect: rawRouteData.redirect,
    redirectRoute: rawRouteData.redirectRoute ? deserializeRouteData(rawRouteData.redirectRoute) : void 0,
    fallbackRoutes: rawRouteData.fallbackRoutes.map((fallback) => {
      return deserializeRouteData(fallback);
    }),
    isIndex: rawRouteData.isIndex,
    origin: rawRouteData.origin
  };
}

function deserializeManifest(serializedManifest) {
  const routes = [];
  for (const serializedRoute of serializedManifest.routes) {
    routes.push({
      ...serializedRoute,
      routeData: deserializeRouteData(serializedRoute.routeData)
    });
    const route = serializedRoute;
    route.routeData = deserializeRouteData(serializedRoute.routeData);
  }
  const assets = new Set(serializedManifest.assets);
  const componentMetadata = new Map(serializedManifest.componentMetadata);
  const inlinedScripts = new Map(serializedManifest.inlinedScripts);
  const clientDirectives = new Map(serializedManifest.clientDirectives);
  const serverIslandNameMap = new Map(serializedManifest.serverIslandNameMap);
  const key = decodeKey(serializedManifest.key);
  return {
    // in case user middleware exists, this no-op middleware will be reassigned (see plugin-ssr.ts)
    middleware() {
      return { onRequest: NOOP_MIDDLEWARE_FN };
    },
    ...serializedManifest,
    assets,
    componentMetadata,
    inlinedScripts,
    clientDirectives,
    routes,
    serverIslandNameMap,
    key
  };
}

const manifest = deserializeManifest({"hrefRoot":"file:///C:/Users/ravaa/OneDrive/Documents/smolbo1/darkroom/","cacheDir":"file:///C:/Users/ravaa/OneDrive/Documents/smolbo1/darkroom/node_modules/.astro/","outDir":"file:///C:/Users/ravaa/OneDrive/Documents/smolbo1/darkroom/dist/","srcDir":"file:///C:/Users/ravaa/OneDrive/Documents/smolbo1/darkroom/src/","publicDir":"file:///C:/Users/ravaa/OneDrive/Documents/smolbo1/darkroom/public/","buildClientDir":"file:///C:/Users/ravaa/OneDrive/Documents/smolbo1/darkroom/dist/","buildServerDir":"file:///C:/Users/ravaa/OneDrive/Documents/smolbo1/darkroom/dist/_worker.js/","adapterName":"@astrojs/cloudflare","routes":[{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"type":"page","component":"_server-islands.astro","params":["name"],"segments":[[{"content":"_server-islands","dynamic":false,"spread":false}],[{"content":"name","dynamic":true,"spread":false}]],"pattern":"^\\/_server-islands\\/([^/]+?)\\/?$","prerender":false,"isIndex":false,"fallbackRoutes":[],"route":"/_server-islands/[name]","origin":"internal","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"type":"endpoint","isIndex":false,"route":"/_image","pattern":"^\\/_image\\/?$","segments":[[{"content":"_image","dynamic":false,"spread":false}]],"params":[],"component":"node_modules/@astrojs/cloudflare/dist/entrypoints/image-endpoint.js","pathname":"/_image","prerender":false,"fallbackRoutes":[],"origin":"internal","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[{"type":"external","src":"/_astro/about.Ca2_7EOQ.css"}],"routeData":{"route":"/about","isIndex":false,"type":"page","pattern":"^\\/about\\/?$","segments":[[{"content":"about","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/about.astro","pathname":"/about","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[{"type":"external","src":"/_astro/about.Ca2_7EOQ.css"}],"routeData":{"route":"/cart","isIndex":false,"type":"page","pattern":"^\\/cart\\/?$","segments":[[{"content":"cart","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/cart.astro","pathname":"/cart","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[{"type":"external","src":"/_astro/about.Ca2_7EOQ.css"}],"routeData":{"route":"/shop","isIndex":false,"type":"page","pattern":"^\\/shop\\/?$","segments":[[{"content":"shop","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/shop.astro","pathname":"/shop","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[{"type":"external","src":"/_astro/about.Ca2_7EOQ.css"},{"type":"inline","content":"summary[data-astro-cid-oqjbs5yv]::-webkit-details-marker{display:none}details[data-astro-cid-oqjbs5yv][open] summary[data-astro-cid-oqjbs5yv] span[data-astro-cid-oqjbs5yv]:last-child{transform:rotate(45deg);display:inline-block}\n"}],"routeData":{"route":"/","isIndex":true,"type":"page","pattern":"^\\/$","segments":[],"params":[],"component":"src/pages/index.astro","pathname":"/","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}}],"base":"/","trailingSlash":"ignore","compressHTML":true,"componentMetadata":[["C:/Users/ravaa/OneDrive/Documents/smolbo1/darkroom/src/pages/about.astro",{"propagation":"none","containsHead":true}],["C:/Users/ravaa/OneDrive/Documents/smolbo1/darkroom/src/pages/cart.astro",{"propagation":"none","containsHead":true}],["C:/Users/ravaa/OneDrive/Documents/smolbo1/darkroom/src/pages/index.astro",{"propagation":"none","containsHead":true}],["C:/Users/ravaa/OneDrive/Documents/smolbo1/darkroom/src/pages/shop.astro",{"propagation":"none","containsHead":true}],["C:/Users/ravaa/OneDrive/Documents/smolbo1/darkroom/src/pages/shop/[slug].astro",{"propagation":"none","containsHead":true}]],"renderers":[],"clientDirectives":[["idle","(()=>{var l=(n,t)=>{let i=async()=>{await(await n())()},e=typeof t.value==\"object\"?t.value:void 0,s={timeout:e==null?void 0:e.timeout};\"requestIdleCallback\"in window?window.requestIdleCallback(i,s):setTimeout(i,s.timeout||200)};(self.Astro||(self.Astro={})).idle=l;window.dispatchEvent(new Event(\"astro:idle\"));})();"],["load","(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).load=e;window.dispatchEvent(new Event(\"astro:load\"));})();"],["media","(()=>{var n=(a,t)=>{let i=async()=>{await(await a())()};if(t.value){let e=matchMedia(t.value);e.matches?i():e.addEventListener(\"change\",i,{once:!0})}};(self.Astro||(self.Astro={})).media=n;window.dispatchEvent(new Event(\"astro:media\"));})();"],["only","(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).only=e;window.dispatchEvent(new Event(\"astro:only\"));})();"],["visible","(()=>{var a=(s,i,o)=>{let r=async()=>{await(await s())()},t=typeof i.value==\"object\"?i.value:void 0,c={rootMargin:t==null?void 0:t.rootMargin},n=new IntersectionObserver(e=>{for(let l of e)if(l.isIntersecting){n.disconnect(),r();break}},c);for(let e of o.children)n.observe(e)};(self.Astro||(self.Astro={})).visible=a;window.dispatchEvent(new Event(\"astro:visible\"));})();"]],"entryModules":{"\u0000astro-internal:middleware":"_astro-internal_middleware.mjs","\u0000virtual:astro:actions/noop-entrypoint":"noop-entrypoint.mjs","\u0000@astro-page:src/pages/about@_@astro":"pages/about.astro.mjs","\u0000@astro-page:src/pages/cart@_@astro":"pages/cart.astro.mjs","\u0000@astro-page:src/pages/shop/[slug]@_@astro":"pages/shop/_slug_.astro.mjs","\u0000@astro-page:src/pages/shop@_@astro":"pages/shop.astro.mjs","\u0000@astro-page:src/pages/index@_@astro":"pages/index.astro.mjs","\u0000@astrojs-ssr-virtual-entry":"index.js","\u0000@astro-renderers":"renderers.mjs","\u0000@astro-page:node_modules/@astrojs/cloudflare/dist/entrypoints/image-endpoint@_@js":"pages/_image.astro.mjs","\u0000@astrojs-ssr-adapter":"_@astrojs-ssr-adapter.mjs","\u0000@astrojs-manifest":"manifest_Gny4aYNn.mjs","C:/Users/ravaa/OneDrive/Documents/smolbo1/darkroom/node_modules/unstorage/drivers/cloudflare-kv-binding.mjs":"chunks/cloudflare-kv-binding_DMly_2Gl.mjs","C:/Users/ravaa/OneDrive/Documents/smolbo1/darkroom/node_modules/astro/dist/assets/services/sharp.js":"chunks/sharp_B3q-IORO.mjs","astro:scripts/before-hydration.js":""},"inlinedScripts":[],"assets":["/_astro/about.Ca2_7EOQ.css","/favicon.ico","/favicon.svg","/_worker.js/index.js","/_worker.js/noop-entrypoint.mjs","/_worker.js/renderers.mjs","/_worker.js/_@astrojs-ssr-adapter.mjs","/_worker.js/_astro-internal_middleware.mjs","/_worker.js/chunks/astro-designed-error-pages_CzUMYfja.mjs","/_worker.js/chunks/astro_ChI1nqsR.mjs","/_worker.js/chunks/BaseLayout_BqUlQ3RK.mjs","/_worker.js/chunks/Button_CMOiCnOl.mjs","/_worker.js/chunks/cloudflare-kv-binding_DMly_2Gl.mjs","/_worker.js/chunks/image-endpoint_BOtoxi2t.mjs","/_worker.js/chunks/index_BQ2Bk7Kr.mjs","/_worker.js/chunks/noop-middleware_B9KcFReD.mjs","/_worker.js/chunks/path_CH3auf61.mjs","/_worker.js/chunks/ProductCard_DYTnE6M0.mjs","/_worker.js/chunks/remote_CrdlObHx.mjs","/_worker.js/chunks/sharp_B3q-IORO.mjs","/_worker.js/chunks/_@astrojs-ssr-adapter_DLchOFGg.mjs","/_worker.js/pages/about.astro.mjs","/_worker.js/pages/cart.astro.mjs","/_worker.js/pages/index.astro.mjs","/_worker.js/pages/shop.astro.mjs","/_worker.js/pages/_image.astro.mjs","/_worker.js/_astro/about.Ca2_7EOQ.css","/_worker.js/chunks/astro/server_Cnns6-1q.mjs","/_worker.js/pages/shop/_slug_.astro.mjs"],"buildFormat":"directory","checkOrigin":true,"allowedDomains":[],"serverIslandNameMap":[],"key":"60t4hIrC9S/hgsMJyZtTS+Y/m3Ko0rf492sNJY5dX1E=","sessionConfig":{"driver":"cloudflare-kv-binding","options":{"binding":"SESSION"}}});
if (manifest.sessionConfig) manifest.sessionConfig.driverModule = () => import('./chunks/cloudflare-kv-binding_DMly_2Gl.mjs');

export { manifest };
