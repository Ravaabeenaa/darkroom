globalThis.process ??= {}; globalThis.process.env ??= {};
import { e as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_Cnns6-1q.mjs';
import { $ as $$BaseLayout } from '../chunks/BaseLayout_BqUlQ3RK.mjs';
import { $ as $$ProductCard } from '../chunks/ProductCard_DYTnE6M0.mjs';
export { renderers } from '../renderers.mjs';

const $$Shop = createComponent(($$result, $$props, $$slots) => {
  const products = [
    {
      slug: "kodak-portra-400",
      name: "Kodak Portra 400",
      price: "$25.00",
      image: "https://images.unsplash.com/photo-1526948128573-703ee1aeb6fa?auto=format&fit=crop&w=1200&q=80"
    },
    {
      slug: "ilford-hp5",
      name: "Ilford HP5 Plus",
      price: "$25.00",
      image: "https://images.unsplash.com/photo-1519183071298-a2962be96c3e?auto=format&fit=crop&w=1200&q=80"
    },
    {
      slug: "fuji-superia-400",
      name: "Fujifilm Superia 400",
      price: "$20.00",
      compareAt: "$25.00",
      badge: "SALE",
      image: "https://images.unsplash.com/photo-1520975916090-3105956dac38?auto=format&fit=crop&w=1200&q=80"
    },
    {
      slug: "35mm-dev-scan",
      name: "35mm Develop + Scan",
      price: "$18.00",
      image: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=1200&q=80"
    }
  ];
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": "Shop \u2014 DARKROOM" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<section class="mt-12"> <h1 class="text-5xl md:text-6xl" style="font-family: var(--font-serif);">Shop</h1> <p class="mt-3 max-w-2xl text-sm md:text-base" style="color: var(--muted);">
Film, services, and add-ons — curated for your next roll.
</p> <div class="mt-10 grid gap-10 md:grid-cols-2 lg:grid-cols-3"> ${products.map((p) => renderTemplate`${renderComponent($$result2, "ProductCard", $$ProductCard, { "href": `/shop/${p.slug}`, "image": p.image, "name": p.name, "price": p.price, "compareAt": p.compareAt, "badge": p.badge })}`)} </div> </section> ` })}`;
}, "C:/Users/ravaa/OneDrive/Documents/smolbo1/darkroom/src/pages/shop.astro", void 0);

const $$file = "C:/Users/ravaa/OneDrive/Documents/smolbo1/darkroom/src/pages/shop.astro";
const $$url = "/shop";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Shop,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
