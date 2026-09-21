"use client";

import React, { useState } from "react";
import Image from "next/image";

interface Post {
  id: number;
  title: string;
  content: string;
  imageUrl: string;
  createdAt: string;
}

/**
 * Parses markdown-style links [text](url) within content and returns React elements.
 */
function renderContent(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(
      <a
        key={match.index}
        href={match[2]}
        target="_blank"
        rel="noopener noreferrer"
        className="text-red-400 hover:text-red-300 underline underline-offset-2 transition-colors"
      >
        {match[1]}
      </a>
    );
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

/**
 * Compresses and resizes an image file in the browser using HTML5 Canvas.
 * Limits maximum dimensions to 1600x1600 while preserving aspect ratio,
 * and encodes to WebP format with quality 0.82.
 */
async function compressImageFile(file: File, maxWidth = 1600, maxHeight = 1600, quality = 0.82): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml" || file.type === "image/gif") {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.createElement("img");
      img.onload = () => {
        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            const cleanBaseName = file.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "_") || "image";
            const compressedFile = new File([blob], `${cleanBaseName}.webp`, {
              type: "image/webp",
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          "image/webp",
          quality
        );
      };

      img.onerror = () => resolve(file);
      img.src = e.target?.result as string;
    };

    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

export default function AdminDashboard() {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);

  // Form State
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [displayDate, setDisplayDate] = useState(new Date().toISOString().split('T')[0]); // Default to today
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isFullPreviewOpen, setIsFullPreviewOpen] = useState(false); // Modal state for full preview
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    
    setLoading(true);
    setErrorMsg("");

    try {
      // Call the verification GET endpoint we just created
      const res = await fetch("/api/admin/posts", {
        headers: {
          "Authorization": password
        }
      });

      if (res.ok) {
        setIsAuthenticated(true);
        fetchPosts();
      } else if (res.status === 401) {
        setErrorMsg("Parolă incorectă! Acces refuzat.");
      } else {
        setErrorMsg(`Eroare de autentificare (${res.status}).`);
      }
    } catch {
      setErrorMsg("Eroare de conexiune la server.");
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = () => {
    fetch(`/api/posts?t=${Date.now()}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setPosts(data);
        } else {
          console.error("API returned non-array data:", data);
          setPosts([]);
        }
      })
      .catch((err) => console.error("Error fetching posts:", err));
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files ? e.target.files[0] : null;
    if (!selected) {
      setImageFile(null);
      return;
    }

    if (selected.size > 25 * 1024 * 1024) {
      setErrorMsg("Imaginea selectată este prea mare (peste 25MB). Te rugăm să alegi o imagine mai mică.");
      e.target.value = "";
      setImageFile(null);
      return;
    }

    setErrorMsg("");
    setIsCompressing(true);
    try {
      const compressed = await compressImageFile(selected);
      setImageFile(compressed);
    } catch {
      setImageFile(selected);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleAddPost = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // 1. If not showing preview yet, show it first
    if (!showPreview) {
      if (!title || !content) {
        setErrorMsg("Titlul și conținutul sunt obligatorii!");
        return;
      }
      setShowPreview(true);
      
      // Handle local image preview
      if (imageFile) {
        const url = URL.createObjectURL(imageFile);
        setPreviewImageUrl(url);
      } else if (editingId) {
        // Find existing image if editing
        const post = posts.find(p => p.id === editingId);
        setPreviewImageUrl(post?.imageUrl || null);
      } else {
        setPreviewImageUrl("/assets/images/images/bgr.webp");
      }
      return;
    }

    // 2. We are in preview mode, proceed to final save
    setLoading(true);
    setErrorMsg("");

    try {
      let finalImageFile = imageFile;
      if (finalImageFile) {
        finalImageFile = await compressImageFile(finalImageFile);
        if (finalImageFile.size > 4 * 1024 * 1024) {
          setErrorMsg("Imaginea este prea mare pentru încărcare (peste 4MB). Te rugăm să alegi o imagine mai mică.");
          setLoading(false);
          return;
        }
      }

      const formData = new FormData();
      formData.append("title", title);
      formData.append("content", content);
      formData.append("date", displayDate);
      
      if (editingId) {
        formData.append("id", String(editingId));
      }

      if (finalImageFile) {
        formData.append("image", finalImageFile);
      }

      const res = await fetch("/api/admin/posts", {
        method: editingId ? "PUT" : "POST",
        headers: {
          "Authorization": password
        },
        body: formData,
      });

      if (!res.ok) {
        if (res.status === 413) {
          setErrorMsg("Fișierul trimis depășește limita serverului (Content Too Large). Te rugăm să alegi o imagine cu dimensiuni mai mici.");
        } else if (res.status === 401) {
          setErrorMsg("Neautorizat! Parolă incorectă sau sesiune expirată.");
        } else {
          try {
            const data = await res.json();
            setErrorMsg(data.error || `Eroare server (${res.status})`);
          } catch {
            setErrorMsg(`Eroare la salvare de pe server (Status: ${res.status}).`);
          }
        }
        return;
      }

      await res.json();
      // Clear inputs on success and grab updated database list
      setTitle("");
      setContent("");
      setDisplayDate(new Date().toISOString().split('T')[0]);
      setImageFile(null);
      setEditingId(null);
      setShowPreview(false);
      if (previewImageUrl && previewImageUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewImageUrl);
      }
      setPreviewImageUrl(null);
      fetchPosts(); 
      showToast("Postarea a fost salvată cu succes! Modificările vor fi vizibile.");
      
      // Reset file input in DOM
      const fileInput = document.getElementById("imageUpload") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    } catch (err) {
      console.error("Error saving post:", err);
      setErrorMsg("Eroare de rețea. Verifică conexiunea.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelPreview = () => {
    setShowPreview(false);
    if (previewImageUrl && previewImageUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewImageUrl);
    }
    setPreviewImageUrl(null);
  };


  const startEditing = (post: Post) => {
    setEditingId(post.id);
    setTitle(post.title);
    setContent(post.content);
    setImageFile(null);
    const fileInput = document.getElementById("imageUpload") as HTMLInputElement;
    if (fileInput) fileInput.value = "";
    
    // Format date for the input (YYYY-MM-DD)
    if (post.createdAt) {
      const dateObj = new Date(post.createdAt);
      setDisplayDate(dateObj.toISOString().split('T')[0]);
    }
    // Optional: Scroll back to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  };


  const handleDelete = async (id: number) => {
    if (!confirm("Sigur dorești să ștergi definitiv această postare?")) return;
    
    // Optimistic UI Update: remove from local state immediately
    const previousPosts = [...posts];
    setPosts(posts.filter(p => p.id !== id));
    setDeletingId(id);

    try {
      const res = await fetch(`/api/admin/posts?id=${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": password
        }
      });
      
      if (res.ok) {
        showToast("Postarea a fost ștearsă cu succes!");
        fetchPosts(); 
      } else {
        let errText = "Eroare la ștergere.";
        try {
          const data = await res.json();
          if (data.error) errText = data.error;
        } catch {
          errText = `Eroare la ștergere (${res.status})`;
        }
        setPosts(previousPosts); // Rollback
        showToast(errText, "error");
      }
    } catch {
      setPosts(previousPosts); // Rollback
      showToast("Eroare de rețea.", "error");
    } finally {
      setDeletingId(null);
    }
  };

  // ----- 1. Login Screen (if not authenticated) -----
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen flex flex-col items-center pt-64 p-4">
        <div className="bg-[#1a1a1a] p-8 md:p-12 rounded-3xl shadow-2xl max-w-md w-full border border-red-500/20 relative overflow-hidden">
          
          {/* Subtle red glow effect behind the form */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-red-600/10 blur-[50px] pointer-events-none"></div>

          <h1 className="text-3xl font-bold text-white mb-2 text-center relative z-10">Admin OSUT</h1>
          <p className="text-gray-400 text-center mb-8 relative z-10">Conectare la baza de date</p>
          
          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-500 px-4 py-3 rounded-xl mb-6 text-sm text-center relative z-10 animate-post-enter">
              {errorMsg}
            </div>
          )}
          
          <form onSubmit={handleLogin} className="flex flex-col gap-4 relative z-10">
            <input
              type="password"
              placeholder="Introdu parola de admin..."
              className="px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-red-500 transition-colors w-full"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-colors w-full tracking-wide shadow-lg shadow-red-600/20 disabled:opacity-50"
            >
              {loading ? "Se verifică..." : "Autentificare"}
            </button>
          </form>
        </div>
      </main>
    );
  }

  // ----- 2. Admin Dashboard (if authenticated) -----
  return (
    <main className="min-h-screen p-4 md:p-8 pb-24 font-sans" style={{ paddingTop: '150px' }}>
      <style>{`
        @keyframes post-fade-in {
          0% { opacity: 0; transform: translateY(-15px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes post-fade-out {
          0% { opacity: 1; transform: translate(0, 0) scale(1); }
          100% { opacity: 0; transform: translate(25px, 0) scale(0.95); }
        }
        @keyframes modal-in {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes modal-out {
          from { opacity: 1; transform: scale(1) translateY(0); }
          to { opacity: 0; transform: scale(0.95) translateY(10px); }
        }
        @keyframes backdrop-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes backdrop-out {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        .animate-post-enter { 
          animation: post-fade-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; 
        }
        .animate-post-leave { 
          animation: post-fade-out 0.4s cubic-bezier(0.5, 0, 0.2, 1) forwards !important; 
        }
        .animate-modal-in { animation: modal-in 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-modal-out { animation: modal-out 0.25s cubic-bezier(0.5, 0, 0.2, 1) forwards; }
        .animate-backdrop-in { animation: backdrop-in 0.25s ease-out forwards; }
        .animate-backdrop-out { animation: backdrop-out 0.25s ease-in forwards; }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
      <div className="max-w-7xl mx-auto">
        
        {/* Toast Notification */}
        {toast && (
          <div className={`fixed top-24 right-6 z-[10001] px-6 py-4 rounded-2xl shadow-2xl animate-modal-in border flex items-center gap-3 transition-all ${
            toast.type === 'success' ? 'bg-green-600/90 border-green-500 text-white' : 'bg-red-600/90 border-red-500 text-white'
          }`}>
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
              <i className={`fas ${toast.type === 'success' ? 'fa-check' : 'fa-exclamation-triangle'} text-xs`}></i>
            </div>
            <p className="font-bold text-sm">{toast.message}</p>
          </div>
        )}

        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight">Postări OSUT te informează</h1>
          </div>
          <button 
            onClick={() => { setIsAuthenticated(false); setPassword(""); }}
            className="bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white px-5 py-2.5 rounded-xl transition-all border border-red-500/20 hover:border-red-600 text-sm font-semibold"
          >
            Deconectare
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* ----- Left Column: ADD POST FORM ----- */}
          <div className="lg:col-span-5 bg-[#1a1a1a] p-6 sm:p-8 rounded-3xl border border-white/5 shadow-2xl h-fit sticky top-28">
            <h2 className="text-2xl font-bold text-white mb-6">
              {editingId ? "Editează articolul" : "Redactează un articol"}
            </h2>
            
            {errorMsg && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-500 px-4 py-3 rounded-xl mb-6 text-sm">
                    {errorMsg}
                </div>
            )}
            
            {showPreview ? (
              <div className="flex flex-col gap-6 animate-post-enter">
                <p className="text-orange-400 font-medium text-sm uppercase tracking-wider bg-orange-500/10 py-2 px-4 rounded-lg border border-orange-500/20 text-center">
                  Mod Previzualizare
                </p>
                
                {/* PREVIEW CARD - Mocking the Ghost UI */}
                <div className="bg-[#0f0f0f] rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex flex-col mx-auto w-full max-w-[380px]">
                  <div className="w-full h-48 relative overflow-hidden bg-white/5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewImageUrl || "/assets/images/images/bgr.webp"}
                      alt="preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-white font-extrabold text-xl leading-tight line-clamp-3 text-center mb-2">
                      {title}
                    </h3>
                    <p className="text-[10px] text-red-500 text-center font-bold uppercase tracking-widest">
                      {new Date(displayDate).toLocaleDateString("ro-RO", { year: 'numeric', month: 'long', day: 'numeric'})}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 mt-4">
                  <button
                    onClick={() => setIsFullPreviewOpen(true)}
                    className="w-full bg-white/10 hover:bg-white/20 text-white font-semibold py-3 rounded-xl transition-all border border-white/10 flex items-center justify-center gap-2"
                  >
                    Vezi Previzualizarea Completă
                  </button>
                  <button
                    onClick={handleCancelPreview}
                    className="w-full bg-white/5 hover:bg-white/10 text-white font-semibold py-3 rounded-xl transition-all border border-white/10"
                  >
                    Înapoi la Editare
                  </button>
                  <button
                    onClick={() => handleAddPost()}
                    disabled={loading}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-green-600/20 flex items-center justify-center gap-2"
                  >
                    {loading ? "Se publică..." : "Confirmă și Publică"}
                  </button>
                  
                </div>
              </div>
            ) : (
              <form onSubmit={handleAddPost} className="flex flex-col gap-5">
              <div>
                <label className="block text-gray-400 mb-2 text-sm font-medium">Titlu Articol*</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-red-500 transition-colors"
                  placeholder="Ex: Noua platformă..."
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-2 text-sm font-medium">
                  {editingId ? "Imagine (opțional)" : "Imagine"}
                </label>
                <input
                  type="file"
                  id="imageUpload"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-red-500 transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-red-600/20 file:text-red-400 hover:file:bg-red-600/30 file:cursor-pointer"
                />
                {isCompressing && (
                  <p className="text-xs text-yellow-400 mt-1.5 animate-pulse">
                    Se optimizează imaginea...
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-gray-400 mb-2 text-sm font-medium">Conținut Articol*</label>
                <textarea
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-red-500 transition-colors min-h-[250px] resize-y leading-relaxed"
                  placeholder="Scrie corpul articolului aici..."
                />
                <p className="text-xs text-gray-500 mt-1.5">
                  💡 Pentru un link: <code className="bg-white/10 px-1.5 py-0.5 rounded text-gray-400">[textul vizibil](https://link.com)</code>
                </p>
              </div>

              <div>
                <label className="block text-gray-400 mb-2 text-sm font-medium">Data Publicării</label>
                <input
                  type="date"
                  value={displayDate}
                  onChange={(e) => setDisplayDate(e.target.value)}
                  className="w-full px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading || isCompressing}
                className={`w-full text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 mt-2 shadow-lg active:scale-[0.98] ${editingId ? 'bg-orange-600 hover:bg-orange-700 shadow-orange-600/20' : 'bg-red-600 hover:bg-red-700 shadow-red-600/20'}`}
              >
                {isCompressing ? "Se optimizează imaginea..." : loading ? "Se salvează în DB..." : (editingId ? "Vezi Previzualizarea Modificărilor" : "Vezi Previzualizarea")}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setTitle("");
                    setContent("");
                    setDisplayDate(new Date().toISOString().split('T')[0]);
                  }}
                  className="w-full text-gray-400 hover:text-white font-semibold py-2 transition-colors text-sm underline"
                >
                  Anulează Editarea
                </button>
              )}
            </form>
            )}
          </div>

          {/* ----- Right Column: EXISTING POSTS LIST ----- */}
          <div className="lg:col-span-7">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Articole Publicate ({posts.length})</h2>
            </div>

            <div className="flex flex-col gap-5 max-h-[780px] overflow-y-auto pr-2 custom-scrollbar">
              {posts.map((post) => (
                <div 
                  key={post.id} 
                  className={`bg-[#1a1a1a] p-5 rounded-2xl border border-white/5 flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between transition-all hover:border-white/10 hover:shadow-lg animate-post-enter ${deletingId === post.id ? 'animate-post-leave' : ''}`}
                >
                  <div className="flex items-center gap-5 flex-grow overflow-hidden w-full">
                    
                    {/* Small preview image */}
                    <div className="w-24 h-24 shrink-0 bg-black/40 rounded-xl overflow-hidden relative">
                      <Image 
                        src={post.imageUrl || "/assets/images/images/bgr.webp"} 
                        alt="thumb" 
                        fill
                        sizes="96px"
                        className="object-cover" 
                      />
                    </div>
                    
                    {/* Details */}
                    <div className="overflow-hidden flex-grow">
                      <h3 className="text-lg font-bold text-white truncate pr-4">{post.title}</h3>
                      <p className="text-sm text-gray-400 mt-1 mb-2">
                        Adăugat pe: {new Date(post.createdAt).toLocaleDateString("ro-RO", { year: 'numeric', month: 'long', day: 'numeric'})}
                      </p>
                      <p className="text-sm text-gray-500 truncate">{post.content.substring(0, 80)}...</p>
                    </div>
                  </div>
                  
                  {/* Actions Container */}
                  <div className="shrink-0 flex sm:flex-col gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                    {/* View Post Link */}
                    <a
                      href={`/educational/post/${post.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 sm:flex-none text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 px-4 py-2.5 rounded-xl transition-colors border border-white/10 font-semibold text-sm text-center flex items-center justify-center gap-1.5"
                    >
                      <span>Vezi</span>
                      <i className="fa-solid fa-arrow-up-right-from-square text-xs"></i>
                    </a>
                    {/* Edit Button */}
                    <button
                      onClick={() => startEditing(post)}
                      className="flex-1 sm:flex-none text-orange-400 hover:text-white bg-orange-500/10 hover:bg-orange-600 px-4 py-2.5 rounded-xl transition-colors border border-orange-500/20 hover:border-orange-600 font-semibold text-sm text-center"
                    >
                      Editează
                    </button>
                    {/* Delete Button */}
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="flex-1 sm:flex-none bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white px-4 py-2.5 rounded-xl transition-colors border border-red-500/20 hover:border-red-600 font-semibold text-sm text-center"
                    >
                      Șterge
                    </button>
                  </div>
                </div>
              ))}
              
              {/* Empty State */}
              {posts.length === 0 && (
                <div className="text-center py-16 bg-[#1a1a1a] rounded-3xl border border-white/5 border-dashed">
                  <p className="text-gray-400 text-lg">Nu ai publicat niciun articol momentan.</p>
                  <p className="text-sm text-gray-600 mt-2">Folosește formularul din stânga pentru a adăuga primul tău articol de blog în baza de date.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* FULL POST PREVIEW MODAL */}
      {isFullPreviewOpen && (
        <div 
          className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-backdrop-in"
          onClick={() => setIsFullPreviewOpen(false)}
        >
          <div 
            className="bg-[#1a1a1a] rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-y-auto shadow-2xl relative border border-white/10 animate-modal-in"
            onClick={(e) => e.stopPropagation()} 
          >
            {/* Close Button */}
            <button 
              onClick={() => setIsFullPreviewOpen(false)}
              className="absolute top-4 right-4 z-50 bg-black/50 hover:bg-red-600 text-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg transition-colors border border-white/20"
            >
              <span className="text-2xl font-bold leading-none mb-1">&times;</span>
            </button>

            {/* Modal Image */}
            <div className="w-full h-64 sm:h-80 md:h-[400px] shrink-0 relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewImageUrl || "/assets/images/images/bgr.webp"}
                  alt="preview"
                  className="w-full h-full object-cover"
                />
            </div>

            {/* Modal Content */}
            <div className="p-8 md:p-12">
              <h2 className="text-2xl md:text-5xl font-extrabold text-white mb-2 leading-tight">
                {title}
              </h2>
              <p className="text-sm md:text-base text-red-500 font-semibold mb-6 uppercase tracking-wider">
                {new Date(displayDate).toLocaleDateString("ro-RO", { year: 'numeric', month: 'long', day: 'numeric'})}
              </p>
              <div className="h-px w-full bg-white/10 mb-6"></div>
              <div className="text-gray-300 text-base md:text-lg leading-relaxed whitespace-pre-wrap">
                {renderContent(content)}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
