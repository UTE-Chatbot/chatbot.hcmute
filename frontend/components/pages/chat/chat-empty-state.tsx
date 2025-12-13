import React from "react";
import { motion } from "framer-motion";
import { getGreeting } from "@/lib/greet";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import ChatPromptInput from "@/components/pages/chat/prompt-input";
import { type PromptInputMessage } from "@/components/ai-elements/prompt-input";

import { type SuggestionItem } from "@/components/pages/chat/chat-types";

interface ChatEmptyStateProps {
  userFullName?: string;
  suggestions: SuggestionItem[];
  handleSuggestionClick: (suggestion: string) => void;
  text: string;
  setText: (text: string) => void;
  handleSubmit: (message: PromptInputMessage) => void;
  status: "submitted" | "streaming" | "ready" | "error";
  useMicrophone: boolean;
  setUseMicrophone: (use: boolean) => void;
  isSubmitting: boolean;
}

const ChatEmptyState = ({
  userFullName,
  suggestions,
  handleSuggestionClick,
  text,
  setText,
  handleSubmit,
  status,
  useMicrophone,
  setUseMicrophone,
  isSubmitting,
}: ChatEmptyStateProps) => {
  return (
    <div className="flex size-full flex-col items-center justify-center gap-8 md:gap-24 pb-12 pt-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-xl text-center space-y-2"
      >
        <h1 className="text-3xl font-semibold" suppressHydrationWarning>
          {getGreeting(userFullName).map((text: any, index: number) => (
            <motion.span
              key={index}
              suppressHydrationWarning
              className="inline-block text-balance font-semibold mr-1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.8,
                delay: index * 0.2,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              {text}
            </motion.span>
          ))}
        </h1>
        <p className="text-muted-foreground text-lg">
          Mình có thể giúp gì cho bạn?
        </p>
      </motion.div>
      <div className="w-full max-w-3xl space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <Suggestions>
            {suggestions.map((suggestion) => (
              <Suggestion
                key={suggestion.key}
                onClick={() => handleSuggestionClick(suggestion.description)}
                suggestion={suggestion.description}
                className="h-auto py-2"
                disabled={
                  status === "streaming" ||
                  status === "submitted" ||
                  isSubmitting
                }
              >
                <div className="flex items-center gap-2">
                  {suggestion.icon}
                  <span>{suggestion.description}</span>
                </div>
              </Suggestion>
            ))}
          </Suggestions>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="w-full !py-0 "
        >
          <ChatPromptInput
            text={text}
            setText={setText}
            onSubmit={handleSubmit}
            status={status}
            useMicrophone={useMicrophone}
            setUseMicrophone={setUseMicrophone}
          />
        </motion.div>
      </div>
    </div>
  );
};

export default ChatEmptyState;
