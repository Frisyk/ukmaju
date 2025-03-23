"use client"

import { forwardRef, useCallback, useState, type ReactElement } from "react"
import { ArrowDown, ThumbsDown, ThumbsUp } from "lucide-react"

import { cn } from "@/lib/utils"
import { useAutoScroll } from "@/hooks/use-auto-scroll"
import { Button } from "@/components/ui/button"
import { type Message } from "@/components/ui/chat-message"
import { CopyButton } from "@/components/ui/copy-button"
import { MessageInput } from "@/components/ui/message-input"
import { MessageList } from "@/components/ui/message-list"
import { PromptSuggestions } from "@/components/ui/prompt-suggestions"

interface ChatPropsBase {
  handleSubmit: (
    event?: { preventDefault?: () => void },
    options?: { experimental_attachments?: FileList }
  ) => void
  messages: Array<Message>
  input: string
  className?: string
  handleInputChange: React.ChangeEventHandler<HTMLTextAreaElement>
  isGenerating: boolean
  stop?: () => void
  onRateResponse?: (
    messageId: string,
    rating: "thumbs-up" | "thumbs-down"
  ) => void
}

interface ChatPropsWithoutSuggestions extends ChatPropsBase {
  append?: never
  suggestions?: never
}

interface ChatPropsWithSuggestions extends ChatPropsBase {
  append: (message: { role: "user"; content: string }) => void
  suggestions: string[]
}

type ChatProps = ChatPropsWithoutSuggestions | ChatPropsWithSuggestions

export function Chat({
  messages,
  handleSubmit,
  input,
  handleInputChange,
  stop,
  isGenerating,
  append,
  suggestions,
  className,
  onRateResponse,
}: ChatProps) {
  const lastMessage = messages.at(-1)
  const isEmpty = messages.length === 0
  const isTyping = lastMessage?.role === "user"

  const messageOptions = useCallback(
    (message: Message) => ({
      actions: onRateResponse ? (
        <>
          <div className="border-r pr-1">
            <CopyButton
              content={message.content}
              copyMessage="Copied response to clipboard!"
            />
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 text-foreground/70 hover:text-primary"
            onClick={() => onRateResponse(message.id, "thumbs-up")}
          >
            <ThumbsUp className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 text-foreground/70 hover:text-destructive"
            onClick={() => onRateResponse(message.id, "thumbs-down")}
          >
            <ThumbsDown className="h-4 w-4" />
          </Button>
        </>
      ) : (
        <CopyButton
          content={message.content}
          copyMessage="Copied response to clipboard!"
        />
      ),
    }),
    [onRateResponse]
  )

  return (
    <ChatContainer className={className}>
      {/* Visual decorations for dark theme */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden dark:block hidden">
        <div className="absolute -left-20 top-32 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -right-20 top-56 h-96 w-96 rounded-full bg-secondary/20 blur-3xl" />
        <div className="absolute bottom-20 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-accent/20 blur-3xl" />
      </div>

      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto pb-4 mb-2">
          {isEmpty && append && suggestions ? (
            <PromptSuggestions
              label="Coba Prompt berikut ✨"
              append={append}
              suggestions={suggestions}
            />
          ) : null}

          {messages.length > 0 ? (
            <ChatMessages messages={messages}>
              <MessageList
                messages={messages}
                isTyping={isTyping}
                messageOptions={messageOptions}
              />
            </ChatMessages>
          ) : null}
        </div>

        <div className="mt-auto sticky bottom-0 z-10 bg-gradient-to-t from-background/95 via-background/80 to-transparent pt-6 pb-1 backdrop-blur-sm shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)]">
          <ChatForm
            isPending={isGenerating || isTyping}
            handleSubmit={handleSubmit}
          >
            {({ files, setFiles }) => (
              <MessageInput
                value={input}
                onChange={handleInputChange}
                allowAttachments
                files={files}
                setFiles={setFiles}
                stop={stop}
                isGenerating={isGenerating}
              />
            )}
          </ChatForm>
        </div>
      </div>
    </ChatContainer>
  )
}
Chat.displayName = "Chat"

export function ChatMessages({
  messages,
  children,
}: React.PropsWithChildren<{
  messages: Message[]
}>) {
  const {
    containerRef,
    scrollToBottom,
    handleScroll,
    shouldAutoScroll,
    handleTouchStart,
  } = useAutoScroll([messages])

  return (
    <div
      className="grid grid-cols-1 overflow-y-auto px-5 pb-4 scrollbar-thin scrollbar-thumb-primary/30 scrollbar-track-transparent h-full"
      ref={containerRef}
      onScroll={handleScroll}
      onTouchStart={handleTouchStart}
    >
      <div className="max-w-full [grid-column:1/1] [grid-row:1/1]">
        {children}
      </div>

      <div className="flex flex-1 items-end justify-end [grid-column:1/1] [grid-row:1/1]">
        {!shouldAutoScroll && (
          <div className="sticky bottom-0 left-0 flex w-full justify-end">
            <Button
              onClick={scrollToBottom}
              className="h-9 w-9 rounded-full shadow-lg ease-in-out animate-in fade-in-0 slide-in-from-bottom-1 dark:bg-accent/80 dark:text-accent-foreground"
              size="icon"
              variant="ghost"
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export const ChatContainer = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "relative w-full h-full rounded-none sm:rounded-lg border-0 sm:border sm:border-border/40 bg-background/90 dark:bg-background/60 backdrop-blur-sm p-2 sm:p-4 shadow-xl", 
        className
      )}
      {...props}
    />
  )
})
ChatContainer.displayName = "ChatContainer"

interface ChatFormProps {
  className?: string
  isPending: boolean
  handleSubmit: (
    event?: { preventDefault?: () => void },
    options?: { experimental_attachments?: FileList }
  ) => void
  children: (props: {
    files: File[] | null
    setFiles: React.Dispatch<React.SetStateAction<File[] | null>>
  }) => ReactElement
}

export const ChatForm = forwardRef<HTMLFormElement, ChatFormProps>(
  ({ children, handleSubmit, className }, ref) => {
    const [files, setFiles] = useState<File[] | null>(null)

    const onSubmit = (event: React.FormEvent) => {
      if (!files) {
        handleSubmit(event)
        return
      }

      const fileList = createFileList(files)
      handleSubmit(event, { experimental_attachments: fileList })
      setFiles(null)
    }

    return (
      <form ref={ref} onSubmit={onSubmit} className={className}>
        {children({ files, setFiles })}
      </form>
    )
  }
)
ChatForm.displayName = "ChatForm"

function createFileList(files: File[] | FileList): FileList {
  const dataTransfer = new DataTransfer()
  for (const file of Array.from(files)) {
    dataTransfer.items.add(file)
  }
  return dataTransfer.files
}
