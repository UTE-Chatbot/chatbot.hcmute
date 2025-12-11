"use client";

import { useState, useEffect, useCallback } from "react";
import { getCSVTables, deleteCSVTable } from "@/services/csv_table.service";
import { CSVTableResponse, CSVTableListResponse } from "@/types/csv-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Database, Edit, Trash2, RefreshCw, ExternalLink } from "lucide-react";

interface CSVTableListProps {
  onEdit?: (table: CSVTableResponse) => void;
  onDelete?: (tableId: number) => void;
}

export function CSVTableList({ onEdit, onDelete }: CSVTableListProps) {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<CSVTableListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pageSize = 10;

  const loadTables = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await getCSVTables({ page, size: pageSize });
      setData(response);
    } catch (err) {
      setError("Không thể tải danh sách bảng dữ liệu");
      console.error("Error loading CSV tables:", err);
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadTables();
  }, [loadTables]);

  const handleRefresh = useCallback(() => {
    loadTables();
  }, [loadTables]);

  const handleDelete = async (tableId: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa bảng dữ liệu này?")) {
      return;
    }

    try {
      await deleteCSVTable(tableId);
      loadTables();
      onDelete?.(tableId);
    } catch (err) {
      console.error("Error deleting table:", err);
      alert("Không thể xóa bảng dữ liệu. Vui lòng thử lại.");
    }
  };

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-destructive p-4">
        <p>{error}</p>
        <Button variant="outline" onClick={handleRefresh} className="mt-4">
          Thử lại
        </Button>
      </div>
    );
  }

  const tables = data?.items || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          Tổng số: {total} bảng dữ liệu
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Làm mới
        </Button>
      </div>

      <div className="space-y-3">
        {tables.map((table: CSVTableResponse) => (
          <Card key={table.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    {table.name}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {table.description || "Không có mô tả"}
                  </CardDescription>
                </div>
                <Badge variant="outline">
                  {table.columns.length} cột
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* URL */}
                {table.url && (
                  <div className="flex items-center gap-2 text-sm">
                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                    <a
                      href={table.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline truncate"
                    >
                      {table.url}
                    </a>
                  </div>
                )}

                {/* Columns Preview */}
                <div className="flex flex-wrap gap-2">
                  {table.columns.slice(0, 5).map((col, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {col.name}: {col.type}
                    </Badge>
                  ))}
                  {table.columns.length > 5 && (
                    <Badge variant="secondary" className="text-xs">
                      +{table.columns.length - 5} cột khác
                    </Badge>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2">
                  <div className="text-xs text-muted-foreground">
                    Tạo lúc: {new Date(table.created_at).toLocaleString("vi-VN")}
                  </div>
                  <div className="flex gap-2">
                    {onEdit && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(table)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Xem chi tiết
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(table.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Xóa
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Trước
          </Button>
          <span className="text-sm">
            Trang {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Sau
          </Button>
        </div>
      )}
    </div>
  );
}
