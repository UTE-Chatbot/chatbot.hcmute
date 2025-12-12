import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import { useState, ChangeEvent } from "react";
import { Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const ImageBlockView = (props: any) => {
  const { node, updateAttributes, deleteNode } = props;

  const handleCaptionChange = (e: ChangeEvent<HTMLInputElement>) => {
    updateAttributes({ caption: e.target.value });
  };

  const handleWidthChange = (e: ChangeEvent<HTMLInputElement>) => {
    updateAttributes({ width: e.target.value });
  };

  const handleHeightChange = (e: ChangeEvent<HTMLInputElement>) => {
    updateAttributes({ height: e.target.value });
  };

  return (
    <NodeViewWrapper className="max-w-full flex flex-col items-center my-4">
      <div className="relative group border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-card">
        <div className="relative p-3">
          <img
            src={node.attrs.src}
            alt={node.attrs.caption || "Image"}
            style={{
              width: node.attrs.width || "auto",
            }}
            className="max-w-full rounded-md mx-auto block transition-all"
          />
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 shadow-lg"
            onClick={deleteNode}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        {node.attrs.caption && (
          <div className="px-4 pb-3 pt-1 border-t bg-muted/30">
            <p className="text-sm text-center text-muted-foreground italic">
              {node.attrs.caption}
            </p>
          </div>
        )}
      </div>
      <div className="mt-2 w-full max-w-2xl mx-auto">
        <Input
          placeholder="Thêm chú thích..."
          value={node.attrs.caption}
          onChange={handleCaptionChange}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.preventDefault();
          }}
          className="text-center bg-background/50 border-dashed border-muted-foreground/30 shadow-none text-foreground hover:border-muted-foreground/60 focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary placeholder:text-muted-foreground/40 h-9 text-sm transition-colors"
        />
      </div>
    </NodeViewWrapper>
  );
};

export const ImageBlock = Node.create({
  name: "imageBlock",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      caption: {
        default: "",
        parseHTML: (element) =>
          element.getAttribute("data-caption") || element.getAttribute("alt"),
        renderHTML: (attributes) => ({
          "data-caption": attributes.caption,
        }),
      },
      width: {
        default: null,
      },
      height: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="image-block"]',
        getAttrs: (dom) => {
          if (typeof dom === "string") return {};
          const element = dom as HTMLElement;
          return {
            src: element.getAttribute("data-src"),
            caption: element.getAttribute("data-caption") || "",
            width: element.getAttribute("data-width"),
            height: element.getAttribute("data-height"),
          };
        },
      },
      {
        tag: "img",
        getAttrs: (dom) => {
          if (typeof dom === "string") return {};
          const element = dom as HTMLImageElement;
          return {
            src: element.getAttribute("src"),
            caption:
              element.getAttribute("data-caption") ||
              element.getAttribute("alt"),
            width: element.getAttribute("width"),
            height: element.getAttribute("height"),
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes, node }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { 
        "data-type": "image-block",
        "data-caption": node.attrs.caption || "",
        src: node.attrs.src
      }),
      [
        "img", 
        mergeAttributes(
          { 
            src: node.attrs.src,
            alt: node.attrs.caption || "",
            "data-caption": node.attrs.caption || ""
          },
          node.attrs.width ? { width: node.attrs.width } : {},
          node.attrs.height ? { height: node.attrs.height } : {}
        )
      ],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageBlockView);
  },
});
