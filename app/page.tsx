import React from "react";
import "./home.css";
import HeroSection from "@/components/home/HeroSection";
import CounterStats from "@/components/home/CounterStats";
import AwardsTimeline from "@/components/home/AwardsTimeline";
import BlogSection from "@/components/BlogSection";
import HomeProjects from "@/components/home/HomeProjects";
import Link from "next/link";
import { getPosts } from "@/lib/posts";

export const dynamic = "force-dynamic";

export default async function Home() {
  const posts = await getPosts();

  return (
    <main className="main-wrap homepage mx-auto font-sans text-gray-800 dark:text-gray-200">
      <HeroSection />
      <CounterStats />
      
      <div className="content">
        <div id="blog-anchor" className="w-full max-w-5xl flex items-center justify-center mt-24 mb-12 mx-auto px-6 gap-4 md:gap-8">
          <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent to-red-600 opacity-100"></div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-wide text-zinc-900 dark:text-white text-center uppercase leading-tight shrink-0">
            OSUT te <span className="text-red-600">informează</span>
          </h2>
          <div className="h-[2px] flex-1 bg-gradient-to-l from-transparent to-red-600 opacity-100"></div>
        </div>
        
        <BlogSection limit={3} initialPosts={posts} />
        
        <div className="flex justify-center mt-8 mb-16">
          <Link href="/educational" className="bg-[#b51c1c] hover:bg-[#8f1515] text-white font-bold py-3 px-8 rounded-xl transition-all hover:scale-105 shadow-xl hover:shadow-red-900/50">
            Vezi toate anunțurile &rarr;
          </Link>
        </div>
      </div>
      
      <AwardsTimeline />
      <HomeProjects />
    </main>
  );
}
