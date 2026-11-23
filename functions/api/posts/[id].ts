import { getPost } from "../../_lib/posts";
import type { PagesContext } from "../../_lib/types";

export async function onRequestGet(context: PagesContext<{ id: string }>) {
  try {
    const id = context.params.id;
    const post = await getPost(id, context.env, context.request.url);

    if (!post) {
      return Response.json(
        { error: "Postarea nu a fost găsită." },
        { status: 404 }
      );
    }

    return Response.json(post, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Error fetching post:", error);
    return Response.json(
      { error: "Eroare la încărcarea postării." },
      { status: 500 }
    );
  }
}
