import { put, list, del } from "@vercel/blob";
import { promises as fs } from "fs";
import path from "path";

export interface Post {
  id: number;
  title: string;
  content: string;
  imageUrl: string;
  createdAt: string;
}

const DATA_PATH = "database/posts.json";
const LOCAL_DATA_PATH = path.join(process.cwd(), "public", "assets", "data", "posts.json");
const OLD_PLACEHOLDER = "/assets/images/placeholder.webp";
const PREVIOUS_PLACEHOLDER = "/assets/images/images/no-image.webp";
const NEW_PLACEHOLDER = "/assets/images/images/bgr.webp";

/**
 * Clean post data to fix old placeholder URLs.
 */
function cleanPosts(posts: Post[]): Post[] {
  return posts.map(post => ({
    ...post,
    imageUrl: (post.imageUrl === OLD_PLACEHOLDER || post.imageUrl === PREVIOUS_PLACEHOLDER) 
      ? NEW_PLACEHOLDER 
      : post.imageUrl
  }));
}

/**
 * Fetch all posts from Vercel Blob or local storage.
 */
export async function getPosts(): Promise<Post[]> {
  try {
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      // In production, fetch from Vercel Blob
      const { blobs } = await list({ prefix: DATA_PATH });
      const dbBlob = blobs.find((b) => b.pathname === DATA_PATH);
      
      if (!dbBlob) {
        return [];
      }
      
      const response = await fetch(dbBlob.url, { 
        cache: 'no-store',
        headers: { 'Pragma': 'no-cache' }
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
    } else {
      // Local fallback for development
      try {
        const data = await fs.readFile(LOCAL_DATA_PATH, "utf-8");
        const posts = JSON.parse(data);
        return cleanPosts(Array.isArray(posts) ? posts : []);
      } catch {
        return [];
      }
    }
  } catch (error) {
    console.error("Error in getPosts:", error);
    return [];
  }
}

/**
 * Fetch a single post by ID.
 */
export async function getPost(id: number | string): Promise<Post | null> {
  const numericId = typeof id === "string" ? parseInt(id, 10) : id;
  if (isNaN(numericId)) return null;
  const posts = await getPosts();
  return posts.find((p) => p.id === numericId) || null;
}

/**
 * Save all posts to Vercel Blob or local storage.
 */
export async function savePosts(posts: Post[]): Promise<void> {
  try {
    const sortedPosts = [...posts].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() || b.id - a.id
    );

    const jsonString = JSON.stringify(sortedPosts, null, 2);

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      await put(DATA_PATH, jsonString, {
        access: "public",
        addRandomSuffix: false,
        allowOverwrite: true,
        cacheControlMaxAge: 0,
      });
    } else {
      // Local fallback
      const dir = path.dirname(LOCAL_DATA_PATH);
      try { await fs.access(dir); } catch { await fs.mkdir(dir, { recursive: true }); }
      await fs.writeFile(LOCAL_DATA_PATH, jsonString);
    }
  } catch (error) {
    console.error("Error in savePosts:", error);
    throw error; // Re-throw to handle in the route
  }
}

/**
 * Helper to delete an image if it's stored in Blob or locally.
 */
export async function deleteImage(imageUrl: string): Promise<void> {
  if (!imageUrl || imageUrl === NEW_PLACEHOLDER || imageUrl === OLD_PLACEHOLDER) return;

  try {
    if (imageUrl.includes("public.blob.vercel-storage.com")) {
      await del(imageUrl);
    } else if (imageUrl.startsWith("/assets/uploads/")) {
      const filePath = path.join(process.cwd(), "public", imageUrl);
      try { await fs.unlink(filePath); } catch { /* ignore if already gone */ }
    }
  } catch (e) {
    console.error("Error deleting image:", e);
  }
}
