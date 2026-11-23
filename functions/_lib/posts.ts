import { del, list, put } from "@vercel/blob";
import type { PagesEnv } from "./types";

export interface Post {
  id: number;
  title: string;
  content: string;
  imageUrl: string;
  createdAt: string;
}

const DATA_PATH = "database/posts.json";
const OLD_PLACEHOLDER = "/assets/images/placeholder.webp";
const PREVIOUS_PLACEHOLDER = "/assets/images/images/no-image.webp";
const NEW_PLACEHOLDER = "/assets/images/images/bgr.webp";

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
 * Clean post data to fix old placeholder URLs.
 */
function cleanPosts(posts: Post[]): Post[] {
  return posts.map((post) => ({
    ...post,
    imageUrl:
      post.imageUrl === OLD_PLACEHOLDER || post.imageUrl === PREVIOUS_PLACEHOLDER
        ? NEW_PLACEHOLDER
        : post.imageUrl,
  }));
}

/**
 * Fetch all posts from Vercel Blob or static asset fallback.
 */
export async function getPosts(env: PagesEnv, requestUrl: string): Promise<Post[]> {
  try {
    if (env.BLOB_READ_WRITE_TOKEN) {
      const { blobs } = await list({
        prefix: DATA_PATH,
        token: env.BLOB_READ_WRITE_TOKEN,
      });
      const dbBlob = blobs.find((b) => b.pathname === DATA_PATH);

      if (!dbBlob) {
        return [];
      }

      const response = await fetch(dbBlob.url, {
        cache: "no-store",
        headers: { Pragma: "no-cache" },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch blob: ${response.statusText}`);
      }

      const text = await response.text();
      try {
        const posts = JSON.parse(text);
        return cleanPosts(Array.isArray(posts) ? posts : []);
      } catch (e) {
        console.error("Malformed JSON in posts.json:", e);
        return [];
      }
    }

    const assetResponse = await env.ASSETS.fetch(new URL("/assets/data/posts.json", requestUrl));
    if (!assetResponse.ok) {
      return [];
    }

    const posts = await assetResponse.json();
    return cleanPosts(Array.isArray(posts) ? posts : []);
  } catch (error) {
    console.error("Error in getPosts:", error);
    return [];
  }
}

/**
 * Fetch a single post by ID.
 */
export async function getPost(
  id: number | string,
  env: PagesEnv,
  requestUrl: string
): Promise<Post | null> {
  const numericId = typeof id === "string" ? parseInt(id, 10) : id;
  if (isNaN(numericId)) return null;
  const posts = await getPosts(env, requestUrl);
  return posts.find((p) => p.id === numericId) || null;
}

/**
 * Save all posts to Vercel Blob.
 */
export async function savePosts(posts: Post[], env: PagesEnv): Promise<void> {
  if (!env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN lipsește din variabilele de mediu Cloudflare Pages.");
  }

  const sortedPosts = [...posts].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() || b.id - a.id
  );

  const jsonString = JSON.stringify(sortedPosts, null, 2);

  await put(DATA_PATH, jsonString, {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 0,
    contentType: "application/json",
    token: env.BLOB_READ_WRITE_TOKEN,
  });
}

/**
 * Save an uploaded image to Vercel Blob.
 */
export async function saveUploadedImage(file: File, env: PagesEnv): Promise<string> {
  if (!env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN lipsește din variabilele de mediu Cloudflare Pages.");
  }

  const rawName = file.name || "image";
  const lastDot = rawName.lastIndexOf(".");
  const basePart = lastDot > 0 ? rawName.slice(0, lastDot) : rawName;
  const extPart = lastDot > 0 ? rawName.slice(lastDot).toLowerCase() : "";

  const cleanName = basePart.replace(/[^a-zA-Z0-9_-]/g, "_") || "image";
  const ext = ALLOWED_EXTENSIONS.has(extPart) ? extPart : MIME_TO_EXT[file.type] || ".webp";
  const contentType = EXT_TO_MIME[ext] || file.type || "image/webp";

  const bytes = await file.arrayBuffer();
  const filename = `${Date.now()}-${cleanName}${ext}`;
  const blob = await put(`posts/${filename}`, bytes, {
    access: "public",
    contentType,
    token: env.BLOB_READ_WRITE_TOKEN,
  });

  return blob.url;
}

/**
 * Helper to delete an image stored in Vercel Blob.
 */
export async function deleteImage(imageUrl: string, env: PagesEnv): Promise<void> {
  if (!imageUrl || imageUrl === NEW_PLACEHOLDER || imageUrl === OLD_PLACEHOLDER) return;

  try {
    if (imageUrl.includes("public.blob.vercel-storage.com") && env.BLOB_READ_WRITE_TOKEN) {
      await del(imageUrl, { token: env.BLOB_READ_WRITE_TOKEN });
    }
  } catch (e) {
    console.error("Error deleting image:", e);
  }
}
