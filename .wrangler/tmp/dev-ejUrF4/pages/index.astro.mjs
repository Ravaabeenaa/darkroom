globalThis.process ??= {}; globalThis.process.env ??= {};
import { e as createComponent, m as maybeRenderHead, k as renderComponent, r as renderTemplate, h as createAstro, g as addAttribute } from '../chunks/astro/server_Cnns6-1q.mjs';
import { $ as $$BaseLayout } from '../chunks/BaseLayout_BqUlQ3RK.mjs';
import { $ as $$Button } from '../chunks/Button_CMOiCnOl.mjs';
import { $ as $$ProductCard } from '../chunks/ProductCard_DYTnE6M0.mjs';
/* empty css                                 */
export { renderers } from '../renderers.mjs';

const $$Astro$1 = createAstro();
const $$SectionHeader = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$1, $$props, $$slots);
  Astro2.self = $$SectionHeader;
  const {
    title,
    actionLabel,
    actionHref = "#"
  } = Astro2.props;
  return renderTemplate`${maybeRenderHead()}<div class="flex items-end justify-between gap-6"> <h2 class="text-4xl md:text-5xl leading-[0.95]">${title}</h2> ${actionLabel && renderTemplate`<div class="shrink-0"> ${renderComponent($$result, "Button", $$Button, { "href": actionHref, "variant": "outline", "size": "md" }, { "default": ($$result2) => renderTemplate`${actionLabel}` })} </div>`} </div>`;
}, "C:/Users/ravaa/OneDrive/Documents/smolbo1/darkroom/src/components/SectionHeader.astro", void 0);

const $$Astro = createAstro();
const $$Accordion = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Accordion;
  const { items = [] } = Astro2.props;
  return renderTemplate`${maybeRenderHead()}<div class="divide-y" style="border-color: var(--line);" data-astro-cid-oqjbs5yv> ${items.map((it, idx) => renderTemplate`<details class="py-4"${addAttribute(idx === 0, "open")} data-astro-cid-oqjbs5yv> <summary class="flex cursor-pointer list-none items-center justify-between gap-6 text-lg" data-astro-cid-oqjbs5yv> <span style="font-family: var(--font-serif);" data-astro-cid-oqjbs5yv>${it.title}</span> <span class="text-xl" style="color: var(--muted);" data-astro-cid-oqjbs5yv>+</span> </summary> <div class="mt-4 max-w-md text-sm leading-6" style="color: var(--muted);" data-astro-cid-oqjbs5yv> ${it.content} </div> </details>`)} </div> `;
}, "C:/Users/ravaa/OneDrive/Documents/smolbo1/darkroom/src/components/Accordion.astro", void 0);

const $$Index = createComponent(($$result, $$props, $$slots) => {
  const featured = [
    { image: "https://picsum.photos/800/1000?1", name: "Product Name", price: "$25.00" },
    { image: "https://picsum.photos/800/1000?2", name: "Product Name", price: "$25.00" },
    { image: "https://picsum.photos/800/1000?3", name: "Product Name", price: "$25.00" },
    { image: "https://picsum.photos/800/1000?4", name: "Product Name", price: "$20.00", compareAt: "$25.00", badge: "SALE" }
  ];
  const services = [
    { title: "Basic Service", content: "Describe important details like price, value, length of service, and why it\u2019s unique." },
    { title: "Intermediate Service", content: "Add a second service tier with key inclusions and turnaround time." },
    { title: "Advanced Service", content: "Add premium offering details, add-ons, and deliverables." }
  ];
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": "DARKROOM" }, { "default": ($$result2) => renderTemplate`  ${maybeRenderHead()}<section class="pt-20 md:pt-28"> <div class="grid gap-10 md:grid-cols-2 md:items-start"> <div> <h1 class="text-[64px] md:text-[110px] leading-[0.85] tracking-[-0.03em]">
Snap Your World with Us
</h1> <p class="mt-12 max-w-md text-[15px] leading-7" style="color: var(--muted);">
Snap, smile, and let your personality shine with our vibrant photo services!
          Whether it’s capturing the twinkle in your eye or the laughter echoing around,
          we’re here to make every snapshot a spectacular journey.
</p> <div class="mt-10"> ${renderComponent($$result2, "Button", $$Button, { "href": "/about", "size": "lg" }, { "default": ($$result3) => renderTemplate`Learn more` })} </div> </div> <div class="md:pt-10"> <div class="bg-white/20 p-0"> <img src="https://picsum.photos/1200/900?hero" alt="Hero" class="aspect-[4/3] w-full object-cover" loading="eager"> </div> </div> </div> </section>  <section class="mt-32 md:mt-40"> ${renderComponent($$result2, "SectionHeader", $$SectionHeader, { "title": "Featured Products", "actionLabel": "Shop all", "actionHref": "/shop" })} <div class="mt-10 grid gap-8 md:grid-cols-4"> ${featured.map((p) => renderTemplate`${renderComponent($$result2, "ProductCard", $$ProductCard, { "href": "/shop/product-demo", "image": p.image, "name": p.name, "price": p.price, "compareAt": p.compareAt, "badge": p.badge })}`)} </div> </section>  <section class="mt-24 md:mt-32"> <div class="grid gap-10 md:grid-cols-2 md:items-start"> <div> <h2 class="text-5xl md:text-6xl leading-[0.95]">Explore our<br>services</h2> <p class="mt-6 max-w-md text-sm leading-6" style="color: var(--muted);">
Capture life’s joyful moments with our playful photo services that turn ordinary
          snaps into extraordinary stories.
</p> <div class="mt-10"> ${renderComponent($$result2, "Accordion", $$Accordion, { "items": services })} </div> <div class="mt-10"> ${renderComponent($$result2, "Button", $$Button, { "href": "/services", "size": "lg" }, { "default": ($$result3) => renderTemplate`Learn more` })} </div> </div> <div class="md:pt-4"> <img src="https://picsum.photos/1200/900?services" alt="Services" class="aspect-[4/3] w-full object-cover" loading="lazy"> </div> </div> </section>  <section class="mt-24 md:mt-32"> <div class="grid gap-10 md:grid-cols-2 md:items-start"> <div> <h2 class="text-5xl md:text-6xl leading-[0.95]">Get to<br>know us</h2> <p class="mt-6 max-w-md text-sm leading-6" style="color: var(--muted);">
Tell people about who you are, your origin, your process, or your inspirations.
</p> <div class="mt-10"> ${renderComponent($$result2, "Button", $$Button, { "href": "/about", "size": "lg" }, { "default": ($$result3) => renderTemplate`Learn more` })} </div> <div class="mt-10"> <img src="https://picsum.photos/1200/700?about1" alt="About 1" class="w-full object-cover" loading="lazy"> </div> </div> <div class="md:pt-10"> <img src="https://picsum.photos/900/1200?about2" alt="About 2" class="w-full object-cover" loading="lazy"> </div> </div> </section>  <section class="mt-24 md:mt-32 pb-10"> <div class="flex items-start justify-between gap-8"> <h2 class="text-[64px] leading-[0.9] md:text-[120px]">• Follow Us</h2> <div class="pt-6"> ${renderComponent($$result2, "Button", $$Button, { "href": "#", "size": "lg" }, { "default": ($$result3) => renderTemplate`Social` })} </div> </div> <div class="mt-10 grid gap-6 md:grid-cols-4"> <img class="aspect-[4/3] w-full object-cover" src="https://picsum.photos/900/700?g1" alt="g1" loading="lazy"> <img class="aspect-[4/3] w-full object-cover" src="https://picsum.photos/900/700?g2" alt="g2" loading="lazy"> <img class="aspect-[4/3] w-full object-cover" src="https://picsum.photos/900/700?g3" alt="g3" loading="lazy"> <img class="aspect-[4/3] w-full object-cover" src="https://picsum.photos/900/700?g4" alt="g4" loading="lazy"> </div> </section> ` })}`;
}, "C:/Users/ravaa/OneDrive/Documents/smolbo1/darkroom/src/pages/index.astro", void 0);

const $$file = "C:/Users/ravaa/OneDrive/Documents/smolbo1/darkroom/src/pages/index.astro";
const $$url = "";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
