import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

// Menggunakan tipe yang sama dengan file chat-sessions
interface Message {
  id: string;
  role: string;
  content: string;
  createdAt: string;
}

interface ChatSession {
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
  sessions: new Map<string, ChatSession>(),
};

// @ts-expect-error - global augmentation
if (!global.MEMORY_STORAGE) {
  // @ts-expect-error - global augmentation
  global.MEMORY_STORAGE = MEMORY_STORAGE;
}

// GET /api/chat-sessions/[id]/messages - Mendapatkan pesan dalam sesi chat
export async function GET(
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
    
    const chatSession = MEMORY_STORAGE.sessions.get(id);
    
    if (!chatSession) {
      return NextResponse.json({ error: 'Chat session not found' }, { status: 404 });
    }
    
    if (chatSession.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    // Return semua pesan
    return NextResponse.json(chatSession.messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

// POST /api/chat-sessions/[id]/messages - Menambah pesan ke sesi chat
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
    
    const chatSession = MEMORY_STORAGE.sessions.get(id);
    
    if (!chatSession) {
      return NextResponse.json({ error: 'Chat session not found' }, { status: 404 });
    }
    
    if (chatSession.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    let body;
    // Handle berbagai jenis konten, termasuk sendBeacon
    const contentType = request.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      body = await request.json();
    } else if (contentType.includes('text/plain')) {
      const text = await request.text();
      try {
        body = JSON.parse(text);
      } catch {
        return NextResponse.json({ error: 'Invalid JSON in text/plain request' }, { status: 400 });
      }
    } else {
      // Asumsi format lain bisa dikonversi ke JSON
      try {
        const text = await request.text();
        body = JSON.parse(text);
      } catch {
        return NextResponse.json({ error: 'Unsupported content type or invalid JSON' }, { status: 400 });
      }
    }
    
    // Handle individual message atau array messages
    if (body.message) {
      // Case lama: single message
      const message = body.message;
      
      if (!message || !message.role || !message.content) {
        return NextResponse.json({ error: 'Message requires role and content' }, { status: 400 });
      }
      
      // Buat pesan baru
      const newMessage: Message = {
        id: message.id || uuidv4(),
        role: message.role,
        content: message.content,
        createdAt: message.createdAt || new Date().toISOString()
      };
      
      // Cek jika pesan dengan ID yang sama sudah ada (mencegah duplikasi)
      const existingMessageIndex = chatSession.messages.findIndex((msg: Message) => msg.id === newMessage.id);
      
      // Jika pesan sudah ada, tidak perlu menambahkan lagi
      if (existingMessageIndex !== -1) {
        return NextResponse.json(chatSession.messages[existingMessageIndex]);
      }
      
      // Tambahkan pesan baru jika belum ada
      chatSession.messages.push(newMessage);
      
    } else if (body.messages && Array.isArray(body.messages)) {
      // Case baru: array messages - mengganti seluruh messages
      const savedMessageIds = new Set<string>();
      
      // Simpan semua ID pesan yang ada untuk mencegah duplikasi
      chatSession.messages.forEach((msg: Message) => {
        savedMessageIds.add(msg.id);
      });
      
      // Hanya tambahkan pesan yang belum ada
      for (const message of body.messages) {
        if (!message.id || !savedMessageIds.has(message.id)) {
          const newMessage: Message = {
            id: message.id || uuidv4(),
            role: message.role,
            content: message.content,
            createdAt: message.createdAt || new Date().toISOString()
          };
          
          chatSession.messages.push(newMessage);
          savedMessageIds.add(newMessage.id);
        }
      }
    } else {
      return NextResponse.json({ error: 'Request must include message or messages array' }, { status: 400 });
    }
    
    // Update metadata chat session
    chatSession.messagesCount = chatSession.messages.length;
    chatSession.updatedAt = new Date().toISOString();
    
    // Update sesi chat
    MEMORY_STORAGE.sessions.set(id, chatSession);
    
    return NextResponse.json({ 
      success: true,
      messagesCount: chatSession.messagesCount
    });
  } catch (error) {
    console.error('Error updating messages:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
} 