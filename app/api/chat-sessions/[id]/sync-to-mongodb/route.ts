/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import mongoose from 'mongoose';

import dbConnect from '@/lib/db/connection';
import ChatSession from '@/models/ChatSession';

// Menggunakan tipe yang sama dengan file chat-sessions
interface Message {
  id: string;
  role: string;
  content: string;
  createdAt: string;
}

interface ChatSessionMemory {
  _id: string;
  userId: string;
  title: string;
  messagesCount: number;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

// @ts-expect-error - global augmentation
const MEMORY_STORAGE = global.MEMORY_STORAGE || {
  sessions: new Map<string, ChatSessionMemory>(),
};

// POST /api/chat-sessions/[id]/sync-to-mongodb - Sinkronisasi dari memory storage ke MongoDB
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const resolvedParams = await params;
    const id = resolvedParams.id;
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }
        
    if (!id) {
      return NextResponse.json({ error: 'Missing session ID' }, { status: 400 });
    }
    
    // Pastikan bahwa id adalah UUID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    
    if (!isUUID) {
      return NextResponse.json({ error: 'Invalid UUID format' }, { status: 400 });
    }
    
    // Ambil data dari memory storage
    const memorySession = MEMORY_STORAGE.sessions.get(id);
    
    if (!memorySession) {
      return NextResponse.json({ error: 'Chat session not found in memory' }, { status: 404 });
    }
    
    if (memorySession.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    // Connect ke MongoDB
    await dbConnect();
    
    // Cek apakah sesi sudah ada di MongoDB berdasarkan userId dan title
    let mongoSession = await ChatSession.findOne({
      userId: new mongoose.Types.ObjectId(session.user.id),
      title: memorySession.title,
    });
    
    // Konversi tanggal createdAt ke format yang cocok untuk MongoDB
    const messageObjects = memorySession.messages.map((msg: any) => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      createdAt: new Date(msg.createdAt)
    }));
    
    if (mongoSession) {
      // Update sesi yang sudah ada
      mongoSession.messages = messageObjects;
      mongoSession.messagesCount = messageObjects.length;
      await mongoSession.save();
      
      console.log(`[MongoDB] Sesi "${memorySession.title}" berhasil diupdate dengan ${messageObjects.length} pesan`);
      
      return NextResponse.json({
        success: true,
        action: 'updated',
        _id: mongoSession._id,
        messageCount: messageObjects.length
      });
    } else {
      // Buat sesi baru di MongoDB
      mongoSession = await ChatSession.create({
        userId: new mongoose.Types.ObjectId(session.user.id),
        title: memorySession.title,
        messages: messageObjects,
        messagesCount: messageObjects.length
      });
      
      console.log(`[MongoDB] Sesi "${memorySession.title}" berhasil dibuat dengan ${messageObjects.length} pesan`);
      
      return NextResponse.json({
        success: true,
        action: 'created',
        _id: mongoSession._id,
        messageCount: messageObjects.length
      });
    }
  } catch (error) {
    console.error('Error syncing to MongoDB:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
} 