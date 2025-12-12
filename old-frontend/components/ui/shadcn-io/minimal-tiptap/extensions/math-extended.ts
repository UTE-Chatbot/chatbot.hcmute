import { Mathematics, BlockMath, InlineMath } from "@tiptap/extension-mathematics";
import { mergeAttributes } from "@tiptap/core";

// --- Helper Functions for Safe Encoding/Decoding ---

// Decodes LaTeX from an HTML attribute (assuming it was encoded with encodeURIComponent)
const decodeLatex = (value: string | null): string => {
  if (!value) return "";
  try {
    return decodeURIComponent(value);
  } catch {
    return value; // Return as-is if decoding fails
  }
};

// Encodes LaTeX for safe placement into an HTML attribute
const encodeLatex = (value: string): string => {
  return encodeURIComponent(value);
};

// --- Custom Block Math Node ---

/**
 * Extends BlockMath to ensure complex LaTeX is safely encoded and decoded 
 * when moving between the content string and the editor state.
 */
export const CustomBlockMath = BlockMath.extend({
  addAttributes() {
    return {
      // @ts-ignore
      ...this.parent?.(),
      latex: {
        default: "",
        parseHTML: (element: HTMLElement) => {
            // DECODE when reading from HTML
            return decodeLatex(element.getAttribute("data-latex"));
        },
        renderHTML: (attributes: Record<string, any>) => {
          return {
            // ENCODE when writing to HTML
            "data-latex": encodeLatex(attributes.latex),
          };
        },
      },
    };
  },
  
  // Keep the original commands if they were needed, though they are usually
  // inherited correctly from the base extension.
});

// --- Custom Inline Math Node ---

/**
 * Extends InlineMath for the same robust encoding/decoding logic.
 */
export const CustomInlineMath = InlineMath.extend({
  addAttributes() {
    return {
      // @ts-ignore
      ...this.parent?.(),
      latex: {
        default: "",
        parseHTML: (element: HTMLElement) => {
            // DECODE when reading from HTML
            return decodeLatex(element.getAttribute("data-latex"));
        },
        renderHTML: (attributes: Record<string, any>) => {
          return {
            // ENCODE when writing to HTML
            "data-latex": encodeLatex(attributes.latex),
          };
        },
      },
    };
  },
});

// We keep the original export for legacy compatibility if other files referenced MathExtended
// But we primarily use CustomBlockMath and CustomInlineMath in the main component.
// Note: If you have old code relying on the blockMath type being 'blockMath', you should use that name.
// The base Tiptap extension names the node 'mathBlock' or 'blockMath' depending on the library version. 
// Assuming 'blockMath' for compatibility with your earlier code.