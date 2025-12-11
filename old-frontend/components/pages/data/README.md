# Data Management Page - Setup Instructions

## Installation Required

Before running the application, install the missing Radix UI dependencies:

```bash
cd old-frontend
pnpm add @radix-ui/react-label @radix-ui/react-checkbox
```

## Components Created

### Document Management
- **DocumentList** (`components/pages/data/document-list.tsx`)
  - Lists all documents with pagination
  - Shows document status with color-coded badges
  - Auto-polls every 3 seconds when documents are processing
  - Supports edit and delete actions

- **DocumentUpload** (`components/pages/data/document-upload.tsx`)
  - File upload with drag-and-drop support
  - Text input for manual content entry
  - Chunk mode selection (Delimiter, Markdown Heading, LLM)
  - Metadata input (topic, subtopic)

- **MarkdownEditor** (`components/pages/data/markdown-editor.tsx`)
  - Full markdown editor with preview
  - LaTeX support (inline with `$...$` and block with `$$...$$`)
  - Chunk marker support (`<<<CHUNK>>>`)
  - Fullscreen mode
  - Live preview with syntax highlighting

### CSV Table Management
- **CSVTableList** (`components/pages/data/csv-table-list.tsx`)
  - Lists all CSV tables with pagination
  - Shows column count and preview
  - View details and delete actions

- **CSVTableCreate** (`components/pages/data/csv-table-create.tsx`)
  - Create new CSV table definitions
  - Add/remove columns dynamically
  - Column type selection (TEXT, BIGINT, DECIMAL)
  - Categorical flag support

### UI Components Added
- **Label** (`components/ui/label.tsx`)
- **Checkbox** (`components/ui/checkbox.tsx`)

## Features Implemented

### Document Flow
1. **Upload File** → Parsing → Chunking → Embedding → Completed
2. **Manual Text Entry** → Chunking → Embedding → Completed
3. **Status Polling** - Auto-refresh every 3 seconds while processing
4. **Markdown Editing** - Edit document content with chunk markers

### CSV Table Flow
1. **Create Table** - Define schema with columns
2. **List Tables** - View all tables with schema preview
3. **View Details** - See full table structure in modal

### Chunk Markers
- Use `<<<CHUNK>>>` in the markdown editor to mark chunk boundaries
- These markers are visually highlighted in the preview
- System recognizes these during chunking process

### LaTeX Support
- **Inline Math**: `$E = mc^2$`
- **Block Math**: `$$\int_0^\infty e^{-x^2} dx = \frac{\sqrt{\pi}}{2}$$`
- Rendered with visual styling in preview mode

## API Integration

All components are integrated with the existing services:
- `document.service.ts` - Document CRUD operations
- `csv_table.service.ts` - CSV table CRUD operations
- `file.service.ts` - File upload

## Page Structure

The main data page (`app/(protected)/admin/data/page.tsx`) has:
- Tab navigation between Document and CSV Table management
- Toggle between list/create views
- Document editing in fullscreen modal
- CSV table details in modal dialog

## Status Indicators

Document statuses with color coding:
- 🔵 Pending, Parsing, Chunking, Embedding (blue)
- 🟢 Completed (green)
- 🔴 Failed, Parsing Failed, Chunking Failed, Embedding Failed (red)
