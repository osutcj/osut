import type { PagesContext } from "../../_lib/types";

export async function onRequestGet(context: PagesContext<{ id: string }>) {
  const response = await context.next();
  if (response.status !== 404) {
    return response;
  }

  const fallback = await context.env.ASSETS.fetch(
    new URL("/educational/post/view", context.request.url)
  );

  return new Response(fallback.body, {
    status: 200,
    headers: {
      "Content-Type": fallback.headers.get("Content-Type") || "text/html; charset=utf-8",
    },
  });
}
