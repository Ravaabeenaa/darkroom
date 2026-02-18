export const prerender = false;

export async function GET() {
  return new Response("hello from astro api");
}
