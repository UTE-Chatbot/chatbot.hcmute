"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Eye, Code } from "lucide-react";
import { updateDocument } from "@/services/document.service";
import { DocumentResponse } from "@/types/document";

interface MarkdownEditorProps {
  document: DocumentResponse;
  onSave?: () => void;
  onCancel?: () => void;
}

// Simple markdown parser with LaTeX support
const parseMarkdown = (text: string): string => {
  let html = text;

  // LaTeX inline math: $...$
  html = html.replace(/\$([^\$]+)\$/g, '<span class="latex-inline">$1</span>');
  
  // LaTeX block math: $$...$$
  html = html.replace(/\$\$([^\$]+)\$\$/g, '<div class="latex-block">$1</div>');

  // Chunk markers: <<<CHUNK>>>
  html = html.replace(
    /&lt;&lt;&lt;CHUNK&gt;&gt;&gt;/g,
    '<div class="chunk-marker">📄 CHUNK BOUNDARY</div>'
  );

  // Headers
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  
  // Italic
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Line breaks
  html = html.replace(/\n/g, '<br />');

  return html;
};

export function MarkdownEditor({ document, onSave, onCancel }: MarkdownEditorProps) {
  const [content, setContent] = useState(document.full_text || "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setContent(document.full_text || "");
  }, [document.full_text]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);

      await updateDocument(document.id, {
        full_text: content,
      });

      onSave?.();
    } catch (err) {
      console.error("Error saving document:", err);
      setError("Không thể lưu tài liệu. Vui lòng thử lại.");
    } finally {
      setIsSaving(false);
    }
  };

  const insertChunkMarker = () => {
    const textarea = globalThis.document.getElementById("markdown-editor") as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const marker = "\n<<<CHUNK>>>\n";

    const newContent = content.substring(0, start) + marker + content.substring(end);
    setContent(newContent);

    // Set cursor position after the marker
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + marker.length, start + marker.length);
    }, 0);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 p-6 border-b">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Chỉnh sửa tài liệu: {document.name}</h2>
            <p className="text-muted-foreground mt-1">
              Hỗ trợ Markdown và LaTeX. Sử dụng {'<<<CHUNK>>>'} để đánh dấu ranh giới chunk.
            </p>
          </div>
        </div>
      </div>
      <div className="flex-1 flex flex-col overflow-hidden p-6">
        <Tabs defaultValue="edit" className="flex flex-col flex-1 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="edit" className="flex items-center gap-2">
                <Code className="w-4 h-4" />
                Chỉnh sửa
              </TabsTrigger>
              <TabsTrigger value="preview" className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Xem trước
              </TabsTrigger>
            </TabsList>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={insertChunkMarker}
              >
                Thêm {'<<<CHUNK>>>'}
              </Button>
            </div>
          </div>

          <TabsContent value="edit" className="flex-1 overflow-hidden">
            <Textarea
              id="markdown-editor"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Nhập nội dung tài liệu ở đây...

Hỗ trợ Markdown:
# Tiêu đề cấp 1
## Tiêu đề cấp 2
**Chữ đậm**
*Chữ nghiêng*

Hỗ trợ LaTeX:
Inline: $E = mc^2$
Block: $$\\int_0^\\infty e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}$$

Đánh dấu chunk:
<<<CHUNK>>>
"
              className="font-mono text-sm h-full"
              disabled={isSaving}
            />
          </TabsContent>

          <TabsContent value="preview" className="flex-1 overflow-auto">
            <div
              className="prose prose-sm max-w-none p-4 border rounded-lg bg-muted/30 h-full overflow-auto"
              style={{
                fontFamily: 'system-ui, -apple-system, sans-serif',
              }}
            >
              <style jsx>{`
                .latex-inline {
                  font-family: 'Times New Roman', serif;
                  font-style: italic;
                  color: #0066cc;
                  background: #f0f8ff;
                  padding: 2px 4px;
                  border-radius: 3px;
                }
                .latex-block {
                  font-family: 'Times New Roman', serif;
                  font-style: italic;
                  color: #0066cc;
                  background: #f0f8ff;
                  padding: 12px;
                  border-radius: 6px;
                  margin: 12px 0;
                  text-align: center;
                  overflow-x: auto;
                }
                .chunk-marker {
                  background: linear-gradient(90deg, #f59e0b, #f97316);
                  color: white;
                  padding: 8px 16px;
                  margin: 16px 0;
                  border-radius: 6px;
                  text-align: center;
                  font-weight: bold;
                  font-size: 14px;
                  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
                }
                h1 {
                  font-size: 2em;
                  font-weight: bold;
                  margin: 16px 0 8px 0;
                  color: #1a1a1a;
                }
                h2 {
                  font-size: 1.5em;
                  font-weight: bold;
                  margin: 14px 0 7px 0;
                  color: #2a2a2a;
                }
                h3 {
                  font-size: 1.25em;
                  font-weight: bold;
                  margin: 12px 0 6px 0;
                  color: #3a3a3a;
                }
                strong {
                  font-weight: 600;
                }
                em {
                  font-style: italic;
                }
              `}</style>
              <div dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }} />
            </div>
          </TabsContent>
        </Tabs>

        {error && (
          <div className="mt-4 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2 mt-4">
          {onCancel && (
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isSaving}
            >
              Hủy
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Save className="w-4 h-4 mr-2 animate-pulse" />
                Đang lưu...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Lưu thay đổi
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
