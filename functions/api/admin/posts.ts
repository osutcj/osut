import {
  deleteImage,
  getPosts,
  Post,
  savePosts,
  saveUploadedImage,
} from "../../_lib/posts";
import type { PagesContext, PagesEnv } from "../../_lib/types";

/**
 * Helper to validate the admin password from the Authorization header.
 */
function validateAuth(req: Request, env: PagesEnv) {
  const adminPassword = env.ADMIN_PASSWORD;
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

export async function onRequestGet(context: PagesContext) {
  try {
    if (validateAuth(context.request, context.env)) {
      return Response.json({ authenticated: true });
    }
    return Response.json({ authenticated: false }, { status: 401 });
  } catch {
    return Response.json({ error: "Eroare server." }, { status: 500 });
  }
}

export async function onRequestPost(context: PagesContext) {
  try {
    if (!validateAuth(context.request, context.env)) {
      return Response.json(
        { error: "Neautorizat! Parolă incorectă sau lipsă." },
        { status: 401 }
      );
    }

    const formData = await context.request.formData();
    const title = formData.get("title") as string;
    const content = formData.get("content") as string;
    const file = formData.get("image") as File | null;
    const customDate = formData.get("date") as string;

    if (!title || !content) {
      return Response.json(
        { error: "Titlul și conținutul sunt obligatorii!" },
        { status: 400 }
      );
    }

    let imageUrl = "/assets/images/images/bgr.webp";

    if (file && file.size > 0) {
      imageUrl = await saveUploadedImage(file, context.env);
    }

    const posts = await getPosts(context.env, context.request.url);
    const maxId = posts.length > 0 ? Math.max(...posts.map((p) => p.id)) : 0;

    const newPost: Post = {
      id: maxId + 1,
      title,
      content,
      imageUrl,
      createdAt: customDate
        ? new Date(customDate).toISOString()
        : new Date().toISOString(),
    };

    posts.push(newPost);
    await savePosts(posts, context.env);

    return Response.json(newPost);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in POST /api/admin/posts:", error);
    return Response.json({ error: `Eroare server: ${message}` }, { status: 500 });
  }
}

export async function onRequestPut(context: PagesContext) {
  try {
    if (!validateAuth(context.request, context.env)) {
      return Response.json({ error: "Neautorizat!" }, { status: 401 });
    }

    const formData = await context.request.formData();
    const idStr = formData.get("id") as string;
    const title = formData.get("title") as string;
    const content = formData.get("content") as string;
    const file = formData.get("image") as File | null;
    const customDate = formData.get("date") as string;

    if (!idStr) {
      return Response.json({ error: "Lipsă ID postare." }, { status: 400 });
    }

    const id = Number(idStr);
    const posts = await getPosts(context.env, context.request.url);
    const postIndex = posts.findIndex((p) => p.id === id);

    if (postIndex === -1) {
      return Response.json(
        { error: "Postarea nu a fost găsită." },
        { status: 404 }
      );
    }

    if (!title || !content) {
      return Response.json(
        { error: "Titlul și conținutul sunt obligatorii!" },
        { status: 400 }
      );
    }

    const updatedPost = { ...posts[postIndex], title, content };
    if (customDate) {
      updatedPost.createdAt = new Date(customDate).toISOString();
    }

    if (file && file.size > 0) {
      const newImageUrl = await saveUploadedImage(file, context.env);
      await deleteImage(posts[postIndex].imageUrl, context.env);
      updatedPost.imageUrl = newImageUrl;
    }

    posts[postIndex] = updatedPost;
    await savePosts(posts, context.env);

    return Response.json(updatedPost);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in PUT /api/admin/posts:", error);
    return Response.json({ error: `Eroare server: ${message}` }, { status: 500 });
  }
}

export async function onRequestDelete(context: PagesContext) {
  try {
    if (!validateAuth(context.request, context.env)) {
      return Response.json({ error: "Neautorizat!" }, { status: 401 });
    }

    const { searchParams } = new URL(context.request.url);
    const idStr = searchParams.get("id");

    if (!idStr) {
      return Response.json({ error: "Lipsă ID postare." }, { status: 400 });
    }

    const id = Number(idStr);
    const posts = await getPosts(context.env, context.request.url);
    const postToDelete = posts.find((p) => p.id === id);

    if (!postToDelete) {
      return Response.json(
        { error: "Postarea nu a fost găsită." },
        { status: 404 }
      );
    }

    const updatedPosts = posts.filter((p) => p.id !== id);
    await savePosts(updatedPosts, context.env);
    await deleteImage(postToDelete.imageUrl, context.env);

    return Response.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in DELETE /api/admin/posts:", error);
    return Response.json({ error: `Eroare server: ${message}` }, { status: 500 });
  }
}
