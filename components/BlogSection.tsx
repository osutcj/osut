"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

interface Post {
  id: number;
  title: string;
  content: string;
  imageUrl: string;
  createdAt: string;
}

export default function BlogSection({
  limit,
  initialPosts = [],
}: {
  limit?: number;
  initialPosts?: Post[];
} = {}) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [loading, setLoading] = useState(initialPosts.length === 0);
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const postsPerPage = 9;

  useEffect(() => {
    // Fetch posts from our API
    fetch(`/api/posts?t=${Date.now()}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setPosts(data);
        } else {
          console.error("API returned non-array data:", data);
          setPosts([]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching posts:", err);
        setLoading(false);
      });
  }, []);

  const handleCopyLink = async (e: React.MouseEvent, post: Post) => {
    e.preventDefault();
    e.stopPropagation();

    const url = `${window.location.origin}/educational/post/${post.id}`;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = url;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopiedId(post.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  return (
    <div className="w-full flex justify-center py-6 mx-auto px-4 max-w-6xl">
      <style>{`
        @keyframes card-in {
          from { opacity: 0; transform: translateY(30px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .blog-card-animate {
          opacity: 0;
          animation: card-in 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {loading ? (
        <p className="text-white text-lg">Se încarcă articolele...</p>
      ) : posts.length === 0 ? (
        <div className="text-center">
          <p className="text-white opacity-50 mb-4">Nu există articole momentan.</p>
        </div>
      ) : (
        <div className="flex flex-col items-center w-full gap-12">
          {/* Posts Grid */}
          <div key={currentPage} className="flex flex-wrap justify-center gap-8 w-full">
            {(limit
              ? posts.slice(0, limit)
              : posts.slice((currentPage - 1) * postsPerPage, currentPage * postsPerPage)
            ).map((post) => {
              const isCopied = copiedId === post.id;
              const formattedDate = new Date(post.createdAt).toLocaleDateString("ro-RO", {
                year: "numeric",
                month: "short",
                day: "numeric",
              });

              return (
                <Link
                  key={post.id}
                  href={`/educational/post/${post.id}`}
                  className="group blog-card-animate w-full md:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1.35rem)] max-w-[380px] bg-[#0f0f0f] rounded-2xl overflow-hidden shadow-lg transition-all duration-300 transform hover:-translate-y-2 hover:shadow-red-950/20 hover:border-red-500/40 border border-white/5 flex flex-col relative"
                >
                  {/* Image Container */}
                  <div className="w-full h-48 sm:h-56 relative overflow-hidden bg-white/10 shrink-0">
                    <Image
                      src={post.imageUrl || "/assets/images/images/bgr.webp"}
                      alt={post.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover rounded-t-2xl m-0 block transition-transform duration-500 group-hover:scale-105"
                    />

                    {/* Quick Copy Link Button */}
                    <button
                      type="button"
                      onClick={(e) => handleCopyLink(e, post)}
                      className={`absolute top-3 right-3 z-10 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 backdrop-blur-md shadow-lg border ${
                        isCopied
                          ? "bg-emerald-600 border-emerald-400 text-white scale-110"
                          : "bg-black/60 hover:bg-red-600 border-white/20 text-white/90 hover:text-white hover:scale-105"
                      }`}
                      title={isCopied ? "Link copiat!" : "Copiază linkul postării"}
                    >
                      <i
                        className={`fa-solid ${
                          isCopied ? "fa-check text-sm" : "fa-link text-xs"
                        }`}
                      ></i>
                    </button>
                  </div>

                  {/* Content Section */}
                  <div className="p-6 flex-grow flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-red-500 font-bold text-xs uppercase tracking-wider">
                          OSUT te informează
                        </span>
                        <span className="text-zinc-600 text-xs">•</span>
                        <span className="text-zinc-400 text-xs font-medium">
                          {formattedDate}
                        </span>
                      </div>
                      <h3 className="text-white font-extrabold text-left text-lg md:text-xl leading-snug line-clamp-3 group-hover:text-red-400 transition-colors">
                        {post.title}
                      </h3>
                    </div>

                    <div className="pt-5 mt-4 border-t border-white/5 flex items-center justify-between text-xs font-semibold text-zinc-400 group-hover:text-red-400 transition-colors">
                      <span>Citește anunțul</span>
                      <i className="fa-solid fa-arrow-right text-xs transition-transform group-hover:translate-x-1"></i>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {!limit && posts.length > postsPerPage && (
            <div className="flex items-center gap-8 mt-4 select-none">
              <button
                onClick={() => {
                  if (currentPage > 1) {
                    setCurrentPage(currentPage - 1);
                    window.scrollTo({
                      top: document.getElementById("blog-anchor")?.offsetTop || 1200,
                      behavior: "smooth",
                    });
                  }
                }}
                disabled={currentPage === 1}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-white hover:bg-red-600 transition-all disabled:opacity-20 disabled:hover:bg-white/5 active:scale-90"
              >
                <i className="fa-solid fa-arrow-left"></i>
              </button>

              <span className="text-white font-medium text-lg tracking-wide">
                Pagina <span className="text-red-500 font-bold">{currentPage}</span> din{" "}
                {Math.ceil(posts.length / postsPerPage)}
              </span>

              <button
                onClick={() => {
                  if (currentPage < Math.ceil(posts.length / postsPerPage)) {
                    setCurrentPage(currentPage + 1);
                    window.scrollTo({
                      top: document.getElementById("blog-anchor")?.offsetTop || 1200,
                      behavior: "smooth",
                    });
                  }
                }}
                disabled={currentPage === Math.ceil(posts.length / postsPerPage)}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-white hover:bg-red-600 transition-all disabled:opacity-20 disabled:hover:bg-white/5 active:scale-90"
              >
                <i className="fa-solid fa-arrow-right"></i>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
