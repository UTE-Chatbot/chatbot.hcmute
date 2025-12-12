import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import { cn } from "@/lib/utils";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const ChunkBlockView = (props: any) => {
  const { selected, deleteNode } = props;
  return (
    <NodeViewWrapper className="my-4 select-none">
      <div
        className={cn(
          "relative flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-400 rounded-lg bg-gray-50/50 transition-all group hover:border-blue-500 hover:bg-blue-50/30",
          selected && "border-blue-500 bg-blue-50/30"
        )}
      >
        <span className="text-xs font-mono font-bold uppercase tracking-widest text-gray-700">
          TÁCH ĐOẠN
        </span>
        <Button
          variant="destructive"
          size="icon"
          type="button"
          className="absolute   right-5 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 shadow-lg"
          onClick={deleteNode}
          title="Xóa tách đoạn"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </NodeViewWrapper>
  );
};

export const ChunkBlock = Node.create({
  name: "chunkBlock",
  group: "block",
  atom: true,

  parseHTML() {
    return [
      {
        tag: 'div[data-type="chunk-block"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "chunk-block" }),
      "<<<CHUNK_SEPARATOR>>>",
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ChunkBlockView);
  },
});
