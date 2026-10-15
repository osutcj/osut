import type { Metadata } from "next";
import { Geist, Geist_Mono, Poppins } from "next/font/google";
import "./globals.css";
import Header from "../components/footer+header/Header";
import Footer from "../components/footer+header/Footer";
import LoadingScreen from "../components/LoadingScreen";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  preload: false,
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://osut.org"),
  title: {
    default: "OSUT Cluj - Organizația Studenților din UTCN",
    template: "%s | OSUT Cluj",
  },
  description: "Pagina oficială a Organizației Studenților din Universitatea Tehnică din Cluj-Napoca. Reprezentăm interesele studenților și dezvoltăm comunitatea academică.",
  keywords: ["OSUT", "UTCN", "Cluj-Napoca", "studenti", "reprezentare", "voluntariat", "evenimente"],
  authors: [{ name: "OSUT Cluj" }],
  creator: "OSUT Cluj",
  publisher: "OSUT Cluj",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: "/assets/images/images/Cometa rosie.webp",
    apple: "/assets/images/images/Cometa rosie.webp",
  },
  openGraph: {
    type: "website",
    locale: "ro_RO",
    url: "https://osut.org",
    siteName: "OSUT Cluj",
    title: "OSUT Cluj - Organizația Studenților din UTCN",
    description: "Reprezentăm studenții Universității Tehnice din Cluj-Napoca. Află mai multe despre proiectele și inițiativele noastre.",
    images: [
      {
        url: "/assets/images/images/OSUT Color.webp",
        width: 1200,
        height: 630,
        alt: "OSUT Cluj Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "OSUT Cluj - Organizația Studenților din UTCN",
    description: "Reprezentăm studenții Universității Tehnice din Cluj-Napoca.",
    images: ["/assets/images/images/OSUT Color.webp"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://osut.org",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ro" className="dark" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.6.0/css/all.min.css" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${poppins.variable} antialiased text-zinc-100 min-h-screen relative`}
        suppressHydrationWarning
      >
        {/* Global Pattern Background */}
        <div className="fixed inset-0 z-[-1] pointer-events-none bg-[#121212] overflow-hidden">
          <style>{`
            @keyframes flow1 {
              0% { transform: translate(0, 0) scale(1); }
              33% { transform: translate(30vw, 20vh) scale(1.2); }
              66% { transform: translate(-20vw, 30vh) scale(0.8); }
              100% { transform: translate(0, 0) scale(1); }
            }
            @keyframes flow2 {
              0% { transform: translate(0, 0) scale(1); }
              33% { transform: translate(-30vw, -30vh) scale(0.8); }
              66% { transform: translate(20vw, -20vh) scale(1.2); }
              100% { transform: translate(0, 0) scale(1); }
            }
            @keyframes flow3 {
              0% { transform: translate(0, 0) scale(1); }
              33% { transform: translate(40vw, -10vh) scale(1.3); }
              66% { transform: translate(-30vw, 20vh) scale(0.7); }
              100% { transform: translate(0, 0) scale(1); }
            }
            .animate-flow1 { animation: flow1 10s infinite ease-in-out; }
            .animate-flow2 { animation: flow2 12s infinite ease-in-out; }
            .animate-flow3 { animation: flow3 14s infinite ease-in-out; }
          `}</style>
          
          {/* Animated Glows - Subtler opacity without mix-blend-screen to prevent bright overlap */}
          <div className="absolute top-[-10%] left-[10%] w-[40vw] h-[40vw] bg-red-600/10 blur-[120px] rounded-full animate-flow1"></div>
          <div className="absolute top-[30%] right-[10%] w-[35vw] h-[35vw] bg-red-600/10 blur-[100px] rounded-full animate-flow2"></div>
          <div className="absolute bottom-[0%] left-[40%] w-[45vw] h-[45vw] bg-red-600/10 blur-[130px] rounded-full animate-flow3"></div>

          {/* Diagonal Mesh (Diamond) Pattern */}
          <div 
            className="absolute inset-0 opacity-[0.4]" 
            style={{
              backgroundImage: `repeating-linear-gradient(45deg, rgba(220, 38, 38, 0.15) 0, rgba(220, 38, 38, 0.15) 1px, transparent 1px, transparent 40px), repeating-linear-gradient(-45deg, rgba(220, 38, 38, 0.15) 0, rgba(220, 38, 38, 0.15) 1px, transparent 1px, transparent 40px)`
            }}
          ></div>
          
          {/* Vignette Fade - more transparent so glows are highly visible */}
          <div 
            className="absolute inset-0 pointer-events-none" 
            style={{
              background: 'radial-gradient(ellipse at 50% 50%, transparent 20%, #121212 110%)'
            }}
          ></div>
        </div>
          <LoadingScreen />
          <Header />
          {children}
          {process.env.VERCEL === "1" && (
            <>
              <Analytics />
              <SpeedInsights />
            </>
          )}
          <Footer />
      </body>
    </html>
  );
}
