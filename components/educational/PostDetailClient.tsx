"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Post } from "@/lib/posts";
import { renderContent } from "@/lib/renderContent";
import ShareButtons from "@/components/ShareButtons";

interface PostDetailClientProps {
  initialPost: Post | null;
  initialRelatedPosts: Post[];
  initialId: string;
}

export default function PostDetailClient({
  initialPost,
  initialRelatedPosts,
  initialId,
}: PostDetailClientProps) {
  const [post, setPost] = useState<Post | null>(initialPost);
  const [relatedPosts, setRelatedPosts] = useState<Post[]>(initialRelatedPosts);
  const [loading, setLoading] = useState<boolean>(!initialPost);

  useEffect(() => {
    let cancelled = false;

    const loadPost = async () => {
      const match = window.location.pathname.match(/\/educational\/post\/([^/]+)\/?$/);
      const routeId = match ? match[1] : initialId;
      const numericId = parseInt(routeId, 10);

      if (isNaN(numericId)) {
        await Promise.resolve();
        if (!cancelled) setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/posts?t=${Date.now()}`, { cache: "no-store" });
        const data = res.ok ? await res.json() : null;
        if (!cancelled && Array.isArray(data)) {
          const found = data.find((p: Post) => p.id === numericId) || null;
          setPost(found);
          setRelatedPosts(data.filter((p: Post) => p.id !== numericId).slice(0, 3));
          if (found) {
            document.title = `${found.title} | OSUT te informează`;
          }
        }
      } catch (err) {
        console.error("Error fetching post:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadPost();

    return () => {
      cancelled = true;
    };
  }, [initialId]);

  if (!post && loading) {
    return (
      <main className="font-sans min-h-screen pt-36 md:pt-44 pb-24 text-zinc-100 flex flex-col items-center">
        <div className="w-full max-w-4xl px-4 sm:px-6 text-center py-20">
          <p className="text-zinc-400 text-lg">Se încarcă anunțul...</p>
        </div>
      </main>
    );
  }

  if (!post) {
    return (
      <main className="font-sans min-h-screen pt-36 md:pt-44 pb-24 text-zinc-100 flex flex-col items-center">
        <div className="w-full max-w-4xl px-4 sm:px-6">
          <div className="bg-[#141414] border border-white/10 rounded-3xl p-8 sm:p-12 text-center shadow-2xl">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              Anunț negăsit
            </h1>
            <p className="text-zinc-400 mb-8">
              Anunțul căutat nu există sau a fost șters.
            </p>
            <Link
              href="/educational#osut-te-informeaza"
              className="inline-flex items-center gap-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 px-6 py-3 rounded-xl transition-colors"
            >
              <i className="fa-solid fa-arrow-left text-xs"></i>
              <span>Înapoi la OSUT te informează</span>
            </Link>
          </div>
        </div>
      </main>
    );
  }

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
