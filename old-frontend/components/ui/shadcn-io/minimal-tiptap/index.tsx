"use client";

import * as React from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { cn } from "@/lib/utils";

// Extensions
import { ImageBlock } from "./extensions/image-block";
import { YoutubeBlock } from "./extensions/youtube-block";
import { ChunkBlock } from "./extensions/chunk-block";
// 1. Import new custom math nodes
import { CustomBlockMath, CustomInlineMath } from "./extensions/math-extended";
import { Mathematics, migrateMathStrings } from "@tiptap/extension-mathematics"; 

import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";
import "katex/dist/katex.min.css";

// Utils and Components
import { editorToMarkdown } from "./markdown-serializer";
import { marked } from "marked";
import { EditorToolbar } from "./components/editor-toolbar";
import { ImageDialog } from "./components/image-dialog";
import { YoutubeDialog } from "./components/youtube-dialog";
import { MathDialog } from "./components/math-dialog";

export interface MinimalTiptapProps {
// ... props definition ...
  content?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  editable?: boolean;
  className?: string;
  onImageUpload?: (file: File) => Promise<string>;
}

function MinimalTiptap({
  content = "",
  onChange,
  placeholder = "Bắt đầu nhập...",
  editable = true,
  className,
  onImageUpload,
}: MinimalTiptapProps) {
  const [youtubeDialogOpen, setYoutubeDialogOpen] = React.useState(false);
  const [imageDialogOpen, setImageDialogOpen] = React.useState(false);
  const [mathDialogOpen, setMathDialogOpen] = React.useState(false);
  const [mathMode, setMathMode] = React.useState<"inline" | "block">("inline");
  const [selectedMathLatex, setSelectedMathLatex] = React.useState("");
  const [selectedMathPos, setSelectedMathPos] = React.useState<number | undefined>(undefined);


  const initialContent = React.useMemo(() => {
    if (!content) return "";
    if (content.trim().startsWith("<")) {
      return content;
    }
    
    // 1. Pre-process chunk separators to prevent marked from treating them as HTML tags
    let processedContent = content.replace(
      /<<<CHUNK(_SEPARATOR)?>>>/g,
      () => '<div data-type="chunk-block"></div>'
    );
    
    // 2. Pre-process images: ![caption](url) -> imageBlock HTML
    processedContent = processedContent.replace(
      /!\[([^\]]*)\]\(([^)]+)\)/g,
      (match, caption, src) => {
        return `<div data-type="image-block" data-src="${src}" data-caption="${caption}"></div>`;
      }
    );
    
    // 3. Pre-process YouTube/links: [text](url) -> youtubeBlock HTML if it's a YouTube URL
    processedContent = processedContent.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      (match, caption, url) => {
        // Check if it's a YouTube URL
        const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
        if (isYouTube) {
          return `<div data-type="youtube-block" data-src="${url}" data-caption="${caption}"></div>`;
        }
        // Otherwise keep it as a regular link
        return match;
      }
    );
    
    // 4. Pre-process block math to HTML using encodeURIComponent
    processedContent = processedContent.replace(
      // Regex matches $$ followed by content, followed by $$
      /\$\$([\s\S]*?)\$\$/g, 
      (match, latex) => {
        const cleanLatex = latex.trim();
        // IMPORTANT: Encode the latex string for safe insertion into the HTML data attribute
        const encodedLatex = encodeURIComponent(cleanLatex);
        // The node name is 'blockMath' but the data-type attribute must be 'block-math' (with hyphen)
        return `<div data-type="block-math" data-latex="${encodedLatex}"></div>`;
      }
    );

    // 5. Parse the pre-processed content
    return marked.parse(processedContent) as string;
  }, [content]);

  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    extensions: [
      StarterKit.configure({
        bulletList: { keepMarks: true, keepAttributes: false },
        orderedList: { keepMarks: true, keepAttributes: false },
      }),
      ImageBlock,
      YoutubeBlock,
      ChunkBlock,
      // 4. Use the base extension for settings/input rules, 
      // but register our custom nodes to override parsing
      Mathematics.configure({
         katexOptions: { throwOnError: false },
      }),
      CustomBlockMath.configure({
        onClick: (node, pos) => {
          setSelectedMathLatex(node.attrs.latex || "");
          setSelectedMathPos(pos);
          setMathMode("block");
          setMathDialogOpen(true);
        },
      }), // Our custom block node with click handler
      CustomInlineMath.configure({
        onClick: (node, pos) => {
          setSelectedMathLatex(node.attrs.latex || "");
          setSelectedMathPos(pos);
          setMathMode("inline");
          setMathDialogOpen(true);
        },
      }), // Our custom inline node with click handler
      
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: initialContent,
    editable,
    onCreate: ({ editor }) => {
      // 5. This handles the simple $...$ inline math migration
      migrateMathStrings(editor);
    },
    onUpdate: ({ editor }) => {
      const markdown = editorToMarkdown(editor);
      onChange?.(markdown);
    },
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm sm:prose-base lg:prose-sm xl:prose-sm focus:outline-none",
          "min-h px-4 !w-full !max-w-none border-0",
          "chunk-hover-container"
        ),
      },
    },
  });

  if (!editor) {
    return null;
  }

  // --- Handlers ---
  const addImage = () => {
    setImageDialogOpen(true);
  };

  const addYoutube = () => {
    setYoutubeDialogOpen(true);
  };

  const onInsertInlineMath = () => {
    if (editor.state.selection.empty) {
      setMathMode("inline");
      setMathDialogOpen(true);
    } else {
      // @ts-ignore
      editor.chain().focus().insertInlineMath({ latex: "" }).run();
    }
  };

  const onInsertBlockMath = () => {
    // Check if blockMath is active before deleting
    // @ts-ignore
    if (editor.isActive("blockMath")) {
      // @ts-ignore
      return editor.chain().focus().deleteBlockMath().run();
    }
    
    if (editor.state.selection.empty) {
      setMathMode("block");
      setMathDialogOpen(true);
    } else {
      // Wrap selected text in a BlockMath node
      const { from, to } = editor.state.selection;
      const text = editor.state.doc.textBetween(from, to);
      // @ts-ignore
      editor.chain().focus().insertBlockMath({ latex: text }).run();
    }
  };

  return (
    <div
      className={cn(
        "border rounded-lg overflow-hidden bg-background flex flex-col",
        className
      )}
    >
      <div className="sticky top-0 z-10 bg-background border-b">
        <EditorToolbar
          editor={editor}
          onAddImage={addImage}
          onAddYoutube={addYoutube}
          onAddMathInline={onInsertInlineMath}
          onAddMathBlock={onInsertBlockMath}
        />
      </div>

      <div className="flex-1 overflow-y-auto max-h-[600px]">
        <EditorContent editor={editor} placeholder={placeholder} />
      </div>

      <YoutubeDialog
        editor={editor}
        open={youtubeDialogOpen}
        onOpenChange={setYoutubeDialogOpen}
      />

      <ImageDialog
        editor={editor}
        open={imageDialogOpen}
        onOpenChange={setImageDialogOpen}
        onImageUpload={onImageUpload}
      />

      <MathDialog
        editor={editor}
        open={mathDialogOpen}
        onOpenChange={(open) => {
          setMathDialogOpen(open);
          if (!open) {
            // Clear selection when dialog closes
            setSelectedMathLatex("");
            setSelectedMathPos(undefined);
          }
        }}
        mode={mathMode}
        initialLatex={selectedMathLatex}
        nodePos={selectedMathPos}
      />
    </div>
  );
}

export { MinimalTiptap };