import {
  PromptInput,
  PromptInputBody,
  PromptInputButton,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import { ArrowRight, MicIcon } from "lucide-react";
import React from "react";

interface ChatPromptInputProps {
  text: string;
  setText: (text: string) => void;
  onSubmit: (message: PromptInputMessage) => void;
  status: "submitted" | "streaming" | "ready" | "error";
  useMicrophone: boolean;
  setUseMicrophone: (use: boolean) => void;
  className?: string;
}

const ChatPromptInput = ({
  text,
  setText,
  onSubmit,
  status,
  useMicrophone,
  setUseMicrophone,
  className,
}: ChatPromptInputProps) => {
  return (
    <PromptInput
      className={`border-1 rounded-lg border-gray-200 ${className || ""}`}
      onSubmit={onSubmit}
    >
      {/* <PromptInputHeader></PromptInputHeader> */}
      <div className="py-[0.2rem]"></div>
      <PromptInputBody className="border-red-400">
        <PromptInputTextarea
          className="!placeholder-gray-500 border-red-400"
          onChange={(event) => setText(event.target.value)}
          value={text}
        />
      </PromptInputBody>
      <PromptInputFooter>
        <PromptInputTools>
          <PromptInputButton
            onClick={() => setUseMicrophone(!useMicrophone)}
            variant={useMicrophone ? "default" : "ghost"}
          >
            <MicIcon size={16} />
            <span className="sr-only">Microphone</span>
          </PromptInputButton>
        </PromptInputTools>
        <PromptInputSubmit
          disabled={
            !(text.trim() || status) ||
            status === "streaming" ||
            status === "submitted"
          }
          // status={status}
        >
          <ArrowRight />
        </PromptInputSubmit>
      </PromptInputFooter>
    </PromptInput>
  );
};

export default ChatPromptInput;
