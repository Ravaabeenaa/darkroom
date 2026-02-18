globalThis.process ??= {}; globalThis.process.env ??= {};
import { e as createComponent, n as renderHead, l as renderSlot, r as renderTemplate, h as createAstro } from './astro/server_Cnns6-1q.mjs';
/* empty css                         */

const $$Astro = createAstro();
const $$BaseLayout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$BaseLayout;
  const { title = "DARKROOM" } = Astro2.props;
  return renderTemplate`<html lang="en"> <head><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600&family=Inter:wght@400;500;600&display=swap" rel="stylesheet"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>${renderHead()}</head> <body> <div class="min-h-screen"> <header class="px-6 py-6"> <div class="mx-auto flex max-w-[var(--container)] items-center justify-between"> <a href="/" class="text-xl tracking-tight" style="font-family: var(--font-serif);">darkroom</a> <nav class="hidden gap-8 text-sm md:flex"> <a href="/shop">Shop</a> <a href="/about">About</a> <a href="/cart">Cart</a> </nav> <a class="md:hidden text-sm" href="/menu">Menu</a> </div> </header> <main class="px-6"> <div class="mx-auto max-w-[var(--container)]"> ${renderSlot($$result, $$slots["default"])} </div> </main> <footer class="mt-24 px-6 pb-16 pt-12"> <div class="mx-auto max-w-[var(--container)] border-t" style="border-color: var(--line);"> <div class="grid gap-10 py-10 md:grid-cols-3"> <div> <div class="text-2xl" style="font-family: var(--font-serif);">DARKROOM</div> </div> <div class="text-sm"> <div class="mb-3 font-medium">Explore</div> <div class="grid gap-2"> <a href="/about">About us</a> <a href="/about#contact">Contact</a> <a href="/shop">Shop</a> <a href="/services">Services</a> </div> </div> <div class="text-sm"> <div class="mb-3 font-medium">Contact</div> <div class="grid gap-2" style="color: var(--muted);"> <div>Email: hello@darkroom.mv</div> <div>Phone: +960 000-0000</div> </div> </div> </div> </div> </footer> </div> </body></html>`;
}, "C:/Users/ravaa/OneDrive/Documents/smolbo1/darkroom/src/layouts/BaseLayout.astro", void 0);

export { $$BaseLayout as $ };
