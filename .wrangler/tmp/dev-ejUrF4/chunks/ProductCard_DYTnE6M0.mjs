globalThis.process ??= {}; globalThis.process.env ??= {};
import { e as createComponent, m as maybeRenderHead, g as addAttribute, r as renderTemplate, h as createAstro } from './astro/server_Cnns6-1q.mjs';

const $$Astro = createAstro();
const $$ProductCard = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$ProductCard;
  const {
    href = "/shop/sample",
    image = "https://picsum.photos/800/1000",
    name = "Product Name",
    price = "$25.00",
    compareAt,
    // "$25.00" (optional)
    badge
    // "SALE" (optional)
  } = Astro2.props;
  return renderTemplate`${maybeRenderHead()}<a${addAttribute(href, "href")} class="group block"> <div class="relative overflow-hidden bg-white/20"> <img${addAttribute(image, "src")}${addAttribute(name, "alt")} class="aspect-[4/5] w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" loading="lazy"> ${badge && renderTemplate`<div class="absolute right-3 top-3 bg-black px-2 py-1 text-[11px] font-medium tracking-wide text-white"> ${badge} </div>`} </div> <div class="mt-4 text-sm"> <div class="font-medium" style="font-family: var(--font-serif); font-size: 20px;"> ${name} </div> <div class="mt-1 flex items-center gap-2" style="color: var(--muted);"> <span${addAttribute(compareAt ? "text-[var(--text)]" : "", "class")}>${price}</span> ${compareAt && renderTemplate`<span class="line-through opacity-60">${compareAt}</span>`} </div> </div> </a>`;
}, "C:/Users/ravaa/OneDrive/Documents/smolbo1/darkroom/src/components/ProductCard.astro", void 0);

export { $$ProductCard as $ };
