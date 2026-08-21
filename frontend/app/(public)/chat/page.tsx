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
import { createNewThread, submitFeedback } from "@/services/thread.service";
import { FeedbackDialog } from "@/components/pages/chat/feedback-dialog";

import {
  Lightbulb,
  Info,
  AlertTriangle,
  CheckCircle,
  BookIcon,
  UniversityIcon,
  Calendar,
} from "lucide-react";
import { type SuggestionItem } from "@/components/pages/chat/chat-types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const suggestions: SuggestionItem[] = [
  {
    key: "openday",
    icon: <Calendar className="w-5 h-5" style={{ color: "#E11D48" }} />,
    description: "Thông tin Open Day HCMUTE 2026",
  },
  {
    key: "1",
    icon: <Lightbulb className="w-5 h-5" style={{ color: "#FFD700" }} />,
    description: "Tôi muốn biết về học bổng của trường",
  },
  {
    key: "2",
    icon: <BookIcon className="w-5 h-5" style={{ color: "#1890FF" }} />,
    description: "Có nên học ở HCMUTE không?",
  },
  {
    key: "3",
    icon: <UniversityIcon className="w-5 h-5" style={{ color: "#ff7118ff" }} />,
    description: "Điểm chuẩn các ngành năm trước là bao nhiêu?",
  },
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOpenDayModal, setShowOpenDayModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

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
      try {
        sendMessage({
          text: pendingMessage,
        });
      } catch (error) {
        toast.error("Failed to send message");
      } finally {
        setPendingMessage(null);
        setIsSubmitting(false);
      }
    }
  }, [threadId, pendingMessage, transport, sendMessage]);

  const handleSubmit = async (message: PromptInputMessage) => {
    if (!message.text || isSubmitting) return;

    setIsSubmitting(true);
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
        setIsSubmitting(false);
        return;
      }
    } else {
      try {
        await sendMessage({
          text: message.text,
        } as any);
      } catch (error) {
        setInput(message.text);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleSuggestionClick = async (suggestion: string) => {
    if (status === "streaming" || status === "submitted" || isSubmitting)
      return;

    if (suggestion === "Thông tin Open Day HCMUTE 2026") {
      setShowOpenDayModal(true);
      return;
    }

    await handleSubmit({ text: suggestion } as any);
  };

  const handleNewChat = () => {
    stop();
    setMessages([]);
    setThreadId(null);
    threadIdRef.current = null;
    setInput("");
    setIsSubmitting(false);
  };

  const handleEndConversation = () => {
    if (!threadId) return;
    setShowFeedbackModal(true);
  };

  const handleFeedbackSubmit = async (data: any) => {
    if (!threadId) return;
    try {
      await submitFeedback(threadId, data);
      toast.success("Cảm ơn bạn đã đóng góp ý kiến!");
    } catch (err) {
      console.error(err);
      toast.error("Không thể gửi đánh giá, nhưng cuộc trò chuyện đã kết thúc");
    } finally {
      setShowFeedbackModal(false);
      handleNewChat();
    }
  };

  const handleFeedbackSkip = () => {
    setShowFeedbackModal(false);
    handleNewChat();
  };

  return (
    <>
      <Dialog open={showOpenDayModal} onOpenChange={setShowOpenDayModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận chuyển trang</DialogTitle>
            <DialogDescription>
              Bạn có muốn chuyển đến trang Open Day (openday.hcmute.edu.vn)
              không?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowOpenDayModal(false)}
            >
              Huỷ
            </Button>
            <Button
              onClick={() => {
                window.open("https://openday.hcmute.edu.vn", "_blank");
                setShowOpenDayModal(false);
              }}
            >
              Đồng ý
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
            isSubmitting={isSubmitting}
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
            isSubmitting={isSubmitting}
            onEndConversation={handleEndConversation}
          />
        )}
      </div>
      <FeedbackDialog
        open={showFeedbackModal}
        onOpenChange={setShowFeedbackModal}
        onSubmit={handleFeedbackSubmit}
        onSkip={handleFeedbackSkip}
      />
    </>
  );
};

export default Example;
