"use client";

import { useEffect, useState } from "react";
import { useChat, type UseChatOptions } from "ai/react";
import { Bot, MessagesSquare, LogOut } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { toast } from "sonner";

import { Chat } from "@/components/ui/chat";
import { ChatSidebar } from "@/components/chat-sidebar";
import { useChatSessions } from "@/hooks/use-chat-sessions";
import { type Message } from "@/components/ui/chat-message";

type ChatDemoProps = {
  initialMessages?: UseChatOptions["initialMessages"];
  initialId?: string;
};

export function ChatDemo(props: ChatDemoProps) {
  const { data: session } = useSession();
  const [messagesLoaded, setMessagesLoaded] = useState(false);

  const {
    sessions,
    currentSessionId,
    createNewSession,
    updateSession,
    deleteSession,
    switchSession,
    isLoading: sessionsLoading,
  } = useChatSessions(props.initialId);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    append,
    stop,
    isLoading,
    setMessages,
  } = useChat({
    ...props,
    id: currentSessionId || undefined,
    initialMessages: [],
    onError: (err) => {
      console.error("Chat Error:", err);
      toast.error("Terjadi kesalahan saat mengirim pesan");
    },
    onFinish: () => {
      // Update message count in session
      if (currentSessionId) {
        updateSession(currentSessionId, {
          messagesCount: messages.length + 1, // +1 because the last assistant message isn't counted yet
        });

        // Update session title if it's the first assistant message
        if (messages.length === 1 && messages[0].role === "user") {
          const userFirstMessage = messages[0].content;
          const title = userFirstMessage.length > 30
            ? `${userFirstMessage.substring(0, 30)}...`
            : userFirstMessage;
          
          updateSession(currentSessionId, {
            title: title,
          });
        }
        
        // Simpan pesan ke MongoDB setelah menerima respons dari assistant
        // Tunggu sebentar agar pesan assistant terbaru sudah tersimpan di state messages
        setTimeout(() => {
          saveMessagesToDatabase(currentSessionId, messages);
        }, 300); // Tunggu lebih lama untuk pastikan respons assistant sudah lengkap
      }
    },
  });

  // Fungsi untuk meng-override handleSubmit default agar bisa menyimpan pesan user
  const customHandleSubmit = (
    event?: { preventDefault?: () => void } | undefined,
    options?: { experimental_attachments?: FileList | undefined } | undefined
  ) => {
    // Jika ada preventDefault, panggil untuk mencegah refresh halaman
    if (event?.preventDefault) {
      event.preventDefault();
    }
    
    // Panggil handler asli untuk lanjut ke proses chat
    handleSubmit(event, options);
  };

  // Simpan pesan ke MongoDB
  const saveMessagesToDatabase = async (sessionId: string, chatMessages: Message[]) => {
    try {
      // Cari pesan terbaru
      if (chatMessages.length === 0) return;
      
      // Tambahkan ID tracking untuk menghindari duplikasi
      const savedMessageIds = new Set<string>();
      
      // Proses semua pesan yang belum disimpan
      for (const message of chatMessages) {
        // Skip jika pesan sudah pernah disimpan (berdasarkan ID)
        if (savedMessageIds.has(message.id)) continue;
        
        // Catat ID pesan yang akan disimpan
        savedMessageIds.add(message.id);
        
        // Simpan pesan ke MongoDB
        await fetch(`/api/chat-sessions/${sessionId}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message }),
        });
      }
    } catch (error) {
      console.error('Error saving messages:', error);
    }
  };

  // Simpan pesan saat akan berpindah sesi
  useEffect(() => {
    const handleBeforeSessionSwitch = (event: CustomEvent<{ fromSessionId: string | null, toSessionId: string }>) => {
      const { fromSessionId } = event.detail;
      if (fromSessionId && messages.length > 0) {
        saveMessagesToDatabase(fromSessionId, messages);
      }
    };
    
    // Tambahkan event listener untuk event perpindahan sesi
    window.addEventListener('beforeSessionSwitch', handleBeforeSessionSwitch as EventListener);
    
    // Cleanup listener
    return () => {
      window.removeEventListener('beforeSessionSwitch', handleBeforeSessionSwitch as EventListener);
    };
  }, [messages]);

  // Tambahkan useEffect untuk menyimpan pesan sebelum berpindah chat atau menutup halaman
  useEffect(() => {
    // Fungsi untuk menyimpan pesan terakhir
    const saveLatestMessages = () => {
      if (currentSessionId && messages.length > 0) {
        saveMessagesToDatabase(currentSessionId, messages);
      }
    };
    
    // Simpan pesan saat menutup halaman/browser
    window.addEventListener('beforeunload', saveLatestMessages);
    
    // Cleanup listener
    return () => {
      window.removeEventListener('beforeunload', saveLatestMessages);
    };
  }, [currentSessionId, messages]);

  // Tambahkan useEffect untuk menyimpan secara real-time dalam interval waktu
  useEffect(() => {
    if (!currentSessionId || messages.length === 0) return;
    
    // Simpan pesan secara periodik (5 detik)
    const intervalId = setInterval(() => {
      saveMessagesToDatabase(currentSessionId, messages);
    }, 5000);
    
    return () => clearInterval(intervalId);
  }, [currentSessionId, messages]);

  // Load messages dari MongoDB ketika session berubah
  useEffect(() => {
    const fetchMessages = async () => {
      if (!currentSessionId) return;
      
      try {
        setMessagesLoaded(false);
        const response = await fetch(`/api/chat-sessions/${currentSessionId}`);
        
        if (!response.ok) {
          throw new Error('Gagal mengambil riwayat chat');
        }
        
        const data = await response.json();
        
        if (data.messages && Array.isArray(data.messages)) {
          setMessages(data.messages);
        } else {
          setMessages([]);
        }
        setMessagesLoaded(true);
      } catch (error) {
        console.error('Error fetching messages:', error);
        toast.error('Gagal memuat riwayat chat');
        setMessages([]);
        setMessagesLoaded(true);
      }
    };
    
    fetchMessages();
  }, [currentSessionId, setMessages]);

  const handleNewSession = () => {
    createNewSession();
  };

  const handleDeleteSession = (id: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus percakapan ini?")) {
      deleteSession(id);
    }
  };
  
  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <ChatSidebar
        sessions={sessions}
        currentSessionId={currentSessionId}
        onCreateNewSession={handleNewSession}
        onSwitchSession={switchSession}
        onDeleteSession={handleDeleteSession}
        isLoading={sessionsLoading}
      />

      <div className="flex flex-col flex-1 h-screen overflow-hidden">
        {/* Header */}
        <div className="bg-background/80 dark:bg-background/50 backdrop-blur-md border-b border-border/40 p-4 sticky top-0 z-10 shadow-sm">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">UKM Maju</h1>
                <p className="text-xs text-muted-foreground">AI Assistant untuk Pengembangan UKM Indonesia</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="mr-2 text-xs text-muted-foreground">
                {session?.user?.email}
              </div>
              <button
                onClick={handleNewSession}
                className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <MessagesSquare className="h-4 w-4" /> 
                <span>Chat Baru</span>
              </button>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-md bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
              >
                <LogOut className="h-4 w-4" /> 
                <span>Keluar</span>
              </button>
            </div>
          </div>
        </div>

        {/* Chat Container */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full mx-auto max-w-6xl px-0 sm:px-4">
            {messagesLoaded || !currentSessionId ? (
              <Chat
                className="h-full"
                messages={messages}
                handleSubmit={customHandleSubmit}
                input={input}
                handleInputChange={handleInputChange}
                isGenerating={isLoading}
                stop={stop}
                append={append}
                suggestions={[
                  "Buatkan strategi pemasaran digital untuk UMKM makanan di Indonesia.",
                  "Berikan 5 ide bisnis UMKM yang potensial di tahun ini dan cara memulainya.",
                  "Bagaimana cara UMKM meningkatkan penjualan melalui media sosial?",
                  "Buatkan contoh caption menarik untuk promosi produk UMKM di Instagram.",
                  "Apa saja tips mengelola keuangan bagi UMKM agar bisnis tetap berkembang?",
                  "Bagaimana cara UMKM mengakses pendanaan atau pinjaman usaha di Indonesia?",
                  "Bantu saya menyusun rencana bisnis untuk UMKM fashion berbasis online.",
                  "Apa strategi efektif untuk meningkatkan loyalitas pelanggan UMKM?",
                  "Bagaimana cara mendaftarkan merek dagang untuk UMKM di Indonesia?",
                  "Buatkan template email pemasaran untuk UMKM yang ingin menarik pelanggan baru.",
                ]}        
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="animate-pulse text-muted-foreground">Memuat percakapan...</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
