"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getDocuments,
  deleteDocument,
  searchChunks,
  deleteDocumentChunk,
  updateDocumentChunk,
} from "@/services/document.service";
import { getTopics } from "@/services/topic.service";
import {
  DocumentResponse,
  DocumentListResponse,
  DocumentStatusColors,
  DocumentStatusLabels,
  isProcessingStatus,
  ChunkSearchResult,
  DocumentChunkUpdate,
} from "@/types/document";

import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  FileText,
  Edit,
  Trash2,
  RefreshCw,
  Search,
  FileIcon,
  Layers,
  Check,
  ChevronsUpDown,
  ArrowRight,
  X,
  Save,
} from "lucide-react";
import { DocumentDetail } from "@/components/pages/data/document-detail";
import { DocumentUpload } from "@/components/pages/data/document-upload";
import { MinimalTiptap } from "@/components/ui/shadcn-io/minimal-tiptap";
import { uploadFile } from "@/services/file.service";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { TopicData } from "@/types/topic";
import { JSONSchema } from "zod/v4/core";
import { Streamdown } from "streamdown";

// Chunk Search Card Component
interface ChunkSearchCardProps {
  result: ChunkSearchResult;
  onEdit: (documentId: number, chunkId: number, text: string) => Promise<void>;
  onDelete: (documentId: number, chunkId: number) => Promise<void>;
}

function ChunkSearchCard({ result, onEdit, onDelete }: ChunkSearchCardProps) {
  const metadata = result.document.metadata;
  const chunkId = metadata.chunk_id;
  const documentId = metadata.document_id;
  const chunkIndex = metadata.chunk_index ?? 0;
  const documentName = metadata.document_name || "Unknown Document";
  const scorePercentage = (result.score * 100).toFixed(1);

  const handleEdit = () => {
    if (!chunkId || !documentId) {
      alert("Không thể chỉnh sửa chunk: thiếu thông tin");
      return;
    }
    onEdit(documentId, chunkId, result.document.page_content);
  };

  const handleDelete = () => {
    if (!chunkId || !documentId) {
      alert("Không thể xóa chunk: thiếu thông tin");
      return;
    }
    onDelete(documentId, chunkId);
  };

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow bg-white">
      <CardHeader className="!pb-0">
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <FileText className="w-4 h-4" />
              {documentName}
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-xs">
                  Chunk #{chunkIndex}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  Mức độ liên quan: {scorePercentage}%
                </Badge>
                {metadata.topic && (
                  <Badge variant="outline" className="text-xs">
                    {metadata.topic}
                    {metadata.subtopic && ` → ${metadata.subtopic}`}
                  </Badge>
                )}
              </div>
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="!pt-0">
        <div className=" space-y-3">
          <div className="border-1 rounded-3xl p-3 max-h-48 overflow-y-auto">
            <Streamdown>{result.document.page_content}</Streamdown>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleEdit}
              disabled={!chunkId || !documentId}
            >
              <Edit className="w-4 h-4 mr-1" />
              Chỉnh sửa
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleDelete}
              disabled={!chunkId || !documentId}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Xóa
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface DocumentListProps {
  onUploadClick: () => void;
}

export function DocumentList({ onUploadClick }: DocumentListProps) {
  const [data, setData] = useState<DocumentListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Chunk Search Mode
  const [chunkSearchMode, setChunkSearchMode] = useState(false);
  const [chunkSearchResults, setChunkSearchResults] = useState<
    ChunkSearchResult[]
  >([]);
  const [isSearchingChunks, setIsSearchingChunks] = useState(false);
  const [chunkSearchQuery, setChunkSearchQuery] = useState("");

  // Editing chunk from search results
  const [editingChunkData, setEditingChunkData] = useState<{
    documentId: number;
    chunkId: number;
    text: string;
  } | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Topic Filter
  const [topicsData, setTopicsData] = useState<TopicData>({});
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const [topicOpen, setTopicOpen] = useState(false);

  // Subtopic Filter
  const [selectedSubtopic, setSelectedSubtopic] = useState<string>("");
  const [subtopicOpen, setSubtopicOpen] = useState(false);

  // Derived available subtopics
  const availableSubtopics =
    selectedTopic && topicsData[selectedTopic]
      ? Array.isArray(topicsData[selectedTopic])
        ? topicsData[selectedTopic]
        : Object.keys(topicsData[selectedTopic])
      : [];

  // Actions
  const [viewingDocumentId, setViewingDocumentId] = useState<number | null>(
    null
  );
  const [editingDocument, setEditingDocument] =
    useState<DocumentResponse | null>(null);
  const [deletingDocumentId, setDeletingDocumentId] = useState<number | null>(
    null
  );
  const [deletingChunk, setDeletingChunk] = useState<{
    documentId: number;
    chunkId: number;
  } | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await getDocuments({
        page,
        size: pageSize,
        search: search || undefined,
        // We are passing topic filter, but standard backend might ignore it if not configured.
        // We will do client side Refinement if needed, or hope backend takes it.
        // Actually, let's just fetch and let the UI state dictate.
      });

      // Client-side filtering as fallback if backend ignores topic filter
      // (This is robust against "backend doesn't support it yet")
      if (selectedTopic && selectedTopic !== "all") {
        response.items = response.items.filter(
          (doc) => doc.document_metadata?.topic === selectedTopic
        );
      }

      if (selectedSubtopic && selectedSubtopic !== "all") {
        response.items = response.items.filter(
          (doc) => doc.document_metadata?.subtopic === selectedSubtopic
        );
      }

      setData(response);
    } catch (err) {
      console.error("Error fetching documents:", err);
      setError("Không thể tải danh sách tài liệu");
    } finally {
      setIsLoading(false);
    }
  }, [page, search, selectedTopic, selectedSubtopic]);

  const fetchTopics = async () => {
    try {
      const t = await getTopics();
      setTopicsData(t || {});
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (!chunkSearchMode) {
      fetchData();
    }
  }, [fetchData, chunkSearchMode]);

  // Refresh data periodically
  useEffect(() => {
    fetchTopics();
    const interval = setInterval(() => {
      if (data?.items.some((doc) => isProcessingStatus(doc.status))) {
        fetchData();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [data, fetchData]);

  const handleChunkSearch = async () => {
    if (!chunkSearchQuery.trim()) {
      setChunkSearchResults([]);
      return;
    }

    try {
      setIsSearchingChunks(true);
      setError(null);
      const results = await searchChunks(chunkSearchQuery.trim());
      setChunkSearchResults(results);
    } catch (err) {
      console.error("Error searching chunks:", err);
      setError("Không thể tìm kiếm chunks");
    } finally {
      setIsSearchingChunks(false);
    }
  };

  const handleDeleteClick = (id: number) => {
    setDeletingDocumentId(id);
  };

  const handleConfirmDelete = async () => {
    if (!deletingDocumentId) return;

    try {
      await deleteDocument(deletingDocumentId);
      setDeletingDocumentId(null);
      fetchData();
    } catch (err) {
      console.error("Error deleting document:", err);
      alert("Không thể xóa tài liệu");
    }
  };

  const handleEditSuccess = () => {
    setEditingDocument(null);
    fetchData();
  };

  const handleChunkEdit = async (
    documentId: number,
    chunkId: number,
    text: string
  ) => {
    setEditingChunkData({ documentId, chunkId, text });
  };

  const handleChunkEditSuccess = async () => {
    setEditingChunkData(null);
    // Refresh search results
    handleChunkSearch();
  };

  const handleChunkDelete = async (documentId: number, chunkId: number) => {
    setDeletingChunk({ documentId, chunkId });
  };

  const handleConfirmChunkDelete = async () => {
    if (!deletingChunk) return;

    try {
      await deleteDocumentChunk(
        deletingChunk.documentId,
        deletingChunk.chunkId
      );
      setDeletingChunk(null);
      // Refresh search results
      handleChunkSearch();
    } catch (err) {
      console.error("Error deleting chunk:", err);
      alert("Không thể xóa chunk");
    }
  };

  const renderListContent = () => {
    // Chunk search mode
    if (chunkSearchMode) {
      if (isSearchingChunks) {
        return (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        );
      }

      if (!chunkSearchQuery.trim()) {
        return (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Search />
              </EmptyMedia>
              <EmptyDescription>
                Nhập từ khóa và nhấn "Tìm kiếm" để tìm chunks trong tài liệu
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        );
      }

      if (chunkSearchResults.length === 0) {
        return (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Search />
              </EmptyMedia>
              <EmptyDescription>
                Không tìm thấy chunk nào phù hợp với "{chunkSearchQuery}"
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        );
      }

      return (
        <div className="space-y-4">
          {chunkSearchResults.map((result, idx) => (
            <ChunkSearchCard
              key={`${result.document.metadata.chunk_id || idx}-${idx}`}
              result={result}
              onEdit={handleChunkEdit}
              onDelete={handleChunkDelete}
            />
          ))}
        </div>
      );
    }

    // Normal document list mode
    if (isLoading && !data) {
      return (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      );
    } else if (data?.items.length == 0) {
      return (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileIcon />
            </EmptyMedia>
            <EmptyDescription>
              {search || selectedTopic || selectedSubtopic
                ? "Không tìm thấy kết quả phù hợp"
                : "Tải lên để cho chatbot học"}
            </EmptyDescription>
            {!search && !selectedTopic && !selectedSubtopic && (
              <Button
                onClick={onUploadClick}
                variant="outline"
                className="mt-4"
              >
                <Plus className="w-4 h-4 mr-2" /> Tải tài liệu
              </Button>
            )}
          </EmptyHeader>
        </Empty>
      );
    }

    if (error) {
      return <div className="text-center text-destructive p-8">{error}</div>;
    }

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data?.items.map((doc) => (
          <Card
            key={doc.id}
            className="overflow-hidden hover:shadow-md transition-shadow flex flex-col bg-white"
          >
            <CardHeader className="pb-0 flex-1">
              <div className="flex justify-between items-start gap-2">
                <CardTitle
                  className="text-lg font-medium leading-tight line-clamp-2"
                  title={doc.name}
                >
                  {doc.name}
                </CardTitle>
                <Badge
                  variant="secondary"
                  className={cn("shrink-0", DocumentStatusColors[doc.status])}
                >
                  {DocumentStatusLabels[doc.status] || doc.status}
                </Badge>
              </div>
              <CardDescription className="text-xs truncate">
                <div className="flex items-start gap-2 text-sm text-muted-foreground flex-col">
                  <span className="rounded-3xl  text-xs font-medium">
                    Chủ đề lớn: {doc.document_metadata?.topic || "No Topic"}
                  </span>
                  {doc.document_metadata?.subtopic && (
                    <>
                      <span className="rounded-3xl text-xs">
                        Thể loại: {doc.document_metadata.subtopic}
                      </span>
                    </>
                  )}
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              <div className="space-y-3">
                <div className="text-xs px-6 text-muted-foreground">
                  Cập nhật:{" "}
                  {new Date(doc.updated_at).toLocaleDateString("vi-VN")}
                </div>

                <div className="px-6 flex gap-2 pt-2 border-t mt-2">
                  <Button
                    variant="outline"
                    onClick={() => setViewingDocumentId(doc.id)}
                  >
                    <Layers className="w-4 h-4" />
                    Chunks
                  </Button>
                  <Button
                    variant="outline"
                    title="Chỉnh sửa"
                    onClick={() => setEditingDocument(doc)}
                  >
                    <Edit className="w-4 h-4 text-muted-foreground hover:text-primary" />
                    Chỉnh sửa
                  </Button>
                  <Button
                    variant="destructive"
                    title="Xóa"
                    onClick={() => handleDeleteClick(doc.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                    Xóa
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-lg border shadow-sm sticky top-0 z-10">
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
          {/* Search */}
          {chunkSearchMode ? (
            <div className="flex gap-2 w-full">
              <InputGroup className="flex-1">
                <InputGroupInput
                  value={chunkSearchQuery}
                  onChange={(e) => setChunkSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleChunkSearch();
                    }
                  }}
                  placeholder="Tìm kiếm chunks..."
                />
                <InputGroupAddon>
                  <Search />
                </InputGroupAddon>
              </InputGroup>
              <Button
                onClick={handleChunkSearch}
                disabled={isSearchingChunks || !chunkSearchQuery.trim()}
              >
                {isSearchingChunks ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                Tìm kiếm
              </Button>
            </div>
          ) : (
            <InputGroup>
              <InputGroupInput
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm tài liệu theo tên"
              />
              <InputGroupAddon>
                <Search />
              </InputGroupAddon>
            </InputGroup>
          )}

          {/* Chunk Search Toggle */}
          <div className="flex items-center  gap-2 whitespace-nowrap">
            <Switch
              id="chunk-search-mode"
              checked={chunkSearchMode}
              onCheckedChange={setChunkSearchMode}
            />
            <Label
              htmlFor="chunk-search-mode"
              className="text-sm cursor-pointer"
            >
              Tìm chunks
            </Label>
          </div>

          {/* Topic Filter - Hidden in chunk search mode */}
          {!chunkSearchMode && (
            <Popover open={topicOpen} onOpenChange={setTopicOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={topicOpen}
                  className="w-full sm:w-[200px] justify-between"
                >
                  {selectedTopic
                    ? selectedTopic === "all"
                      ? "Tất cả chủ đề"
                      : selectedTopic
                    : "Lọc theo chủ đề"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0">
                <Command>
                  <CommandInput placeholder="Tìm chủ đề..." />
                  <CommandList>
                    <CommandEmpty>Không tìm thấy.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="all"
                        onSelect={() => {
                          setSelectedTopic("");
                          setSelectedSubtopic(""); // Reset subtopic
                          setTopicOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedTopic === "" ? "opacity-100" : "opacity-0"
                          )}
                        />
                        Tất cả chủ đề
                      </CommandItem>
                      {Object.keys(topicsData).map((t) => (
                        <CommandItem
                          key={t}
                          value={t}
                          onSelect={(currentValue) => {
                            const newTopic =
                              currentValue === selectedTopic
                                ? ""
                                : currentValue;
                            setSelectedTopic(newTopic);
                            if (newTopic !== selectedTopic) {
                              setSelectedSubtopic(""); // Reset subtopic when topic changes
                            }
                            setTopicOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedTopic === t ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {t}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          )}

          {/* Subtopic Filter */}
          {!chunkSearchMode &&
            selectedTopic &&
            availableSubtopics.length > 0 && (
              <Popover open={subtopicOpen} onOpenChange={setSubtopicOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={subtopicOpen}
                    className="w-full sm:w-[200px] justify-between"
                  >
                    {selectedSubtopic
                      ? selectedSubtopic === "all"
                        ? "Tất cả chủ đề phụ"
                        : selectedSubtopic
                      : "Lọc theo chủ đề phụ"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                  <Command>
                    <CommandInput placeholder="Tìm chủ đề phụ..." />
                    <CommandList>
                      <CommandEmpty>Không tìm thấy.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="all"
                          onSelect={() => {
                            setSelectedSubtopic("");
                            setSubtopicOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedSubtopic === ""
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          Tất cả chủ đề phụ
                        </CommandItem>
                        {availableSubtopics.map((st) => (
                          <CommandItem
                            key={st}
                            value={st}
                            onSelect={(currentValue) => {
                              setSelectedSubtopic(
                                currentValue === selectedSubtopic
                                  ? ""
                                  : currentValue
                              );
                              setSubtopicOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedSubtopic === st
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {st}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {!chunkSearchMode && (
            <Button onClick={onUploadClick}>
              <Plus className="w-4 h-4 mr-2" />
              Thêm tài liệu
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() =>
              chunkSearchMode ? handleChunkSearch() : fetchData()
            }
          >
            <RefreshCw className="w-4 h-4" />
            Làm mới
          </Button>
        </div>
      </div>

      {renderListContent()}

      {/* Detail / Chunks Modal - Fullscreen */}
      <Dialog
        open={!!viewingDocumentId}
        onOpenChange={(open) => !open && setViewingDocumentId(null)}
      >
        <DialogContent
          showCloseButton={false}
          className="mb-8 flex h-[calc(100vh-2rem)] min-w-[calc(100vw-2rem)] flex-col justify-between gap-0 p-[2rem]"
        >
          {viewingDocumentId && (
            <div className="flex-1 w-full h-full overflow-hidden flex flex-col">
              <DocumentDetail
                documentId={viewingDocumentId}
                onBack={() => setViewingDocumentId(null)}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Modal - Fullscreen */}
      <Dialog
        open={!!editingDocument}
        onOpenChange={(open) => !open && setEditingDocument(null)}
      >
        <DialogContent
          showCloseButton={false}
          className="mb-8 flex h-auto max-h-[calc(100vh-2rem)] min-w-[calc(100vw-2rem)] flex-col justify-between gap-0"
        >
          <DialogHeader className="px-2 flex flex-row items-center justify-between">
            <div className="flex w-full items-center gap-4">
              <div className="flex-1"></div>
            </div>
          </DialogHeader>

          {editingDocument && (
            <div className="flex-1 overflow-auto">
              <div className="bg-white p-6 rounded-xl shadow-sm ">
                <DocumentUpload
                  initialData={editingDocument}
                  onSuccess={handleEditSuccess}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Chunk from Search Results Dialog */}
      <Dialog
        open={!!editingChunkData}
        onOpenChange={(open) => !open && setEditingChunkData(null)}
      >
        <DialogContent
          showCloseButton={false}
          className="mb-8 flex h-auto max-h-[calc(100vh-2rem)] min-w-[calc(100vw-2rem)] flex-col justify-between gap-0 p-[2rem]"
        >
          <DialogHeader className="px-6 flex flex-row items-center justify-between">
            <DialogTitle>Chỉnh sửa Chunk</DialogTitle>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setEditingChunkData(null)}
              >
                <X className="w-4 h-4 mr-2" />
                Hủy
              </Button>
              <Button
                onClick={async () => {
                  if (!editingChunkData) return;
                  try {
                    await updateDocumentChunk(
                      editingChunkData.documentId,
                      editingChunkData.chunkId,
                      { text: editingChunkData.text }
                    );
                    handleChunkEditSuccess();
                  } catch (err) {
                    console.error("Error saving chunk:", err);
                    alert("Không thể lưu chunk. Vui lòng thử lại.");
                  }
                }}
              >
                <Save className="w-4 h-4 mr-2" />
                Lưu thay đổi
              </Button>
            </div>
          </DialogHeader>

          <div className="h-full overflow-auto p-6">
            <div className="space-y-4 h-full mx-auto">
              <div className="space-y-2 h-full">
                <MinimalTiptap
                  content={editingChunkData?.text || ""}
                  onChange={(text) => {
                    if (editingChunkData) {
                      setEditingChunkData({ ...editingChunkData, text });
                    }
                  }}
                  placeholder="Nhập nội dung chunk..."
                  className="min-h-[400px] h-full"
                  onImageUpload={async (file: File) => {
                    try {
                      const url = await uploadFile(file);
                      return url;
                    } catch (error) {
                      console.error("Failed to upload image:", error);
                      alert("Không thể tải lên hình ảnh. Vui lòng thử lại.");
                      throw error;
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!deletingDocumentId}
        onOpenChange={(open) => !open && setDeletingDocumentId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xóa tài liệu</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa tài liệu này?
              <br />
              Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setDeletingDocumentId(null)}
            >
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              Xóa
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Chunk Delete Confirmation Dialog */}
      <Dialog
        open={!!deletingChunk}
        onOpenChange={(open) => !open && setDeletingChunk(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xóa Chunk</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa chunk này?
              <br />
              Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeletingChunk(null)}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleConfirmChunkDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              Xóa
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
