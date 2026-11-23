import { getPosts } from "../../_lib/posts";
import type { PagesContext } from "../../_lib/types";

export async function onRequestGet(context: PagesContext) {
  try {
    const posts = await getPosts(context.env, context.request.url);
    return Response.json(posts, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return Response.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}
