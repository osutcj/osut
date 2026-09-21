import React from "react";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPost, getPosts } from "@/lib/posts";
import { renderContent } from "@/lib/renderContent";
import ShareButtons from "@/components/ShareButtons";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const post = await getPost(id);

  if (!post) {
    return {
      title: "Anunț negăsit | OSUT Cluj",
      description: "Anunțul căutat nu există sau a fost șters.",
    };
  }

  // Strip markdown formatting for a clean plain-text description snippet
  const cleanDescription = post.content
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
  const post = await getPost(id);

  if (!post) {
    notFound();
  }

  const allPosts = await getPosts();
  const relatedPosts = allPosts.filter((p) => p.id !== post.id).slice(0, 3);

  const formattedDate = new Date(post.createdAt).toLocaleDateString("ro-RO", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <main className="font-sans min-h-screen pt-36 md:pt-44 pb-24 text-zinc-100 flex flex-col items-center">
      <div className="w-full max-w-4xl px-4 sm:px-6">
        
        {/* Navigation / Breadcrumb */}
        <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
          <Link
            href="/educational#osut-te-informeaza"
            className="inline-flex items-center gap-2.5 text-sm font-semibold text-zinc-400 hover:text-white transition-colors group bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl border border-white/10"
          >
            <i className="fa-solid fa-arrow-left text-xs text-red-500 transition-transform duration-200 group-hover:-translate-x-1"></i>
            <span>Înapoi la OSUT te informează</span>
          </Link>

          <ShareButtons
            url={`/educational/post/${post.id}`}
            title={post.title}
          />
        </div>

        {/* Article Container */}
        <article className="bg-[#141414] border border-white/10 rounded-3xl overflow-hidden shadow-2xl p-6 sm:p-10 md:p-12 mb-16">
          
          {/* Header Metadata */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="px-3.5 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-red-600/20 text-red-400 border border-red-500/30">
              OSUT te informează
            </span>
            <span className="text-zinc-500 text-sm">•</span>
            <time dateTime={post.createdAt} className="text-sm font-medium text-red-400/90">
              {formattedDate}
            </time>
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white leading-tight tracking-tight mb-8">
            {post.title}
          </h1>

          {/* Featured Image */}
          <div className="w-full relative rounded-2xl overflow-hidden border border-white/10 shadow-xl mb-10 bg-white/5 aspect-[16/9] max-h-[520px]">
            <Image
              src={post.imageUrl || "/assets/images/images/bgr.webp"}
              alt={post.title}
              fill
              priority
              sizes="(max-width: 896px) 100vw, 896px"
              className="object-cover"
            />
          </div>

          {/* Post Content */}
          <div className="text-zinc-200 text-base sm:text-lg leading-relaxed whitespace-pre-wrap font-normal selection:bg-red-600 selection:text-white">
            {renderContent(post.content)}
          </div>

          {/* Divider */}
          <div className="h-px w-full bg-white/10 my-10"></div>

          {/* Bottom Share Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/5 p-5 sm:p-6 rounded-2xl border border-white/5">
            <div>
              <p className="text-sm font-bold text-white uppercase tracking-wider">
                Ți-a fost util acest anunț?
              </p>
              <p className="text-xs text-zinc-400 mt-0.5">
                Distribuie-l colegilor tăi ca să fie și ei la curent!
              </p>
            </div>
            <ShareButtons
              url={`/educational/post/${post.id}`}
              title={post.title}
            />
          </div>
        </article>

        {/* Related Recent Announcements */}
        {relatedPosts.length > 0 && (
          <section className="w-full mt-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-white uppercase tracking-wide flex items-center gap-3">
                <span className="w-2 h-6 bg-red-600 rounded-full inline-block"></span>
                Alte anunțuri recente
              </h2>
              <Link
                href="/educational#osut-te-informeaza"
                className="text-sm font-semibold text-red-400 hover:text-red-300 transition-colors"
              >
                Vezi toate &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map((related) => (
                <Link
                  key={related.id}
                  href={`/educational/post/${related.id}`}
                  className="group bg-[#141414] rounded-2xl overflow-hidden border border-white/5 hover:border-red-500/40 transition-all duration-300 transform hover:-translate-y-1.5 shadow-lg flex flex-col"
                >
                  <div className="w-full h-44 relative overflow-hidden bg-white/10 shrink-0">
                    <Image
                      src={related.imageUrl || "/assets/images/images/bgr.webp"}
                      alt={related.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-5 flex-grow flex flex-col justify-between">
                    <h3 className="text-white font-bold text-base line-clamp-2 group-hover:text-red-400 transition-colors">
                      {related.title}
                    </h3>
                    <p className="text-xs text-zinc-500 mt-4 font-medium">
                      {new Date(related.createdAt).toLocaleDateString("ro-RO", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
