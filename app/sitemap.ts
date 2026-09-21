import { MetadataRoute } from "next";
import { getPosts } from "@/lib/posts";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://osut.org";

  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/despre-noi",
    "/biroul-de-conducere",
    "/biroul-de-conducere-extins",
    "/educational",
    "/green",
    "/proiecte-si-initiative",
    "/contact",
    "/butonul-rosu",
    "/donat",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: route === "" ? 1 : 0.8,
  }));

  try {
    const posts = await getPosts();
    const postRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
      url: `${baseUrl}/educational/post/${post.id}`,
      lastModified: post.createdAt ? new Date(post.createdAt) : new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));

    return [...staticRoutes, ...postRoutes];
  } catch (err) {
    console.error("Error generating sitemap for posts:", err);
    return staticRoutes;
  }
}
