"use client"

import { useState } from "react"
import { 
  MessageSquarePlus, 
  MessageSquare, 
  Trash2, 
  Menu,
  X,
  Loader2
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { id } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ChatSession } from "@/hooks/use-chat-sessions"
import { ThemeToggle } from "@/components/theme-toggle"

interface ChatSidebarProps {
  sessions: ChatSession[]
  currentSessionId: string | null
  onCreateNewSession: () => void
  onSwitchSession: (id: string) => void
  onDeleteSession: (id: string) => void
  isLoading?: boolean
  className?: string
}

export function ChatSidebar({
  sessions,
  currentSessionId,
  onCreateNewSession,
  onSwitchSession,
  onDeleteSession,
  isLoading = false,
  className,
}: ChatSidebarProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <>
      {/* Mobile menu toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setSidebarOpen(true)}
        className="absolute left-2 top-3 z-30 md:hidden"
        aria-label="Menu"
      >
        <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
      </Button>

      <div 
        className={cn(
          "fixed inset-0 z-40 bg-background/80 backdrop-blur-sm transition-opacity md:hidden", 
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setSidebarOpen(false)}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-full w-64 flex-col border-r bg-background transition-transform duration-300 md:relative md:translate-x-0 md:z-40",
          sidebarOpen ? "translate-x-0 shadow-xl" : "-translate-x-full",
          className
        )}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between border-b p-3 sm:p-4">
          <h2 className="text-base sm:text-lg font-semibold">Chat</h2>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(false)}
              className="md:hidden h-8 w-8"
              aria-label="Tutup menu"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex h-full flex-col">
          <div className="p-2 sm:p-3">
            <Button
              onClick={() => {
                onCreateNewSession();
                setSidebarOpen(false);
              }}
              variant="outline"
              className="w-full justify-start gap-2 border-dashed border-border/60 dark:bg-muted/20 dark:hover:bg-muted/30 text-xs sm:text-sm py-2"
            >
              <MessageSquarePlus className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>Percakapan Baru</span>
            </Button>
          </div>

          <div className="flex-1 overflow-auto py-2 px-2 sm:px-3">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-32 text-center p-4 text-muted-foreground">
                <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 mb-2 animate-spin" />
                <p className="text-xs sm:text-sm">Memuat riwayat percakapan...</p>
              </div>
            ) : sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-3 sm:p-4 text-muted-foreground">
                <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8 mb-2 opacity-50" />
                <p className="text-xs sm:text-sm">Belum ada riwayat percakapan</p>
                <p className="text-[10px] sm:text-xs mt-1">Mulai percakapan baru dengan AI.</p>
              </div>
            ) : (
              <ul className="space-y-1 sm:space-y-2">
                {sessions
                  .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                  .map((session) => (
                    <li key={session._id}>
                      <div
                        className={cn(
                          "flex items-center justify-between rounded-lg p-2 text-xs sm:text-sm transition-colors hover:bg-muted/50 cursor-pointer group",
                          currentSessionId === session._id && "bg-accent/20 hover:bg-accent/30"
                        )}
                      >
                        <div
                          className="flex-1 mr-2 overflow-hidden"
                          onClick={() => {
                            onSwitchSession(session._id);
                            setSidebarOpen(false);
                          }}
                        >
                          <div className="font-medium truncate">{session.title}</div>
                          <div className="text-[10px] sm:text-xs text-muted-foreground flex items-center">
                            <span className="truncate">
                              {formatDistanceToNow(new Date(session.updatedAt), { 
                                addSuffix: true,
                                locale: id 
                              })}
                            </span>
                            <span className="mx-1 text-[8px] sm:text-xs">•</span>
                            <span>{session.messagesCount} pesan</span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 sm:h-7 sm:w-7 opacity-0 group-hover:opacity-100"
                          onClick={() => onDeleteSession(session._id)}
                          aria-label="Hapus"
                        >
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        </div>
      </aside>
    </>
  )
} 