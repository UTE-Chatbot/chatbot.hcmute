import React, { useEffect } from "react";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  MessageBranch,
  MessageBranchContent,
  MessageBranchNext,
  MessageBranchPage,
  MessageBranchPrevious,
  MessageBranchSelector,
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from "@/components/ai-elements/sources";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import { PlusIcon } from "lucide-react";
import Loader from "@/components/ui/loader";
import { useStickToBottomContext } from "use-stick-to-bottom";
import ChatPromptInput from "@/components/pages/chat/prompt-input";
import { type PromptInputMessage } from "@/components/ai-elements/prompt-input";
import { UIMessage } from "ai";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { type SuggestionItem } from "@/components/pages/chat/chat-types";

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
        // Usually markdown handles whitespace fine.
        // We use MessageResponse for the text chunks.
        if (part.trim() === "") return <span key={index}>{part}</span>;

        return <MessageResponse key={index}>{part}</MessageResponse>;
      })}
    </div>
  );
};

const AutoScrollHandler = ({ messages }: { messages: UIMessage[] }) => {
  const { scrollToBottom } = useStickToBottomContext();

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages.length, scrollToBottom]);

  return null;
};

interface ChatMessageListProps {
  messages: UIMessage[];
  suggestions: SuggestionItem[];
  handleNewChat: () => void;
  handleSuggestionClick: (suggestion: string) => void;
  text: string;
  setText: (text: string) => void;
  handleSubmit: (message: PromptInputMessage) => void;
  status: "submitted" | "streaming" | "ready" | "error";
  useMicrophone: boolean;
  setUseMicrophone: (use: boolean) => void;
}

const ChatMessageList = ({
  messages,
  suggestions,
  handleNewChat,
  handleSuggestionClick,
  text,
  setText,
  handleSubmit,
  status,
  useMicrophone,
  setUseMicrophone,
}: ChatMessageListProps) => {
  return (
    <>
      <Conversation>
        <AutoScrollHandler messages={messages} />
        <ConversationContent>
          {messages.map((message) => {
            const isAssistant = message.role === "assistant";
            // Check if there is at least one text part with content
            const hasContent = message.parts.some(
              (part) => part.type === "text" && part.text.trim() !== ""
            );

            if (isAssistant && !hasContent) {
              return null;
            }

            return (
              <Message from={message.role} key={message.id}>
                <MessageContent
                  className={`${
                    message.role === "user" ? "!bg-primary !text-white" : ""
                  }`}
                >
                  {message.parts.map((part, i) => {
                    switch (part.type) {
                      case "text":
                        return (
                          <MediaContent key={`${message.id}-${i}`}>
                            {part.text}
                          </MediaContent>
                        );
                      default:
                        return null;
                    }
                  })}
                </MessageContent>
              </Message>
            );
          })}

          {(status === "submitted" ||
            (status === "streaming" &&
              (messages[messages.length - 1]?.role === "user" ||
                (messages[messages.length - 1]?.role === "assistant" &&
                  !messages[messages.length - 1]?.parts.some(
                    (part) => part.type === "text" && part.text.trim() !== ""
                  ))))) && (
            <Message from="assistant" key="loading">
              <div className="flex h-full items-center gap-2">
                <Loader className="h-auto w-auto" spinnerClassName="h-4 w-4" />
                <span className="text-muted-foreground text-sm ">
                  <Shimmer>Mình đang suy nghĩ</Shimmer>
                </span>
              </div>
            </Message>
          )}
        </ConversationContent>
        <ConversationScrollButton className="border-1 border-gray-200" />
      </Conversation>
      <div className="grid shrink-0 gap-4 pt-4">
        <Suggestions className="px-4">
          <Suggestion
            className="text-white bg-primary hover:bg-primary/90 hover:!text-white"
            onClick={handleNewChat}
            suggestion="Cuộc trò chuyện mới"
          >
            <PlusIcon className="mr-2 size-4" />
            Cuộc trò chuyện mới
          </Suggestion>
          {suggestions.map((suggestion) => (
            <Suggestion
              key={suggestion.key}
              onClick={() => handleSuggestionClick(suggestion.description)}
              suggestion={suggestion.description}
              className="h-auto py-2"
            >
              <div className="flex items-center gap-2">
                {suggestion.icon}
                <span>{suggestion.description}</span>
              </div>
            </Suggestion>
          ))}
        </Suggestions>
        <div className="w-full px-4 pb-4">
          <ChatPromptInput
            text={text}
            setText={setText}
            onSubmit={handleSubmit}
            status={status}
            useMicrophone={useMicrophone}
            setUseMicrophone={setUseMicrophone}
          />
        </div>
      </div>
    </>
  );
};

export default ChatMessageList;
