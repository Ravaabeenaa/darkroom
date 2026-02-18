globalThis.process ??= {}; globalThis.process.env ??= {};
import { e as createComponent, m as maybeRenderHead, g as addAttribute, l as renderSlot, r as renderTemplate, h as createAstro } from './astro/server_Cnns6-1q.mjs';

const $$Astro = createAstro();
const $$Button = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Button;
  const {
    href,
    type = "button",
    variant = "filled",
    // "filled" | "outline"
    size = "md",
    // "md" | "lg"
    class: className = ""
  } = Astro2.props;
  const isLink = typeof href === "string" && href.trim().length > 0;
  const base = "inline-flex items-center justify-center rounded-[999px] font-medium transition duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20";
  const sizes = {
    md: "h-12 px-10 text-sm",
    lg: "h-14 px-12 text-sm"
  };
  const variants = {
    filled: "bg-[var(--btn)] !text-white hover:brightness-110",
    outline: "bg-transparent text-[var(--text)] border border-[var(--line)] hover:bg-black/5"
  };
  return renderTemplate`${isLink ? renderTemplate`${maybeRenderHead()}<a${addAttribute(href, "href")}${addAttribute(`${base} ${sizes[size]} ${variants[variant]} ${className}`, "class")}>${renderSlot($$result, $$slots["default"])}</a>` : renderTemplate`<button${addAttribute(type, "type")}${addAttribute(`${base} ${sizes[size]} ${variants[variant]} ${className}`, "class")}>${renderSlot($$result, $$slots["default"])}</button>`}`;
}, "C:/Users/ravaa/OneDrive/Documents/smolbo1/darkroom/src/components/Button.astro", void 0);

export { $$Button as $ };
