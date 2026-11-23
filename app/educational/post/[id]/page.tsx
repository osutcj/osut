import React from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPost, getPosts } from "@/lib/posts";
import PostDetailClient from "@/components/educational/PostDetailClient";

export const dynamic = "force-static";
export const dynamicParams = false;

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  const posts = await getPosts();
  return [...posts.map((post) => ({ id: String(post.id) })), { id: "view" }];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;

  if (id === "view") {
    return {
      title: "Anunț | OSUT te informează",
      description: "Anunț oficial OSUT Cluj.",
    };
  }

  const post = await getPost(id);

  if (!post) {
    return {
      title: "Anunț negăsit | OSUT Cluj",
      description: "Anunțul căutat nu există sau a fost șters.",
    };
  }

  // Strip markdown formatting for a clean plain-text description snippet
  const cleanDescription =
    post.content
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 160) + "...";

  const postUrl = `https://osut.org/educational/post/${post.id}`;
  const imageUrl = post.imageUrl || "/assets/images/images/bgr.webp";

  return {
    title: `${post.title} | OSUT te informează`,
    description: cleanDescription,
    alternates: {
      canonical: postUrl,
    },
    openGraph: {
      title: post.title,
      description: cleanDescription,
      url: postUrl,
      siteName: "OSUT Cluj",
      type: "article",
      publishedTime: post.createdAt,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: cleanDescription,
      images: [imageUrl],
    },
  };
}

export default async function PostPage({ params }: PageProps) {
  const { id } = await params;
  const allPosts = await getPosts();

  if (id === "view") {
    return (
      <PostDetailClient
        initialPost={null}
        initialRelatedPosts={allPosts.slice(0, 3)}
        initialId="view"
      />
    );
  }

  const post = await getPost(id);

  if (!post) {
    notFound();
  }

  const relatedPosts = allPosts.filter((p) => p.id !== post.id).slice(0, 3);

  return (
    <PostDetailClient
      initialPost={post}
      initialRelatedPosts={relatedPosts}
      initialId={String(post.id)}
    />
  );
}
