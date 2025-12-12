"use client";
import { MinimalTiptap } from "@/components/ui/shadcn-io/minimal-tiptap";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { uploadFile } from "@/services/file.service";

export default function MinimalTiptapDemo() {
  const [content, setContent] = useState<string>(`
### OK

$x_2$

$x_3$
$$
\\sum_{n=1}^{\\infty} \\frac{(-1)^{n+1}}{n} \\left( \\int_0^1 x^{n^2} e^{-x^2} \\, dx \\right) \\cdot \\frac{\\prod_{k=1}^{n} \\Gamma\\left( \\frac{k}{n+1} \\right)}{\\sqrt{2\\pi n}} \\, e^{\\,i \\pi \\frac{n^2+n}{2}} \\, \\frac{d}{dx}\\Big|_{x=1} \\left( x^n \\ln\\left(1+x^n\\right) \\right)
$$  
$\\sum_{n=1}^{\\infty} \\frac{(-1)^{n+1}}{n} \\left( \\int_0^1 x^{n^2} e^{-x^2} \\, dx \\right) \\cdot \\frac{\\prod_{k=1}^{n} \\Gamma\\left( \\frac{k}{n+1} \\right)}{\\sqrt{2\\pi n}} \\, e^{\\,i \\pi \\frac{n^2+n}{2}} \\, \\frac{d}{dx}\\Big|_{x=1} \\left( x^n \\ln\\left(1+x^n\\right) \\right)$

YOU ARE GOOD

### HEADING 1
asdasd
## HEADING 2
$$
\\sum_{n=1}^{\\infty} \\frac{(-1)^{n+1}}{n} \\left( \\int_0^1 x^{n^2} e^{-x^2} \\, dx \\right) \\cdot \\frac{\\prod_{k=1}^{n} \\Gamma\\left( \\frac{k}{n+1} \\right)}{\\sqrt{2\\pi n}} \\, e^{\\,i \\pi \\frac{n^2+n}{2}} \\, \\frac{d}{dx}\\Big|_{x=1} \\left( x^n \\ln\\left(1+x^n\\right) \\right)
$$  
  `);

  const [previewMarkdown, setPreviewMarkdown] = useState("");

  const handleGetMarkdown = () => {
    setPreviewMarkdown(content);
  };

  const handleImageUpload = async (file: File) => {
    try {
      const url = await uploadFile(file);
      return url;
    } catch (error) {
      console.error("Failed to upload image:", error);
      alert("Failed to upload image. Please try again.");
      throw error;
    }
  };

  return (
    <div className="size-full flex flex-col p-4 gap-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Tiptap Editor Demo</h1>
        <Button onClick={handleGetMarkdown}>Xem Markdown Output</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
        <div className="w-full h-full border rounded-lg overflow-hidden">
          <MinimalTiptap
            content={content}
            onChange={setContent}
            placeholder="Start typing your content here..."
            className="min-h-[400px] h-full"
            onImageUpload={handleImageUpload}
          />
        </div>
        <div className="w-full h-full border rounded-lg p-4 bg-muted/20 overflow-auto">
          <h2 className="font-semibold mb-2">Markdown Preview</h2>
          {previewMarkdown ? (
            <pre className="whitespace-pre-wrap font-mono text-sm bg-background p-4 rounded-md">
              {previewMarkdown}
            </pre>
          ) : (
            <p className="text-muted-foreground italic">
              Nhấn "Xem Markdown Output" để xem kết quả...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
