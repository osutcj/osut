import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { put } from "@vercel/blob";
import { getPosts, savePosts, deleteImage, Post } from "@/lib/posts";

export const dynamic = "force-dynamic";

const ALLOWED_EXTENSIONS = new Set([".webp", ".png", ".jpg", ".jpeg", ".gif", ".svg"]);
const MIME_TO_EXT: Record<string, string> = {
  "image/webp": ".webp",
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/gif": ".gif",
  "image/svg+xml": ".svg",
};
const EXT_TO_MIME: Record<string, string> = {
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
};

/**
 * Helper to validate the admin password from the Authorization header.
 */
function validateAuth(req: Request) {
  const adminPassword = process.env.ADMIN_PASSWORD;
  const authHeader = req.headers.get("Authorization");
  if (!adminPassword) {
    console.error("ADMIN_PASSWORD is not set in environment variables!");
    return false;
  }
  const isValid = authHeader === adminPassword;
  if (!isValid) {
    console.log("Auth failed: Header doesn't match ADMIN_PASSWORD");
  }
  return isValid;
}

/**
 * Saves an uploaded image to Vercel Blob (when configured) or local public uploads.
 */
async function saveUploadedImage(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const parsed = path.parse(file.name || "image");
  const cleanName = parsed.name.replace(/[^a-zA-Z0-9_-]/g, "_") || "image";
  const rawExt = parsed.ext.toLowerCase();
  const ext = ALLOWED_EXTENSIONS.has(rawExt) ? rawExt : (MIME_TO_EXT[file.type] || ".webp");
  const contentType = EXT_TO_MIME[ext] || file.type || "image/webp";

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const filename = `${Date.now()}-${cleanName}${ext}`;
    const blob = await put(`posts/${filename}`, buffer, {
      access: "public",
      contentType,
    });
    return blob.url;
  }

  const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
  const filename = `post-${uniqueSuffix}${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "assets", "uploads");
  try { await fs.access(uploadDir); } catch { await fs.mkdir(uploadDir, { recursive: true }); }
  const filePath = path.join(uploadDir, filename);
  await fs.writeFile(filePath, buffer);
  return `/assets/uploads/${filename}`;
}

export async function POST(req: Request) {
  try {
    if (!validateAuth(req)) {
      return NextResponse.json({ error: "Neautorizat! Parolă incorectă sau lipsă." }, { status: 401 });
    }

    const formData = await req.formData();
    const title = formData.get("title") as string;
    const content = formData.get("content") as string;
    const file = formData.get("image") as File | null;
    const customDate = formData.get("date") as string;

    if (!title || !content) {
      return NextResponse.json({ error: "Titlul și conținutul sunt obligatorii!" }, { status: 400 });
    }

    let imageUrl = "/assets/images/images/bgr.webp";

    if (file && file.size > 0) {
      imageUrl = await saveUploadedImage(file);
    }

    const posts = await getPosts();
    const maxId = posts.length > 0 ? Math.max(...posts.map(p => p.id)) : 0;
    
    const newPost: Post = {
      id: maxId + 1,
      title,
      content,
      imageUrl,
      createdAt: customDate ? new Date(customDate).toISOString() : new Date().toISOString()
    };

    posts.push(newPost);
    await savePosts(posts);

    return NextResponse.json(newPost);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in POST /api/admin/posts:", error);
    return NextResponse.json({ error: `Eroare server: ${message}` }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    if (!validateAuth(req)) {
      return NextResponse.json({ error: "Neautorizat!" }, { status: 401 });
    }

    const formData = await req.formData();
    const idStr = formData.get("id") as string;
    const title = formData.get("title") as string;
    const content = formData.get("content") as string;
    const file = formData.get("image") as File | null;
    const customDate = formData.get("date") as string;

    if (!idStr) {
      return NextResponse.json({ error: "Lipsă ID postare." }, { status: 400 });
    }

    const id = Number(idStr);
    const posts = await getPosts();
    const postIndex = posts.findIndex((p) => p.id === id);

    if (postIndex === -1) {
      return NextResponse.json({ error: "Postarea nu a fost găsită." }, { status: 404 });
    }

    if (!title || !content) {
      return NextResponse.json({ error: "Titlul și conținutul sunt obligatorii!" }, { status: 400 });
    }

    const updatedPost = { ...posts[postIndex], title, content };
    if (customDate) {
      updatedPost.createdAt = new Date(customDate).toISOString();
    }

    if (file && file.size > 0) {
      const newImageUrl = await saveUploadedImage(file);
      await deleteImage(posts[postIndex].imageUrl);
      updatedPost.imageUrl = newImageUrl;
    }

    posts[postIndex] = updatedPost;
    await savePosts(posts);

    return NextResponse.json(updatedPost);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in PUT /api/admin/posts:", error);
    return NextResponse.json({ error: `Eroare server: ${message}` }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    if (!validateAuth(req)) {
      return NextResponse.json({ error: "Neautorizat!" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const idStr = searchParams.get("id");

    if (!idStr) {
      return NextResponse.json({ error: "Lipsă ID postare." }, { status: 400 });
    }

    const id = Number(idStr);
    const posts = await getPosts();
    const postToDelete = posts.find((p) => p.id === id);

    if (!postToDelete) {
      return NextResponse.json({ error: "Postarea nu a fost găsită." }, { status: 404 });
    }

    const updatedPosts = posts.filter((p) => p.id !== id);
    await savePosts(updatedPosts);
    await deleteImage(postToDelete.imageUrl);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in DELETE /api/admin/posts:", error);
    return NextResponse.json({ error: `Eroare server: ${message}` }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    if (validateAuth(req)) {
      return NextResponse.json({ authenticated: true });
    }
    return NextResponse.json({ authenticated: false }, { status: 401 });
  } catch {
    return NextResponse.json({ error: "Eroare server." }, { status: 500 });
  }
}
