import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

// Define types for storage
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

// In-memory storage untuk development
// @ts-expect-error - global augmentation
const MEMORY_STORAGE = global.MEMORY_STORAGE || {
  sessions: new Map<string, ChatSession>(),
};

// @ts-expect-error - global augmentation
if (!global.MEMORY_STORAGE) {
  // @ts-expect-error - global augmentation
  global.MEMORY_STORAGE = MEMORY_STORAGE;
}

// GET /api/chat-sessions - Mendapatkan semua sesi chat
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }
    
    // Mendapatkan sesi chat dari memory storage
    const userSessions = Array.from(MEMORY_STORAGE.sessions.values())
      .filter((chatSession: unknown) => (chatSession as ChatSession).userId === session.user.id)
      .sort((a: unknown, b: unknown) => 
        new Date((b as ChatSession).updatedAt).getTime() - new Date((a as ChatSession).updatedAt).getTime()
      );
    
    return NextResponse.json(userSessions);
  } catch (error) {
    console.error('Error fetching chat sessions:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

// POST /api/chat-sessions - Membuat sesi chat baru
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }
    
    const { title } = await req.json();
    
    // Membuat sesi chat baru di memory storage
    const newSession: ChatSession = {
      _id: uuidv4(),
      userId: session.user.id,
      title: title || 'Chat Baru',
      messagesCount: 0,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    MEMORY_STORAGE.sessions.set(newSession._id, newSession);
    
    return NextResponse.json(newSession);
  } catch (error) {
    console.error('Error creating chat session:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
} 