"use client";

import { useChat, type UseChatOptions } from "ai/react";
import { Bot, MessagesSquare } from "lucide-react";

import { Chat } from "@/components/ui/chat";
// import { useRouter } from "next/navigation";

type ChatDemoProps = {
  initialMessages?: UseChatOptions["initialMessages"];
};

export function ChatDemo(props: ChatDemoProps) {
  // const router = useRouter(); // Inisialisasi router
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    append,
    stop,
    isLoading,
  } = useChat({
    ...props,
    onError: (err) => console.error("Chat Error:", err),
  });

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden">
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
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1 text-primary">
              <MessagesSquare className="h-4 w-4" /> 
              <span>{messages.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full mx-auto max-w-6xl px-0 sm:px-4">
          <Chat
            className="h-full"
            messages={messages}
            handleSubmit={handleSubmit}
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
        </div>
      </div>
    </div>
  );
}
