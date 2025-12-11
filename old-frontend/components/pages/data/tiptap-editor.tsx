"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Typography from "@tiptap/extension-typography";
import Image from "@tiptap/extension-image";
import Youtube from "@tiptap/extension-youtube";
import Mathematics from "@tiptap/extension-mathematics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Heading1, 
  Heading2, 
  Heading3,
  Code,
  Quote,
  Undo,
  Redo,
  Image as ImageIcon,
  Upload,
  Link as LinkIcon,
  Youtube as YoutubeIcon,
  Sigma
} from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import TurndownService from "turndown";
import { uploadFile } from "@/services/file.service";
import "katex/dist/katex.min.css";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const turndownService = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
});

interface TiptapEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  editable?: boolean;
}

interface ImageDialogState {
  open: boolean;
  type: "upload" | "url" | null;
}

interface YoutubeDialogState {
  open: boolean;
}

interface LatexDialogState {
  open: boolean;
}

export function TiptapEditor({ 
  content, 
  onChange, 
  placeholder = "Nhập nội dung...",
  editable = true 
}: TiptapEditorProps) {
  const [imageDialog, setImageDialog] = useState<ImageDialogState>({ open: false, type: null });
  const [imageUrl, setImageUrl] = useState("");
  const [imageAlt, setImageAlt] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const [youtubeDialog, setYoutubeDialog] = useState<YoutubeDialogState>({ open: false });
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [youtubeWidth, setYoutubeWidth] = useState("640");
  const [youtubeHeight, setYoutubeHeight] = useState("480");
  
  const [latexDialog, setLatexDialog] = useState<LatexDialogState>({ open: false });
  const [latexCode, setLatexCode] = useState("");

  const htmlToMarkdown = useCallback((html: string) => {
    return turndownService.turndown(html);
  }, []);

  const markdownToHtml = useCallback((markdown: string) => {
    // Basic markdown to HTML conversion for initial content
    let html = markdown
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/^- (.+)$/gim, '<ul><li>$1</li></ul>')
      .replace(/^\d+\. (.+)$/gim, '<ol><li>$1</li></ol>')
      .replace(/`(.+?)`/g, '<code>$1</code>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');
    
    return `<p>${html}</p>`;
  }, []);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Typography,
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Youtube.configure({
        controls: true,
        nocookie: true,
      }),
      Mathematics.configure({
        katexOptions: {
          throwOnError: false,
        },
      }),
    ],
    content: content ? (content.startsWith('<') ? content : markdownToHtml(content)) : '',
    editable,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const markdown = htmlToMarkdown(html);
      onChange(markdown);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[200px] px-4 py-3',
      },
    },
  });

  useEffect(() => {
    if (editor && content) {
      const html = content.startsWith('<') ? content : markdownToHtml(content);
      if (html !== editor.getHTML()) {
        editor.commands.setContent(html);
      }
    }
  }, [content, editor, markdownToHtml]);

  const handleImageUpload = async () => {
    if (!imageFile || !editor) return;
    
    setIsUploading(true);
    try {
      const url = await uploadFile(imageFile);
      editor.chain().focus().setImage({ src: url, alt: imageAlt || imageFile.name }).run();
      setImageDialog({ open: false, type: null });
      setImageFile(null);
      setImageAlt("");
    } catch (error) {
      console.error("Image upload failed:", error);
      alert("Tải ảnh lên thất bại");
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageUrl = () => {
    if (!imageUrl || !editor) return;
    editor.chain().focus().setImage({ src: imageUrl, alt: imageAlt }).run();
    setImageDialog({ open: false, type: null });
    setImageUrl("");
    setImageAlt("");
  };

  const handleYoutubeInsert = () => {
    if (!youtubeUrl || !editor) return;
    editor.chain().focus().setYoutubeVideo({
      src: youtubeUrl,
      width: parseInt(youtubeWidth) || 640,
      height: parseInt(youtubeHeight) || 480,
    }).run();
    setYoutubeDialog({ open: false });
    setYoutubeUrl("");
  };

  const handleLatexInsert = () => {
    if (!latexCode || !editor) return;
    editor.chain().focus().insertContent(`<span data-type="mathematics" data-content="${latexCode}"></span>`).run();
    setLatexDialog({ open: false });
    setLatexCode("");
  };

  if (!editor) {
    return null;
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      {editable && (
        <div className="border-b bg-muted/30 p-2 flex flex-wrap gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive('bold') ? 'bg-muted' : ''}
          >
            <Bold className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={editor.isActive('italic') ? 'bg-muted' : ''}
          >
            <Italic className="w-4 h-4" />
          </Button>
          <div className="w-px h-6 bg-border mx-1" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={editor.isActive('heading', { level: 1 }) ? 'bg-muted' : ''}
          >
            <Heading1 className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={editor.isActive('heading', { level: 2 }) ? 'bg-muted' : ''}
          >
            <Heading2 className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={editor.isActive('heading', { level: 3 }) ? 'bg-muted' : ''}
          >
            <Heading3 className="w-4 h-4" />
          </Button>
          <div className="w-px h-6 bg-border mx-1" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={editor.isActive('bulletList') ? 'bg-muted' : ''}
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={editor.isActive('orderedList') ? 'bg-muted' : ''}
          >
            <ListOrdered className="w-4 h-4" />
          </Button>
          <div className="w-px h-6 bg-border mx-1" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={editor.isActive('codeBlock') ? 'bg-muted' : ''}
          >
            <Code className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={editor.isActive('blockquote') ? 'bg-muted' : ''}
          >
            <Quote className="w-4 h-4" />
          </Button>
          <div className="w-px h-6 bg-border mx-1" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
          >
            <Undo className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
          >
            <Redo className="w-4 h-4" />
          </Button>
          <div className="w-px h-6 bg-border mx-1" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setImageDialog({ open: true, type: "upload" })}
            title="Tải ảnh lên"
          >
            <Upload className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setImageDialog({ open: true, type: "url" })}
            title="Thêm ảnh từ URL"
          >
            <LinkIcon className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setYoutubeDialog({ open: true })}
            title="Thêm video YouTube"
          >
            <YoutubeIcon className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setLatexDialog({ open: true })}
            title="Thêm công thức LaTeX"
          >
            <Sigma className="w-4 h-4" />
          </Button>
        </div>
      )}
      <EditorContent editor={editor} />

      {/* Image Upload Dialog */}
      <Dialog open={imageDialog.open && imageDialog.type === "upload"} onOpenChange={(open) => !open && setImageDialog({ open: false, type: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tải ảnh lên</DialogTitle>
            <DialogDescription>Chọn ảnh từ máy tính của bạn</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="image-file">Chọn file ảnh</Label>
              <Input
                id="image-file"
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="image-alt">Mô tả ảnh (Alt text)</Label>
              <Input
                id="image-alt"
                value={imageAlt}
                onChange={(e) => setImageAlt(e.target.value)}
                placeholder="Nhập mô tả cho ảnh"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImageDialog({ open: false, type: null })}>Hủy</Button>
            <Button onClick={handleImageUpload} disabled={!imageFile || isUploading}>
              {isUploading ? "Đang tải..." : "Thêm ảnh"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image URL Dialog */}
      <Dialog open={imageDialog.open && imageDialog.type === "url"} onOpenChange={(open) => !open && setImageDialog({ open: false, type: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm ảnh từ URL</DialogTitle>
            <DialogDescription>Nhập đường dẫn URL của ảnh</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="image-url">URL ảnh</Label>
              <Input
                id="image-url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="image-alt-url">Mô tả ảnh (Alt text)</Label>
              <Input
                id="image-alt-url"
                value={imageAlt}
                onChange={(e) => setImageAlt(e.target.value)}
                placeholder="Nhập mô tả cho ảnh"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImageDialog({ open: false, type: null })}>Hủy</Button>
            <Button onClick={handleImageUrl} disabled={!imageUrl}>Thêm ảnh</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* YouTube Dialog */}
      <Dialog open={youtubeDialog.open} onOpenChange={(open) => setYoutubeDialog({ open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm video YouTube</DialogTitle>
            <DialogDescription>Nhập URL video YouTube (ví dụ: https://www.youtube.com/watch?v=dQw4w9WgXcQ)</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="youtube-url">URL YouTube</Label>
              <Input
                id="youtube-url"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="youtube-width">Chiều rộng (px)</Label>
                <Input
                  id="youtube-width"
                  value={youtubeWidth}
                  onChange={(e) => setYoutubeWidth(e.target.value)}
                  placeholder="640"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="youtube-height">Chiều cao (px)</Label>
                <Input
                  id="youtube-height"
                  value={youtubeHeight}
                  onChange={(e) => setYoutubeHeight(e.target.value)}
                  placeholder="480"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setYoutubeDialog({ open: false })}>Hủy</Button>
            <Button onClick={handleYoutubeInsert} disabled={!youtubeUrl}>Thêm video</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* LaTeX Dialog */}
      <Dialog open={latexDialog.open} onOpenChange={(open) => setLatexDialog({ open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm công thức LaTeX</DialogTitle>
            <DialogDescription>Nhập công thức toán học bằng cú pháp LaTeX (ví dụ: E = mc^2)</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="latex-code">Công thức LaTeX</Label>
              <Textarea
                id="latex-code"
                value={latexCode}
                onChange={(e) => setLatexCode(e.target.value)}
                placeholder="E = mc^2"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLatexDialog({ open: false })}>Hủy</Button>
            <Button onClick={handleLatexInsert} disabled={!latexCode}>Thêm công thức</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
