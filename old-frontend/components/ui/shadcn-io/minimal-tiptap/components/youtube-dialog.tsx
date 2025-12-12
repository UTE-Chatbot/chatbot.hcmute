import * as React from "react";
import { Editor } from "@tiptap/react";
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

interface YoutubeDialogProps {
  editor: Editor;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function YoutubeDialog({
  editor,
  open,
  onOpenChange,
}: YoutubeDialogProps) {
  const [youtubeUrl, setYoutubeUrl] = React.useState("");
  const [youtubeCaption, setYoutubeCaption] = React.useState("");

  const submitYoutube = () => {
    if (youtubeUrl) {
      editor
        .chain()
        .focus()
        .insertContent({
          type: "youtubeBlock",
          attrs: { src: youtubeUrl, caption: youtubeCaption },
        })
        .run();
      setYoutubeUrl("");
      setYoutubeCaption("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Chèn YouTube Video</DialogTitle>
          <DialogDescription>
            Nhập đường dẫn video YouTube mà bạn muốn chèn.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="youtube-url">Đường dẫn YouTube</Label>
            <Input
              id="youtube-url"
              placeholder="https://www.youtube.com/watch?v=..."
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  submitYoutube();
                }
              }}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="youtube-caption">Chú thích</Label>
            <Input
              id="youtube-caption"
              placeholder="Nhập chú thích video"
              value={youtubeCaption}
              onChange={(e) => setYoutubeCaption(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  submitYoutube();
                }
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={submitYoutube}>Chèn</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
