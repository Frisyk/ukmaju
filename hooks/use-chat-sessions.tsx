"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { toast } from "sonner"

export type ChatSession = {
  _id: string
  title: string
  createdAt: string
  updatedAt: string
  messagesCount: number
}

export function useChatSessions(initialId?: string) {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(initialId || null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const { status } = useSession()
  const isAuthenticated = status === "authenticated"

  // Mendapatkan sesi chat dari API
  const fetchSessions = async () => {
    if (!isAuthenticated) return;

    try {
      setIsLoading(true);
      const response = await fetch('/api/chat-sessions');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Terjadi kesalahan saat mengambil data chat');
      }
      
      const data = await response.json();
      setSessions(data);
    } catch (error) {
      console.error('Error fetching chat sessions:', error);
      toast.error('Gagal memuat riwayat chat');
    } finally {
      setIsLoading(false);
    }
  };

  // Load chat sessions dari API ketika user sudah login
  useEffect(() => {
    if (isAuthenticated) {
      fetchSessions();
    }
  }, [isAuthenticated]);

  const createNewSession = useCallback(async () => {
    if (!isAuthenticated) {
      toast.error('Silakan login terlebih dahulu');
      router.push('/login');
      return null;
    }

    try {
      const response = await fetch('/api/chat-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Chat Baru',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal membuat chat baru');
      }

      const newSession = await response.json();
      setSessions((prev) => [newSession, ...prev]);
      setCurrentSessionId(newSession._id);
      router.push(`/chat/${newSession._id}`);
      return newSession._id;
    } catch (error) {
      console.error('Error creating new session:', error);
      toast.error('Gagal membuat chat baru');
      return null;
    }
  }, [isAuthenticated, router]);

  // Set current session ID dari URL atau initialId
  useEffect(() => {
    if (initialId) {
      setCurrentSessionId(initialId);
    } else if (pathname === "/chat") {
      // Jika berada di halaman chat tanpa ID, arahkan ke sesi yang tersedia atau buat baru
      if (sessions.length > 0 && !currentSessionId) {
        const lastSession = sessions[0]; // Paling baru berdasarkan sorting dari API
        setCurrentSessionId(lastSession._id);
        router.push(`/chat/${lastSession._id}`);
      } else if (!isLoading && isAuthenticated && sessions.length === 0 && !currentSessionId) {
        // Buat sesi baru jika tidak ada sesi yang tersedia dan sudah login
        createNewSession();
      }
    }
  }, [pathname, initialId, sessions, isLoading, isAuthenticated, router, currentSessionId, createNewSession]);

  const updateSession = async (id: string, updates: Partial<ChatSession>) => {
    try {
      const response = await fetch(`/api/chat-sessions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal mengupdate chat');
      }

      const updatedSession = await response.json();
      setSessions((prev) =>
        prev.map((session) =>
          session._id === id ? updatedSession : session
        )
      );
    } catch (error) {
      console.error('Error updating session:', error);
      toast.error('Gagal mengupdate chat');
    }
  };

  const deleteSession = async (id: string) => {
    try {
      const response = await fetch(`/api/chat-sessions/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal menghapus chat');
      }

      setSessions((prev) => prev.filter((session) => session._id !== id));
      
      if (currentSessionId === id) {
        const remainingSessions = sessions.filter((session) => session._id !== id);
        if (remainingSessions.length > 0) {
          const nextSession = remainingSessions[0];
          setCurrentSessionId(nextSession._id);
          router.push(`/chat/${nextSession._id}`);
        } else {
          createNewSession();
        }
      }
      
      toast.success('Chat berhasil dihapus');
    } catch (error) {
      console.error('Error deleting session:', error);
      toast.error('Gagal menghapus chat');
    }
  };

  const switchSession = (id: string) => {
    // Dispatch event untuk memberi tahu komponen lain bahwa akan terjadi perpindahan sesi
    // Komponen lain seperti ChatDemo dapat menangkap event ini dan menyimpan pesan saat ini
    window.dispatchEvent(new CustomEvent('beforeSessionSwitch', { 
      detail: { fromSessionId: currentSessionId, toSessionId: id } 
    }));
    
    // Beri waktu sedikit untuk event handler dieksekusi
    setTimeout(() => {
      setCurrentSessionId(id);
      router.push(`/chat/${id}`);
    }, 100);
  };

  return {
    sessions,
    currentSessionId,
    isLoading,
    createNewSession,
    updateSession,
    deleteSession,
    switchSession,
    fetchSessions,
  };
} 