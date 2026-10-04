"use client";

import React, { useState, useEffect, useRef, useCallback, useSyncExternalStore } from "react";

// Recruitment deadline: 7 octombrie 2026, ora 22:00
const RECRUITMENT_DEADLINE = new Date("2026-10-07T22:00:00+03:00").getTime();
const STORAGE_KEY = "osut_recruitment_presentation_seen";

const HEADLINE_TEXT = "Transformă-ți anii de studenție într-o experiență de neuitat!";
const BODY_TEXT =
  "Organizația Studenților din Universitatea Tehnică din Cluj-Napoca dă startul recrutărilor și te așteaptă să transformi studenția într-o experiență de neuitat. Dacă vrei să înveți lucruri noi, să ieși din zona de confort și să-ți faci prieteni pe viață, acum e momentul!";

function smoothScrollToCenter(element: HTMLElement, duration: number = 1400) {
  const startY = window.pageYOffset || document.documentElement.scrollTop;
  const rect = element.getBoundingClientRect();
  const targetY = Math.max(0, startY + rect.top - (window.innerHeight - rect.height) / 2);
  const distance = targetY - startY;
  const startTime = performance.now();

  // Temporarily disable CSS smooth scrolling to prevent frame conflicts
  const prevScrollBehavior = document.documentElement.style.scrollBehavior;
  document.documentElement.style.scrollBehavior = "auto";

  function easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function step(currentTime: number) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const ease = easeInOutCubic(progress);

    window.scrollTo(0, startY + distance * ease);

    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      document.documentElement.style.scrollBehavior = prevScrollBehavior;
    }
  }

  requestAnimationFrame(step);
}

function subscribeToStore() {
  return () => {};
}

function checkIsExpired() {
  if (typeof window === "undefined") return Date.now() >= RECRUITMENT_DEADLINE;
  try {
    const searchParams = new URLSearchParams(window.location.search);
    const forceShow =
      searchParams.get("tour") === "1" ||
      searchParams.get("preview_recruitment") === "1" ||
      searchParams.get("recruitment_tour") === "1";
    if (forceShow) return false;
  } catch {
    // Ignore URL parsing errors
  }
  return Date.now() >= RECRUITMENT_DEADLINE;
}

function getServerIsExpired() {
  return Date.now() >= RECRUITMENT_DEADLINE;
}

export default function RecruitmentSection() {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isSpotlightActive, setIsSpotlightActive] = useState(false);
  const isExpired = useSyncExternalStore(subscribeToStore, checkIsExpired, getServerIsExpired);

  const dismissSpotlight = useCallback(() => {
    setIsSpotlightActive(false);
  }, []);

  useEffect(() => {
    if (isExpired) return;

    let alreadySeen = false;
    let forceShow = false;

    try {
      alreadySeen = localStorage.getItem(STORAGE_KEY) === "true";
      const searchParams = new URLSearchParams(window.location.search);
      forceShow =
        searchParams.get("tour") === "1" ||
        searchParams.get("preview_recruitment") === "1" ||
        searchParams.get("recruitment_tour") === "1";
    } catch {
      // Ignore storage/URL parsing errors
    }

    // If presentation has already been seen and not forced, do not trigger scroll or spotlight
    if (alreadySeen && !forceShow) {
      return;
    }

    // Mark as seen immediately so changing pages or subsequent visits won't re-trigger
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // Ignore storage errors
    }

    // 1. Immediately reset scroll position to top on presentation launch
    if (typeof window !== "undefined") {
      if ("scrollRestoration" in window.history) {
        window.history.scrollRestoration = "manual";
      }
      document.documentElement.style.scrollBehavior = "auto";
      window.scrollTo(0, 0);
    }

    // 2. Wait for initial mount / page load screen, then begin cinematic scroll & spotlight
    const timer = setTimeout(() => {
      setIsSpotlightActive(true);

      if (cardRef.current) {
        smoothScrollToCenter(cardRef.current, 1400);
      }
    }, 700);

    return () => clearTimeout(timer);
  }, [isExpired]);

  // Handle ESC key to dismiss spotlight
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isSpotlightActive) {
        dismissSpotlight();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSpotlightActive, dismissSpotlight]);

  if (isExpired) {
    return null;
  }

  return (
    <>
      <style>{`
        @keyframes neon-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes neon-pulse-aura {
          0%, 100% {
            opacity: 0.45;
            transform: scale(0.97);
            filter: blur(80px);
          }
          50% {
            opacity: 0.95;
            transform: scale(1.12);
            filter: blur(115px);
          }
        }
        @keyframes neon-laser-sweep {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes button-shimmer {
          0% { transform: translateX(-100%); }
          40%, 100% { transform: translateX(200%); }
        }
        .animate-neon-beam {
          animation: neon-spin 7s linear infinite;
        }
        .animate-neon-aura {
          animation: neon-pulse-aura 4s ease-in-out infinite;
        }
        .animate-laser {
          animation: neon-laser-sweep 3s ease-in-out infinite;
        }
        .animate-shimmer {
          animation: button-shimmer 4s ease-in-out infinite;
        }
      `}</style>

      {/* Fullscreen Dimmer Backdrop */}
      {isSpotlightActive && (
        <div
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm transition-opacity duration-700 pointer-events-auto cursor-pointer"
          onClick={dismissSpotlight}
          role="dialog"
          aria-modal="true"
          aria-label="Prezentare Recrutări"
        />
      )}

      {/* Main Recruitment Section */}
      <section
        id="recrutari"
        ref={cardRef}
        className={`py-20 px-6 w-full overflow-hidden transition-all duration-700 ${
          isSpotlightActive ? "relative z-50" : "relative z-10"
        }`}
      >
        <div className="max-w-6xl mx-auto">
          {/* Outer Glowing Neon Container */}
          <div className="relative group">
            {/* 1. Pulsing Ambient Neon Aura (Behind Card) */}
            <div
              className={`absolute -inset-8 rounded-[3.5rem] bg-gradient-to-r from-red-600/40 via-[#b51c1c]/60 to-rose-600/40 blur-[90px] pointer-events-none transition-opacity duration-1000 ${
                isSpotlightActive ? "opacity-100 animate-neon-aura" : "opacity-35 group-hover:opacity-75"
              }`}
            ></div>

            {/* 2. Rotating Neon Border Beam */}
            <div
              className={`absolute -inset-[3px] rounded-[2.6rem] overflow-hidden pointer-events-none transition-opacity duration-700 ${
                isSpotlightActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              }`}
            >
              <div className="absolute inset-[-150%] bg-[conic-gradient(from_0deg_at_50%_50%,#dc2626_0deg,#ff1e56_90deg,transparent_180deg,#b51c1c_270deg,#dc2626_360deg)] animate-neon-beam"></div>
            </div>

            {/* 3. Glassmorphic Feature Card Surface */}
            <div className="relative z-20 rounded-[2.5rem] p-8 sm:p-12 md:p-16 bg-[#121212]/95 border border-white/10 shadow-2xl overflow-hidden backdrop-blur-2xl flex flex-col items-center text-center pointer-events-auto">
              {/* Top Laser Accent Sweep */}
              <div className="absolute top-0 left-0 w-full h-[2px] bg-white/10 overflow-hidden pointer-events-none">
                <div className="w-1/2 h-full bg-gradient-to-r from-transparent via-[#ff3b3b] to-transparent shadow-[0_0_15px_#ff0000] animate-laser"></div>
              </div>

              {/* Headline */}
              <h3 className="relative z-10 text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight max-w-3xl mb-6">
                {HEADLINE_TEXT}
              </h3>

              {/* Encouragement Body Text */}
              <p className="relative z-10 text-zinc-300 text-base md:text-lg leading-relaxed max-w-3xl text-justify sm:text-center font-normal mb-10">
                {BODY_TEXT}
              </p>

              {/* Action Button - 100% Reliable Native Link */}
              <div className="relative z-30 flex justify-center pointer-events-auto">
                <a
                  href="https://forms.gle/T2NgwXeh5LeYGdWXA"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative inline-flex items-center justify-center gap-3 bg-[#b51c1c] hover:bg-[#8f1515] text-white font-black py-5 px-10 md:px-14 rounded-2xl transition-all duration-300 hover:scale-105 shadow-[0_0_35px_rgba(181,28,28,0.6)] hover:shadow-[0_0_55px_rgba(220,38,38,0.85)] border border-red-500/50 uppercase tracking-wider text-base md:text-lg cursor-pointer overflow-hidden"
                >
                  {/* Subtle moving shimmer highlight */}
                  <div className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 animate-shimmer pointer-events-none"></div>

                  <span className="relative z-10">Completează formularul de înscriere</span>
                  <i className="fa-solid fa-arrow-up-right-from-square text-sm transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-0.5 relative z-10"></i>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
