import { Metadata } from "next";
import EducationalContent from "./EducationalContent";
import { getPosts } from "@/lib/posts";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Educațional & Studenți Reprezentanți",
  description: "Resurse educaționale, documente utile (Cartă, ECTS, Burse, Taxe) și lista studenților reprezentanți în Senat și Consiliul Facultății.",
  openGraph: {
    title: "Educațional & Reprezentare | OSUT Cluj",
    description: "Tot ce trebuie să știi despre drepturile tale ca student și cine te reprezintă la nivelul UTCN.",
  },
};

export default async function EducationalPage() {
  const posts = await getPosts();
  return <EducationalContent initialPosts={posts} />;
}
