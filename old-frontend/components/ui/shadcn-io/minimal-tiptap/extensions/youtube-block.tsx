import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import { useState, ChangeEvent } from "react";
import { Trash2, Youtube } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const YoutubeBlockView = (props: any) => {
  const { node, updateAttributes, deleteNode } = props;

  const handleCaptionChange = (e: ChangeEvent<HTMLInputElement>) => {
    updateAttributes({ caption: e.target.value });
  };

  const src = node.attrs.src;

  // Helper to get embed URL from standard Youtube URL
  const getEmbedUrl = (url: string) => {
    if (!url) return "";
    if (url.includes("embed")) return url;
    const videoid = url.match(
      /(?:https?:\/{2})?(?:w{3}\.)?youtu(?:be)?\.(?:com|be)(?:\/watch\?v=|\/)([^\s&]+)/
    );
    if (videoid) {
      return `https://www.youtube.com/embed/${videoid[1]}`;
    }
    return url;
  };

  const embedUrl = getEmbedUrl(src);

  return (
    <NodeViewWrapper className="max-w-full my-4 flex flex-col items-center">
      <div className="relative group border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-card w-full max-w-3xl">
        <div className="relative aspect-video w-full">
          <iframe
            src={embedUrl}
            className="w-full h-full"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 z-10 shadow-lg"
            onClick={deleteNode}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        {node.attrs.caption && (
          <div className="px-4 py-3 border-t bg-muted/30">
            <p className="text-sm text-center text-muted-foreground italic">
              {node.attrs.caption}
            </p>
          </div>
        )}
      </div>
      <div className="mt-2 w-full max-w-3xl mx-auto">
        <Input
          placeholder="Thêm chú thích video..."
          value={node.attrs.caption || ""}
          onChange={handleCaptionChange}
          className="text-center bg-background/50 border-dashed border-muted-foreground/30 shadow-none text-foreground hover:border-muted-foreground/60 focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary placeholder:text-muted-foreground/40 h-9 text-sm transition-colors"
        />
      </div>
    </NodeViewWrapper>
  );
};

export const YoutubeBlock = Node.create({
  name: "youtubeBlock",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      caption: {
        default: "",
      },
      width: {
        default: 640,
      },
      height: {
        default: 480,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="youtube-block"]',
        getAttrs: (dom) => {
          if (typeof dom === "string") return {};
          const element = dom as HTMLElement;
          return {
            src: element.getAttribute("data-src"),
            caption: element.getAttribute("data-caption") || "",
            width: element.getAttribute("data-width") || 640,
            height: element.getAttribute("data-height") || 480,
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes, node }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { 
        "data-type": "youtube-block",
        src: node.attrs.src,
        caption: node.attrs.caption || ""
      }),
      ["iframe", { src: node.attrs.src }],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(YoutubeBlockView);
  },
});
