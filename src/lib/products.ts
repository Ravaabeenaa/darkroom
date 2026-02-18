// src/lib/products.ts
export type Product = {
  slug: string;
  title: string;
  price: number;
  compareAtPrice?: number;
  badge?: "SALE" | "NEW";
  short?: string;
  description?: string;
  images: string[]; // URLs or /images/...
  specs?: { label: string; value: string }[];
  inTheBox?: string[];
};

export const products: Product[] = [
  {
    slug: "kodak-portra-400",
    title: "Kodak Portra 400",
    price: 25,
    compareAtPrice: 30,
    badge: "SALE",
    short: "Natural skin tones, fine grain, big dynamic range. 35mm colour negative film.",
    description:
      "Portra 400 is a flexible, forgiving film with soft contrast and beautiful colour reproduction. Great for portraits, travel, and everyday shooting—especially when you want pleasant tones without harsh saturation.",
    images: [
      "https://images.unsplash.com/photo-1520975693411-b7a115d5a60b?auto=format&fit=crop&w=1400&q=80",
    ],
    specs: [
      { label: "Format", value: "35mm" },
      { label: "ISO", value: "400" },
      { label: "Type", value: "Color Negative (C-41)" },
      { label: "Look", value: "Neutral / Natural" },
    ],
    inTheBox: ["1x Roll (35mm, 36 exp)"],
  },
];
