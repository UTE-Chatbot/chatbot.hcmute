"use client";

import { type PromptInputMessage } from "@/components/ai-elements/prompt-input";
import ChatEmptyState from "@/components/pages/chat/chat-empty-state";
import ChatMessageList from "@/components/pages/chat/chat-message-list";
import { MessageType } from "@/components/pages/chat/chat-types";
import { useAuthStore } from "@/stores/auth.store";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useChat } from "@ai-sdk/react";
import { TextStreamChatTransport } from "ai";
import Visitor from "@/lib/visitor";
import { nanoid } from "nanoid";
import { createNewThread } from "@/services/thread.service";

const suggestions = [
  "What are the latest trends in AI?",
  "How does machine learning work?",
  "Explain quantum computing",
  "Best practices for React development",
];

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const Example = () => {
  const { user } = useAuthStore();
  const [useMicrophone, setUseMicrophone] = useState<boolean>(false);
  const [visitorId, setVisitorId] = useState<string | null>(null);
  const [input, setInput] = useState("");

  const [threadId, setThreadId] = useState<string | null>(null);
  const threadIdRef = useRef<string | null>(null);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);

  useEffect(() => {
    const initVisitor = async () => {
      const id = await Visitor.init();
      setVisitorId(id);
    };
    initVisitor();
  }, []);

  useEffect(() => {
    threadIdRef.current = threadId;
    console.log(threadId);
  }, [threadId]);

  const transport = useMemo(() => {
    if (!visitorId) return undefined;

    return new TextStreamChatTransport({
      // api: `${API_URL}/threadsapi/v1/chatk`,
      api: `${API_URL}/threads/${threadId || "placeholder"}/ask`,
      headers: {
        "X-Visitor-Id": visitorId || "",
      },
      credentials: "include",
    });
  }, [threadId, visitorId]);

  const { messages, status, stop, setMessages, sendMessage } = useChat({
    transport,
    id: threadId ?? undefined,
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  useEffect(() => {
    if (threadId && pendingMessage && transport) {
      sendMessage({
        text: pendingMessage,
      });
      setPendingMessage(null);
    }
  }, [threadId, pendingMessage, transport, sendMessage]);

  const handleSubmit = async (message: PromptInputMessage) => {
    if (!message.text) return;

    setInput("");

    if (!threadId) {
      try {
        const thread = await createNewThread();
        console.log("CREATED THREAD: ", thread);
        setThreadId(thread.thread_id);
        setPendingMessage(message.text);
      } catch (e) {
        console.error(e);
        toast.error("Failed to create chat thread");
        setInput(message.text);
        return;
      }
    } else {
      try {
        await sendMessage({
          text: message.text,
        } as any);
      } catch (error) {
        setInput(message.text);
      }
    }
  };

  const handleSuggestionClick = async (suggestion: string) => {
    if (status === "streaming") return;
    await handleSubmit({ text: suggestion } as any);
  };

  const handleNewChat = () => {
    stop();
    setMessages([]);
    setThreadId(null);
    threadIdRef.current = null;
    setInput("");
  };

  return (
    <div className="relative flex size-full flex-col divide-y overflow-hidden bg-background">
      {messages.length === 0 ? (
        <ChatEmptyState
          userFullName={user?.full_name}
          suggestions={suggestions}
          handleSuggestionClick={handleSuggestionClick}
          text={input}
          setText={setInput}
          handleSubmit={handleSubmit}
          status={status}
          useMicrophone={useMicrophone}
          setUseMicrophone={setUseMicrophone}
        />
      ) : (
        <ChatMessageList
          messages={messages}
          suggestions={suggestions}
          handleNewChat={handleNewChat}
          handleSuggestionClick={handleSuggestionClick}
          text={input}
          setText={setInput}
          handleSubmit={handleSubmit}
          status={status}
          useMicrophone={useMicrophone}
          setUseMicrophone={setUseMicrophone}
        />
      )}
    </div>
  );
};

export default Example;
