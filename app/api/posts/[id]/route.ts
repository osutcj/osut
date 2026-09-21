import { NextResponse } from "next/server";
import { getPost } from "@/lib/posts";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const post = await getPost(id);

    if (!post) {
      return NextResponse.json(
        { error: "Postarea nu a fost găsită." },
        { status: 404 }
      );
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error("Error fetching post:", error);
    return NextResponse.json(
      { error: "Eroare la încărcarea postării." },
      { status: 500 }
    );
  }
}
