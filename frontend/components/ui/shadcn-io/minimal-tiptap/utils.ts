import TurndownService from "turndown";

export const turndownService = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
});

turndownService.addRule("image-block", {
  filter: (node) => {
    return (
      node.nodeName === "DIV" &&
      node.getAttribute("data-type") === "image-block"
    );
  },
  replacement: (content, node) => {
    const htmlNode = node as HTMLElement;
    const src = htmlNode.getAttribute("src");
    let caption =
      htmlNode.getAttribute("data-caption") || htmlNode.getAttribute("caption");

    // Fallback: look for img alt if caption is missing on div
    if (!caption) {
      const img = htmlNode.querySelector("img");
      if (img) caption = img.getAttribute("alt");
    }

    // fallback to empty string
    caption = caption || "";

    return src ? `![${caption}](${src})` : "";
  },
});

turndownService.addRule("youtube-block", {
  filter: (node) => {
    return (
      node.nodeName === "DIV" &&
      node.getAttribute("data-type") === "youtube-block"
    );
  },
  replacement: (content, node) => {
    const htmlNode = node as HTMLElement;
    const src = htmlNode.getAttribute("src");
    let caption = htmlNode.getAttribute("caption");

    // Fallback: look for iframe title or strict match if needed
    // Assuming youtube block might have title/alt on iframe? Usually not standard but safe to check if we add it.

    caption = caption || "YouTube Video";
    return src ? `[${caption}](${src})` : "";
  },
});

// Tiptap Mathematics Extension Rules
// Handle inline math nodes
turndownService.addRule("inline-math", {
  filter: (node) => {
    const isMatch =
      node.nodeName === "SPAN" &&
      node.getAttribute("data-type") === "inline-math";
    if (isMatch) {
      console.log("Inline math filter matched:", node);
    }
    return isMatch;
  },
  replacement: (content, node) => {
    console.log("Inline math replacement called:", { 
      content, 
      latex: (node as HTMLElement).getAttribute("data-latex") 
    });
    const latex = (node as HTMLElement).getAttribute("data-latex");
    if (latex) {
      return `$${latex}$`;
    }
    // Fallback: try to extract from katex annotation
    const annotation = (node as HTMLElement).querySelector(
      "annotation[encoding='application/x-tex']"
    );
    if (annotation && annotation.textContent) {
      return `$${annotation.textContent}$`;
    }
    return "";
  },
});

// Handle block math nodes
turndownService.addRule("block-math", {
  filter: (node) => {
    return (
      node.nodeName === "DIV" &&
      node.getAttribute("data-type") === "block-math"
    );
  },
  replacement: (content, node) => {
    const latex = (node as HTMLElement).getAttribute("data-latex");
    if (latex) {
      return `\n$$\n${latex}\n$$\n`;
    }
    // Fallback: try to extract from katex annotation
    const annotation = (node as HTMLElement).querySelector(
      "annotation[encoding='application/x-tex']"
    );
    if (annotation && annotation.textContent) {
      return `\n$$\n${annotation.textContent}\n$$\n`;
    }
    return "";
  },
});
