"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getDocumentById,
  getDocumentChunks,
  updateDocumentChunk,
  deleteDocumentChunk,
} from "@/services/document.service";
import {
  DocumentResponse,
  DocumentChunkResponse,
  DocumentStatusLabels,
  DocumentStatus,
  DocumentStatusColors,
} from "@/types/document";
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
  ArrowLeft,
  FileText,
  Edit,
  RefreshCw,
  Save,
  X,
  DoorOpenIcon,
  ArrowRight,
  Trash2,
} from "lucide-react";
import { TiptapEditor } from "./tiptap-editor";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface DocumentDetailProps {
  documentId: number;
  onBack?: () => void;
}

export function DocumentDetail({ documentId, onBack }: DocumentDetailProps) {
  const [document, setDocument] = useState<DocumentResponse | null>(null);
  const [chunks, setChunks] = useState<DocumentChunkResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingChunk, setEditingChunk] =
    useState<DocumentChunkResponse | null>(null);
  const [deletingChunk, setDeletingChunk] =
    useState<DocumentChunkResponse | null>(null);
  const [editedContent, setEditedContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  const loadDocument = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const doc = await getDocumentById(documentId);
      setDocument(doc);
    } catch (err) {
      setError("Không thể tải thông tin tài liệu");
      console.error("Error loading document:", err);
    } finally {
      setIsLoading(false);
    }
  }, [documentId]);

  const loadChunks = useCallback(async () => {
    try {
      const response = await getDocumentChunks(documentId, {
        page,
        size: pageSize,
        sort: "chunk_index:asc",
      });
      setChunks(response.items);
      setTotal(response.total);
    } catch (err) {
      console.error("Error loading chunks:", err);
    }
  }, [documentId, page]);

  useEffect(() => {
    loadDocument();
  }, [loadDocument]);

  useEffect(() => {
    loadChunks();
  }, [loadChunks]);

  const handleEditChunk = (chunk: DocumentChunkResponse) => {
    setEditingChunk(chunk);
    setEditedContent(chunk.text);
  };

  const handleSaveChunk = async () => {
    if (!editingChunk) return;

    try {
      setIsSaving(true);
      await updateDocumentChunk(documentId, editingChunk.id, {
        text: editedContent,
      });

      await loadChunks();
      setEditingChunk(null);
      setEditedContent("");
    } catch (err) {
      console.error("Error saving chunk:", err);
      alert("Không thể lưu chunk. Vui lòng thử lại.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingChunk(null);
    setEditedContent("");
  };

  const handleConfirmDelete = async () => {
    if (!deletingChunk) return;

    try {
      setIsSaving(true);
      await deleteDocumentChunk(documentId, deletingChunk.id);
      await loadChunks();
      setDeletingChunk(null);
    } catch (err) {
      console.error("Error deleting chunk:", err);
      alert("Không thể xóa chunk. Vui lòng thử lại.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading && !document) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6" />
            <h1 className="text-2xl font-bold tracking-tight">
              {document?.name}
            </h1>
            <Badge
              className={`ml-2 ${
                DocumentStatusColors[document?.status as DocumentStatus]
              }`}
            >
              {DocumentStatusLabels[document?.status as DocumentStatus]}
            </Badge>
          </div>
        </div>
        <Button variant="outline" onClick={loadChunks}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Làm mới
        </Button>

        {onBack && (
          <Button
            variant="destructive"
            effect="expandIcon"
            iconPlacement="right"
            icon={ArrowRight}
            onClick={onBack}
          >
            Thoát
          </Button>
        )}
      </div>

      {/* Chunks List */}
      <Card className="bg-white">
        <CardHeader className="bg-white">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Danh sách Chunks</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className=" bg-white">
          {chunks.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Chưa có chunk nào</p>
            </div>
          ) : (
            <div className="space-y-3">
              {chunks.map((chunk) => (
                <Card
                  key={chunk.id}
                  className="hover:border-primary bg-white  cursor-pointer transition-colors"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <Badge variant="outline" className="font-mono">
                          #{chunk.chunk_index}
                        </Badge>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm line-clamp-3 text-muted-foreground">
                          {chunk.text}
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <span>ID: {chunk.id}</span>
                          {chunk.point_id && (
                            <span>
                              • Vector: {chunk.point_id.slice(0, 8)}...
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex-shrink-0 flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditChunk(chunk)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setDeletingChunk(chunk)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editingChunk} onOpenChange={() => handleCancelEdit()}>
        <DialogContent
          showCloseButton={false}
          className="mb-8 flex h-auto max-h-[calc(100vh-8rem)] min-w-[calc(100vw-8rem)] flex-col justify-between gap-0 p-[2rem]"
        >
          <DialogHeader className="px-6 flex flex-row items-center justify-between">
            <DialogTitle>
              Chỉnh sửa Chunk #{editingChunk?.chunk_index}
            </DialogTitle>
            <div className="flex justify-end  gap-2">
              <Button
                variant="outline"
                onClick={handleCancelEdit}
                disabled={isSaving}
              >
                <X className="w-4 h-4 mr-2" />
                Hủy
              </Button>
              <Button onClick={handleSaveChunk} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Lưu thay đổi
                  </>
                )}
              </Button>
            </div>
          </DialogHeader>

          <div className="h-full overflow-auto p-6">
            <div className="space-y-4 h-full  mx-auto">
              <div className="space-y-2 h-full">
                <TiptapEditor
                  content={editedContent}
                  onChange={setEditedContent}
                  placeholder="Nhập nội dung chunk..."
                />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!deletingChunk}
        onOpenChange={() => setDeletingChunk(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xóa Chunk</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa Chunk #{deletingChunk?.chunk_index}?
              <br />
              Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setDeletingChunk(null)}
              disabled={isSaving}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Đang xóa...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Xóa
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
