import * as React from "react";
import { Editor } from "@tiptap/react";
import katex from "katex";
import "katex/dist/katex.min.css";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface MathDialogProps {
  editor: Editor;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "inline" | "block";
  initialLatex?: string;
  nodePos?: number;
}

export function MathDialog({
  editor,
  open,
  onOpenChange,
  mode,
  initialLatex = "",
  nodePos,
}: MathDialogProps) {
  // 1. Khởi tạo state với giá trị ban đầu ngay lập tức
  const [mathLatex, setMathLatex] = React.useState(initialLatex);
  const previewRef = React.useRef<HTMLDivElement>(null);

  // Cập nhật state khi dialog mở lại hoặc props thay đổi
  React.useEffect(() => {
    if (open) {
      setMathLatex(initialLatex);
    }
  }, [open, initialLatex]);

  // 2. Tách logic render ra hàm riêng
  const renderMath = React.useCallback(() => {
    if (!previewRef.current) return;

    if (mathLatex) {
      try {
        katex.render(mathLatex, previewRef.current, {
          throwOnError: false,
          displayMode: mode === "block",
        });
      } catch (error) {
        previewRef.current.innerHTML = `<span style="color: #ef4444;">LaTeX lỗi</span>`;
      }
    } else {
      previewRef.current.innerHTML = `<span style="color: #9ca3af;">Nhập công thức bên trên...</span>`;
    }
  }, [mathLatex, mode]);

  // 3. Trigger render khi state thay đổi + Thêm delay nhỏ để chờ Dialog animation
  React.useEffect(() => {
    if (open) {
      // Render thử ngay lập tức
      renderMath();
      
      // Render lại sau 0ms (đẩy vào cuối event loop) để đảm bảo DOM đã sẵn sàng
      // Fix lỗi dialog của Radix UI chưa kịp layout xong
      const timer = setTimeout(() => {
        renderMath();
      }, 0);

      return () => clearTimeout(timer);
    }
  }, [renderMath, open]);

  const submitMath = () => {
    if (!mathLatex) return;
    
    if (nodePos !== undefined) {
      // Logic update node cũ
      if (mode === "inline") {
        // @ts-ignore
        editor.chain().focus().updateInlineMath({ latex: mathLatex, pos: nodePos }).run();
      } else {
        // @ts-ignore
        editor.chain().focus().updateBlockMath({ latex: mathLatex, pos: nodePos }).run();
      }
    } else {
      // Logic insert node mới
      if (mode === "inline") {
        // @ts-ignore
        editor.chain().focus().insertInlineMath({ latex: mathLatex }).run();
      } else {
        // @ts-ignore
        editor.chain().focus().insertBlockMath({ latex: mathLatex }).run();
      }
    }
    setMathLatex("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "inline"
              ? "Chỉnh sửa công thức (Inline)"
              : "Chỉnh sửa công thức (Block)"}
          </DialogTitle>
          <DialogDescription>
            Nhập mã LaTeX toán học bên dưới.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>LaTeX</Label>
            <Input
              placeholder="E = mc^2"
              value={mathLatex}
              onChange={(e) => setMathLatex(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault(); 
                  submitMath();
                }
              }}
            />
          </div>
          <div className="grid gap-2">
            <Label>Xem trước (Preview)</Label>
            <div 
              ref={previewRef}
              className="min-h-[60px] p-4 border rounded-md bg-muted/30 flex items-center justify-center overflow-x-auto"
              style={{ fontSize: mode === "block" ? "1.2em" : "1em" }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={submitMath}>Lưu</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}