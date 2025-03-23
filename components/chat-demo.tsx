"use client";

import { useChat, type UseChatOptions } from "ai/react";

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
    <div className="flex max-h-screen py-10 w-full overflow-auto">

      <Chat
        className="grow"
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
  );
}
