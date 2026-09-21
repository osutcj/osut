"use client";

import React, { useState, useEffect } from "react";

interface ShareButtonsProps {
  url?: string;
  title: string;
  className?: string;
}

export default function ShareButtons({ url, title, className = "" }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(url || "");

  useEffect(() => {
    if (!url && typeof window !== "undefined") {
      setCurrentUrl(window.location.href);
    } else if (url) {
      if (url.startsWith("http")) {
        setCurrentUrl(url);
      } else if (typeof window !== "undefined") {
        setCurrentUrl(`${window.location.origin}${url}`);
      }
    }
  }, [url]);

  useEffect(() => {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      setCanNativeShare(true);
    }
  }, []);

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const targetUrl = currentUrl || (typeof window !== "undefined" ? window.location.href : "");
    if (!targetUrl) return;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(targetUrl);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = targetUrl;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  const handleNativeShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          url: currentUrl,
        });
      } catch (err) {
        // User cancelled or share failed, silently ignore
      }
    }
  };

  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${title} - ${currentUrl}`)}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`;

  return (
    <div className={`flex flex-wrap items-center gap-2.5 ${className}`}>
      {/* Copy Link Button */}
      <button
        type="button"
        onClick={handleCopyLink}
        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-semibold text-sm transition-all duration-200 border shadow-md active:scale-95 ${
          copied
            ? "bg-emerald-600 border-emerald-500 text-white"
            : "bg-white/5 hover:bg-white/10 border-white/10 text-white hover:border-white/20"
        }`}
        title="Copiază linkul postării"
      >
        <i className={`fa-solid ${copied ? "fa-check" : "fa-link"} text-xs text-red-500 ${copied ? "!text-white" : ""}`}></i>
        <span>{copied ? "Link copiat!" : "Copiază link"}</span>
      </button>

      {/* WhatsApp Button */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="flex items-center gap-2 px-3.5 py-2 rounded-xl font-semibold text-sm bg-white/5 hover:bg-[#25D366]/20 border border-white/10 hover:border-[#25D366]/40 text-white hover:text-[#25D366] transition-all duration-200 shadow-md active:scale-95"
        title="Distribuie pe WhatsApp"
      >
        <i className="fa-brands fa-whatsapp text-sm text-[#25D366]"></i>
        <span className="hidden sm:inline">WhatsApp</span>
      </a>

      {/* Facebook Button */}
      <a
        href={facebookUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="flex items-center gap-2 px-3.5 py-2 rounded-xl font-semibold text-sm bg-white/5 hover:bg-[#1877F2]/20 border border-white/10 hover:border-[#1877F2]/40 text-white hover:text-[#1877F2] transition-all duration-200 shadow-md active:scale-95"
        title="Distribuie pe Facebook"
      >
        <i className="fa-brands fa-facebook text-sm text-[#1877F2]"></i>
        <span className="hidden sm:inline">Facebook</span>
      </a>

      {/* Native Web Share Button (if available) */}
      {canNativeShare && (
        <button
          type="button"
          onClick={handleNativeShare}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl font-semibold text-sm bg-red-600 hover:bg-red-700 border border-red-500 text-white transition-all duration-200 shadow-md active:scale-95 sm:hidden"
          title="Distribuie"
        >
          <i className="fa-solid fa-share-nodes text-xs"></i>
          <span>Distribuie</span>
        </button>
      )}
    </div>
  );
}
