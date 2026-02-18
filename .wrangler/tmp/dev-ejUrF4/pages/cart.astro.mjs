globalThis.process ??= {}; globalThis.process.env ??= {};
import { e as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_Cnns6-1q.mjs';
import { $ as $$BaseLayout } from '../chunks/BaseLayout_BqUlQ3RK.mjs';
export { renderers } from '../renderers.mjs';

const $$Cart = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": "Cart \u2014 DARKROOM" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<h1 class="text-5xl md:text-6xl mt-10">Shopping Cart</h1> ` })}`;
}, "C:/Users/ravaa/OneDrive/Documents/smolbo1/darkroom/src/pages/cart.astro", void 0);

const $$file = "C:/Users/ravaa/OneDrive/Documents/smolbo1/darkroom/src/pages/cart.astro";
const $$url = "/cart";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Cart,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
