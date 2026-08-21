"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Star } from "lucide-react";

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    rating: number;
    is_accurate: boolean;
    is_helpful: boolean;
    is_understandable: boolean;
    comment: string;
  }) => void;
  onSkip: () => void;
}

export function FeedbackDialog({
  open,
  onOpenChange,
  onSubmit,
  onSkip,
}: FeedbackDialogProps) {
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [isAccurate, setIsAccurate] = useState<boolean>(false);
  const [isHelpful, setIsHelpful] = useState<boolean>(false);
  const [isUnderstandable, setIsUnderstandable] = useState<boolean>(false);
  const [comment, setComment] = useState<string>("");

  const resetForm = () => {
    setRating(0);
    setHoverRating(0);
    setIsAccurate(false);
    setIsHelpful(false);
    setIsUnderstandable(false);
    setComment("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;
    onSubmit({
      rating,
      is_accurate: isAccurate,
      is_helpful: isHelpful,
      is_understandable: isUnderstandable,
      comment,
    });
    resetForm();
  };

  const handleSkip = () => {
    onSkip();
    resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      onOpenChange(val);
      if (!val) resetForm();
    }}>
      <DialogContent className="sm:max-w-[480px] rounded-3xl p-6 border-gray-100 shadow-2xl bg-background/95 backdrop-blur-md">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            Đánh giá cuộc trò chuyện
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            Phản hồi của bạn sẽ giúp chúng mình cải thiện chatbot tốt hơn cho các lần sau.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-2">
          <div className="flex flex-col items-center justify-center gap-2 py-2">
            <Label className="text-sm font-semibold text-muted-foreground">
              Mức độ hài lòng của bạn?
            </Label>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => {
                const active = star <= (hoverRating || rating);
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 transition-all duration-200 hover:scale-125 focus:outline-none"
                  >
                    <Star
                      className={`h-9 w-9 transition-all duration-200 ${
                        active
                          ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]"
                          : "text-muted-foreground/30 hover:text-amber-300"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3.5 bg-muted/30 p-4 rounded-2xl border border-gray-50/5">
            <Label className="text-sm font-semibold text-muted-foreground">
              Thông tin chi tiết (Tùy chọn)
            </Label>
            <div className="grid gap-3">
              <div className="flex items-center space-x-3 rounded-lg p-1 hover:bg-muted/40 transition-colors">
                <Checkbox
                  id="accurate"
                  checked={isAccurate}
                  onCheckedChange={(checked) => setIsAccurate(!!checked)}
                  className="rounded-md border-muted-foreground/30 data-[state=checked]:bg-primary"
                />
                <label
                  htmlFor="accurate"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer w-full select-none"
                >
                  Thông tin chính xác, đáng tin cậy
                </label>
              </div>

              <div className="flex items-center space-x-3 rounded-lg p-1 hover:bg-muted/40 transition-colors">
                <Checkbox
                  id="helpful"
                  checked={isHelpful}
                  onCheckedChange={(checked) => setIsHelpful(!!checked)}
                  className="rounded-md border-muted-foreground/30 data-[state=checked]:bg-primary"
                />
                <label
                  htmlFor="helpful"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer w-full select-none"
                >
                  Nội dung phản hồi hữu ích
                </label>
              </div>

              <div className="flex items-center space-x-3 rounded-lg p-1 hover:bg-muted/40 transition-colors">
                <Checkbox
                  id="understandable"
                  checked={isUnderstandable}
                  onCheckedChange={(checked) => setIsUnderstandable(!!checked)}
                  className="rounded-md border-muted-foreground/30 data-[state=checked]:bg-primary"
                />
                <label
                  htmlFor="understandable"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer w-full select-none"
                >
                  Câu trả lời dễ hiểu, rõ ràng
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment" className="text-sm font-semibold text-muted-foreground">
              Ý kiến đóng góp khác
            </Label>
            <Textarea
              id="comment"
              placeholder="Bạn có góp ý gì thêm về câu trả lời hoặc hệ thống không..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="resize-none rounded-xl focus-visible:ring-primary min-h-[90px]"
            />
          </div>

          <DialogFooter className="flex sm:justify-between items-center gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={handleSkip}
              className="w-full sm:w-auto text-muted-foreground hover:text-foreground rounded-2xl"
            >
              Bỏ qua
            </Button>
            <Button
              type="submit"
              disabled={rating === 0}
              className="w-full sm:w-auto bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white rounded-2xl shadow-md disabled:opacity-50"
            >
              Gửi đánh giá
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
