import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

import dbConnect from '@/lib/db/connection';
import ChatSession from '@/models/ChatSession';
import mongoose from 'mongoose';

// GET /api/chat-sessions/[id] - Mendapatkan sesi chat
export async function GET(
  req: NextRequest,
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
    
    // Cek apakah ID adalah UUID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    
    // Jika UUID, gunakan memory storage
    if (isUUID) {
      // @ts-expect-error - global augmentation
      const chatSession = global.MEMORY_STORAGE?.sessions.get(id);
      
      if (!chatSession) {
        return NextResponse.json({ error: 'Chat session not found' }, { status: 404 });
      }
      
      if (chatSession.userId !== session.user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
      
      return NextResponse.json(chatSession);
    }
    
    // Jika bukan UUID, cek apakah valid ObjectId
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }
    
    await dbConnect();
    
    const chatSession = await ChatSession.findOne({
      _id: id,
      userId: session.user.id
    });
    
    if (!chatSession) {
      return NextResponse.json({ error: 'Chat session not found' }, { status: 404 });
    }
    
    return NextResponse.json(chatSession);
  } catch (error) {
    console.error('Error fetching chat session:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

// PUT /api/chat-sessions/[id] - Mengupdate sesi chat
export async function PUT(
  req: NextRequest,
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
    
    // Cek apakah ID adalah UUID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const data = await req.json();
    
    // Jika UUID, gunakan memory storage
    if (isUUID) {
      // @ts-expect-error - global augmentation
      const chatSession = global.MEMORY_STORAGE?.sessions.get(id);
      
      if (!chatSession) {
        return NextResponse.json({ error: 'Chat session not found' }, { status: 404 });
      }
      
      if (chatSession.userId !== session.user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
      
      const updatedSession = {
        ...chatSession,
        ...data,
        updatedAt: new Date().toISOString()
      };
      
      // @ts-expect-error - global augmentation
      global.MEMORY_STORAGE.sessions.set(id, updatedSession);
      
      return NextResponse.json(updatedSession);
    }
    
    // Jika bukan UUID, pastikan valid ObjectId
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }
    
    await dbConnect();
    
    const chatSession = await ChatSession.findOneAndUpdate(
      { _id: id, userId: session.user.id },
      { $set: data },
      { new: true }
    );
    
    if (!chatSession) {
      return NextResponse.json({ error: 'Chat session not found' }, { status: 404 });
    }
    
    return NextResponse.json(chatSession);
  } catch (error) {
    console.error('Error updating chat session:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

// DELETE /api/chat-sessions/[id] - Menghapus sesi chat
export async function DELETE(
  req: NextRequest,
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
    
    // Cek apakah ID adalah UUID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    
    // Jika UUID, gunakan memory storage
    if (isUUID) {
      // @ts-expect-error - global augmentation
      const chatSession = global.MEMORY_STORAGE?.sessions.get(id);
      
      if (!chatSession) {
        return NextResponse.json({ error: 'Chat session not found' }, { status: 404 });
      }
      
      if (chatSession.userId !== session.user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
      
      // @ts-expect-error - global augmentation
      global.MEMORY_STORAGE.sessions.delete(id);
      
      return NextResponse.json({ success: true });
    }
    
    // Jika bukan UUID, pastikan valid ObjectId
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }
    
    await dbConnect();
    
    const chatSession = await ChatSession.findOneAndDelete({
      _id: id,
      userId: session.user.id
    });
    
    if (!chatSession) {
      return NextResponse.json({ error: 'Chat session not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting chat session:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
} 