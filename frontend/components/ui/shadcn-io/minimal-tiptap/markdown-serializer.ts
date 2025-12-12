import { Editor } from "@tiptap/react";

/**
 * Convert Tiptap editor content directly to Markdown
 * This traverses the ProseMirror document JSON and converts each node type to markdown
 */
export function editorToMarkdown(editor: Editor): string {
  const json = editor.getJSON();
  return jsonToMarkdown(json);
}

function jsonToMarkdown(node: any, inList = false): string {
  if (!node) return "";

  const { type, content, attrs, marks, text } = node;

  // Handle text nodes with marks
  if (type === "text") {
    let result = text || "";
    
    // Apply marks (bold, italic, code, etc.)
    if (marks && marks.length > 0) {
      marks.forEach((mark: any) => {
        switch (mark.type) {
          case "bold":
            result = `**${result}**`;
            break;
          case "italic":
            result = `*${result}*`;
            break;
          case "code":
            result = `\`${result}\``;
            break;
          case "strike":
            result = `~~${result}~~`;
            break;
          case "link":
            result = `[${result}](${mark.attrs?.href || ""})`;
            break;
        }
      });
    }
    
    return result;
  }

  // Handle block nodes
  let output = "";

  switch (type) {
    case "doc":
      return content ? content.map((n: any) => jsonToMarkdown(n)).join("") : "";

    case "paragraph":
      const paraContent = content ? content.map((n: any) => jsonToMarkdown(n)).join("") : "";
      return inList ? paraContent : `${paraContent}\n\n`;

    case "heading":
      const level = attrs?.level || 1;
      const headingContent = content ? content.map((n: any) => jsonToMarkdown(n)).join("") : "";
      return `${"#".repeat(level)} ${headingContent}\n\n`;

    case "blockquote":
      const quoteLines = content ? content.map((n: any) => jsonToMarkdown(n)).join("") : "";
      return quoteLines
        .split("\n")
        .filter((line: string) => line.trim())
        .map((line: string) => `> ${line}`)
        .join("\n") + "\n\n";

    case "codeBlock":
      const code = content ? content.map((n: any) => jsonToMarkdown(n)).join("") : "";
      const language = attrs?.language || "";
      return `\`\`\`${language}\n${code}\n\`\`\`\n\n`;

    case "bulletList":
      return content ? content.map((n: any) => jsonToMarkdown(n, true)).join("") + "\n" : "";

    case "orderedList":
      let itemNumber = 1;
      return content
        ? content.map((n: any) => {
            const result = jsonToMarkdown(n, true) + "\n";
            itemNumber++;
            return result.replace(/^- /, `${itemNumber - 1}. `);
          }).join("") + "\n"
        : "";

    case "listItem":
      const listContent = content ? content.map((n: any) => jsonToMarkdown(n, true)).join("") : "";
      const prefix = typeof inList === "number" ? `${inList}. ` : "- ";
      return `${prefix}${listContent}\n`;

    case "hardBreak":
      return "  \n";

    case "horizontalRule":
      return "---\n\n";

    // Math nodes
    case "inlineMath":
      return `$${attrs?.latex || ""}$`;

    case "blockMath":
      return `\n$$\n${attrs?.latex || ""}\n$$\n\n`;

    // Image block
    case "imageBlock":
      const imgSrc = attrs?.src || "";
      const imgCaption = attrs?.caption || attrs?.alt || "";
      return `![${imgCaption}](${imgSrc})\n\n`;

    // YouTube block
    case "youtubeBlock":
      const ytSrc = attrs?.src || "";
      const ytCaption = attrs?.caption || "YouTube Video";
      return `[${ytCaption}](${ytSrc})\n\n`;

    // Chunk block delimiter
    case "chunkBlock":
      return `<<<CHUNK_SEPARATOR>>>\n\n`;

    // Table support
    case "table":
      return renderTable(node) + "\n\n";

    case "tableRow":
    case "tableHeader":
    case "tableCell":
      // These are handled by the table renderer
      return content ? content.map((n: any) => jsonToMarkdown(n)).join("") : "";

    default:
      // For unknown types, recursively process content
      return content ? content.map((n: any) => jsonToMarkdown(n)).join("") : "";
  }
}

function renderTable(tableNode: any): string {
  if (!tableNode.content || tableNode.content.length === 0) return "";

  const rows: string[][] = [];

  // Extract all rows and cells
  tableNode.content.forEach((rowNode: any) => {
    if (rowNode.type === "tableRow") {
      const cells: string[] = [];
      rowNode.content?.forEach((cellNode: any) => {
        if (cellNode.type === "tableCell" || cellNode.type === "tableHeader") {
          const cellContent = cellNode.content
            ? cellNode.content.map((n: any) => jsonToMarkdown(n, true)).join("").trim()
            : "";
          cells.push(cellContent);
        }
      });
      rows.push(cells);
    }
  });

  if (rows.length === 0) return "";

  // Build markdown table
  let markdown = "";
  const colCount = Math.max(...rows.map((r) => r.length));

  rows.forEach((row, i) => {
    // Pad row to match column count
    while (row.length < colCount) row.push("");
    markdown += "| " + row.join(" | ") + " |\n";

    // Add header separator after first row
    if (i === 0) {
      markdown += "|" + " --- |".repeat(colCount) + "\n";
    }
  });

  return markdown;
}
