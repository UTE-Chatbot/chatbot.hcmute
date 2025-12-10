"use client";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInputTextarea,
  PromptInputSubmit,
  PromptInput,
  PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import { MessageSquare } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { Input } from "@/components/ui/input";
import { TextStreamChatTransport } from "ai";
const ConversationDemo = () => {
  const [input, setInput] = useState("");

  const { messages, status, stop, setMessages, sendMessage } = useChat({
    transport: new TextStreamChatTransport({
      api: process.env.NEXT_PUBLIC_API_URL + "/threadsapi/v1/chatk",
    }),
    onError: (error) => {
      // toast.error(`Error: ${error.message}`);
    },
  });

  const handleSubmit = (
    message: PromptInputMessage,
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    if (message.text.trim()) {
      sendMessage({ text: message.text });
      setInput("");
    }
  };

  useEffect(() => {
    console.log(messages);
  }, [messages]);
  return (
    <div className="max-w-4xl mx-auto p-6 relative size-full rounded-lg border h-[600px]">
      <div className="flex flex-col h-full">
        <Conversation>
          <ConversationContent>
            {messages.length === 0 ? (
              <ConversationEmptyState
                icon={<MessageSquare className="size-12" />}
                title="Start a conversation"
                description="Type a message below to begin chatting"
              />
            ) : (
              messages.map((message) => (
                <Message from={message.role} key={message.id}>
                  <MessageContent>
                    {message.parts.map((part, i) => {
                      switch (part.type) {
                        case "text": // we don't use any reasoning or tool calls in this example
                          return (
                            <MessageResponse key={`${message.id}-${i}`}>
                              {part.text}
                            </MessageResponse>
                          );
                        default:
                          return null;
                      }
                    })}
                  </MessageContent>
                </Message>
              ))
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
        <PromptInput
          onSubmit={handleSubmit}
          className="mt-4 w-full max-w-2xl mx-auto relative"
        >
          <PromptInputTextarea
            value={input}
            placeholder="Say something..."
            onChange={(e) => setInput(e.currentTarget.value)}
            className="pr-12"
          />
          <PromptInputSubmit
            status={status === "streaming" ? "streaming" : "ready"}
            disabled={!input.trim()}
            className="absolute bottom-1 right-1"
          />
        </PromptInput>
      </div>
    </div>
  );
};
export default ConversationDemo;
