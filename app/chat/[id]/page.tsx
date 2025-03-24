import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db/connection";
import ChatSession from "@/models/ChatSession";
import { ChatDemo } from "@/components/chat-demo";
import mongoose from "mongoose";


export default async function ChatPage(  { params }: { params: Promise<{ id: string }> }
) {
  const {id} = await params;
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      redirect("/login");
    }
    
    // Memastikan ID ada
    if (!id) {
      console.error("ID tidak ditemukan");
      redirect("/chat");
    }
    
    console.log("Chat ID:", id); // Debugging ID
    
    // Cek apakah menggunakan ID UUID dari memory storage
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    
    if (isUUID) {
      // Jika UUID, gunakan ChatDemo dengan initialId
      return <ChatDemo initialId={id} />;
    } else {
      // Jika bukan UUID, pastikan valid ObjectId untuk MongoDB
      if (!mongoose.isValidObjectId(id)) {
        console.error("ID bukan format ObjectId MongoDB yang valid");
        redirect("/chat");
      }
      
      await dbConnect();
      
      // Pastikan userId sesuai format ObjectId
      let userId;
      try {
        userId = new mongoose.Types.ObjectId(session.user.id);
      } catch (error) {
        console.error("User ID tidak valid:", error);
        redirect("/chat");
      }
      
      // Memastikan chat session milik user yang login
      const chatSession = await ChatSession.findOne({
        _id: id,
        userId: userId,
      });
      
      if (!chatSession) {
        console.error("Chat session tidak ditemukan");
        redirect("/chat");
      }
      
      return <ChatDemo initialId={id} />;
    }
  } catch (error) {
    console.error("Error in ChatPage:", error);
    redirect("/chat");
  }
} 