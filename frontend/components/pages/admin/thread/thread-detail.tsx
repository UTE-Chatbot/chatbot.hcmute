"use client";

import { useEffect, useState } from "react";
import { getThreadMessages } from "@/services/thread.service";
import { MessageResponse as ThreadMessage } from "@/types/thread"; // Renamed to avoid collision
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse, // The component for rendering markdown
} from "@/components/ai-elements/message";

interface ThreadDetailProps {
  threadId: string;
  onBack: () => void;
}

const getYoutubeId = (url: string) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

const isImageUrl = (url: string) => {
  return /\.(jpeg|jpg|gif|png|webp|svg)$/i.test(url);
};

const MediaContent = ({ children }: { children: string }) => {
  // Regex to split by URLs
  // Capturing group (...) is essential for .split() to include the separators
  const urlRegex = /((?:https?:\/\/[^\s]+))/g;

  const parts = children.split(urlRegex);

  return (
    <div className="flex flex-col gap-2">
      {parts.map((part, index) => {
        if (!part) return null;

        const youtubeId = getYoutubeId(part);
        if (youtubeId) {
          return (
            <div
              key={index}
              className="aspect-video w-full max-w-lg rounded-lg overflow-hidden my-2"
            >
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${youtubeId}`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          );
        }

        if (isImageUrl(part)) {
          return (
            <img
              key={index}
              src={part}
              alt="Content image"
              className="rounded-lg max-w-full h-auto my-2 max-h-[400px] object-contain bg-black/5"
            />
          );
        }

        // Only render text if it's not purely whitespace, OR if it's whitespace between media that matters?
        if (part.trim() === "") return <span key={index}>{part}</span>;

        return <MessageResponse key={index}>{part}</MessageResponse>;
      })}
    </div>
  );
};

export function ThreadDetail({ threadId, onBack }: ThreadDetailProps) {
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setIsLoading(true);
        const data = await getThreadMessages(threadId);
        setMessages(data.messages);
      } catch (err) {
        console.error("Error fetching messages:", err);
        setError("Không thể tải tin nhắn");
      } finally {
        setIsLoading(false);
      }
    };

    if (threadId) {
      fetchMessages();
    }
  }, [threadId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-destructive">{error}</p>
        <Button variant="outline" onClick={onBack}>
          Quay lại
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h2 className="text-lg font-semibold">Chi tiết hội thoại</h2>
      </div>

      <div className="flex-1 min-h-0 border-1 rounded-3xl mt-4 pt-4 flex flex-col relative">
        <Conversation>
          <ConversationContent>
            {messages.map((msg, idx) => {
              const role = msg.role === "human" ? "user" : "assistant";
              return (
                <Message from={role} key={idx}>
                  <MessageContent
                    className={role === "user" ? "!bg-primary !text-white" : ""}
                  >
                    <MediaContent>{msg.content}</MediaContent>
                  </MessageContent>
                </Message>
              );
            })}
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-12">
                Chưa có tin nhắn nào
              </div>
            )}
          </ConversationContent>
          <ConversationScrollButton className="border-1 border-gray-200" />
        </Conversation>
      </div>
    </div>
  );
}
