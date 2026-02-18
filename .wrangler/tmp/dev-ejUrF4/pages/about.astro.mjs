globalThis.process ??= {}; globalThis.process.env ??= {};
import { e as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_Cnns6-1q.mjs';
import { $ as $$BaseLayout } from '../chunks/BaseLayout_BqUlQ3RK.mjs';
export { renderers } from '../renderers.mjs';

const $$About = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": "About \u2014 DARKROOM" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<h1 class="text-5xl md:text-6xl mt-10">Who we are</h1> <section id="contact" class="mt-20 rounded-[24px] p-10" style="background: var(--panel);"> <h2 class="text-4xl md:text-5xl">Contact us</h2> <p class="mt-4 max-w-xl" style="color: var(--muted);">
This will be the contact section (not a separate page). Footer “Contact” will jump here.
</p> </section> ` })}`;
}, "C:/Users/ravaa/OneDrive/Documents/smolbo1/darkroom/src/pages/about.astro", void 0);

const $$file = "C:/Users/ravaa/OneDrive/Documents/smolbo1/darkroom/src/pages/about.astro";
const $$url = "/about";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$About,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
