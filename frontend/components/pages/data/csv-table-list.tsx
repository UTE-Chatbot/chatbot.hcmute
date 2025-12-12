"use client";

import { useState, useEffect, useCallback } from "react";
import { getCSVTables, deleteCSVTable } from "@/services/csv_table.service";
import {
  CSVTableResponse,
  CSVTableListResponse,
  ColumnTypeLabels,
} from "@/types/csv-table";
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
  Database,
  Edit,
  Trash2,
  RefreshCw,
  Search,
  FileSpreadsheet,
  Plus,
} from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
} from "@/components/ui/empty";

interface CSVTableListProps {
  onAdd?: () => void;
  onEdit?: (table: CSVTableResponse) => void;
}

export function CSVTableList({ onAdd, onEdit }: CSVTableListProps) {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<CSVTableListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [viewingTable, setViewingTable] = useState<CSVTableResponse | null>(
    null
  );
  const [deletingTableId, setDeletingTableId] = useState<number | null>(null);
  const pageSize = 9;

  const loadTables = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await getCSVTables({
        page,
        size: pageSize,
        search: search || undefined,
      });
      setData(response);
    } catch (err) {
      setError("Không thể tải danh sách bảng dữ liệu");
      console.error("Error loading CSV tables:", err);
    } finally {
      setIsLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    loadTables();
  }, [loadTables]);

  const handleRefresh = useCallback(() => {
    loadTables();
  }, [loadTables]);

  const handleDelete = async (tableId: number) => {
    setDeletingTableId(tableId);
  };

  const handleConfirmDelete = async () => {
    if (!deletingTableId) return;

    try {
      await deleteCSVTable(deletingTableId);
      setDeletingTableId(null);
      loadTables();
    } catch (err) {
      console.error("Error deleting table:", err);
      alert("Không thể xóa bảng dữ liệu. Vui lòng thử lại.");
    }
  };

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

  const renderListContent = () => {
    if (isLoading && !data) {
      return (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (tables.length === 0) {
      return (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileSpreadsheet />
            </EmptyMedia>
            <EmptyDescription>
              {search
                ? "Không tìm thấy bảng dữ liệu phù hợp"
                : "Chưa có bảng dữ liệu nào"}
            </EmptyDescription>
            {!search && onAdd && (
              <Button onClick={onAdd} variant="outline" className="mt-4">
                <Plus className="w-4 h-4 mr-2" /> Tạo bảng dữ liệu
              </Button>
            )}
          </EmptyHeader>
        </Empty>
      );
    }

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tables.map((table: CSVTableResponse) => (
          <Card
            key={table.id}
            className="overflow-hidden hover:shadow-md transition-shadow flex flex-col bg-white"
          >
            <CardHeader className="pb-3 flex-1">
              <div className="flex justify-between items-start gap-2">
                <CardTitle className="text-lg font-medium leading-tight line-clamp-2">
                  {table.name}
                </CardTitle>
                <Badge variant="outline" className="shrink-0">
                  {table.columns.length} cột
                </Badge>
              </div>
              <CardDescription className="line-clamp-2">
                {table.description || "Không có mô tả"}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              <div className="space-y-3">
                {/* Columns Preview */}
                <div className="flex flex-wrap gap-2 px-6">
                  {table.columns.slice(0, 3).map((col, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {col.name}: {ColumnTypeLabels[col.type]}
                    </Badge>
                  ))}
                  {table.columns.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{table.columns.length - 3} cột
                    </Badge>
                  )}
                </div>

                {/* Timestamp */}
                <div className="text-xs px-6 text-muted-foreground">
                  Tạo lúc: {new Date(table.created_at).toLocaleString("vi-VN")}
                </div>

                {/* Actions */}
                <div className="px-6 flex gap-2 pt-2 border-t mt-2">
                  <Button
                    variant="outline"
                    onClick={() => setViewingTable(table)}
                  >
                    <Database className="w-4 h-4 mr-1" />
                    Chi tiết
                  </Button>
                  {onEdit && (
                    <Button variant="outline" onClick={() => onEdit(table)}>
                      <Edit className="w-4 h-4 mr-1" />
                      Chỉnh sửa
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    onClick={() => handleDelete(table.id)}
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
      {/* Top Bar: Search, Add, Refresh */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-lg border shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-4 w-full">
          <InputGroup className="flex-1 w-full">
            <InputGroupInput
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSearch(e.target.value)
              }
              placeholder="Tìm bảng dữ liệu theo tên"
            />
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
          </InputGroup>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {onAdd && (
            <Button onClick={onAdd}>
              <Plus className="w-4 h-4 mr-2" />
              Thêm bảng
            </Button>
          )}
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw
              className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
            />
            Làm mới
          </Button>
        </div>
      </div>

      {/* List Content */}
      {renderListContent()}

      {/* Pagination */}
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

      {/* Detail Dialog */}
      <Dialog
        open={!!viewingTable}
        onOpenChange={(open) => !open && setViewingTable(null)}
      >
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              {viewingTable?.name}
            </DialogTitle>
            <DialogDescription>
              {viewingTable?.description || "Không có mô tả"}
            </DialogDescription>
          </DialogHeader>

          {viewingTable && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold mb-2">File CSV:</h3>
                <a
                  href={viewingTable.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline break-all"
                >
                  {viewingTable.url}
                </a>
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-2">Cấu trúc bảng:</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-2 font-semibold">Tên cột</th>
                        <th className="text-left p-2 font-semibold">
                          Kiểu dữ liệu
                        </th>
                        <th className="text-left p-2 font-semibold">
                          Phân loại
                        </th>
                        <th className="text-left p-2 font-semibold">Mô tả</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewingTable.columns.map((col, idx) => (
                        <tr key={idx} className="border-t">
                          <td className="p-2 font-mono">{col.name}</td>
                          <td className="p-2">
                            <span className="px-2 py-1 bg-primary/10  rounded-3xl text-primary rounded text-xs">
                              {ColumnTypeLabels[col.type]}
                            </span>
                          </td>
                          <td className="p-2">
                            {col.is_categorical ? (
                              <span className="text-green-600 ">✓</span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="p-2 text-muted-foreground">
                            {col.description || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                Tạo lúc:{" "}
                {new Date(viewingTable.created_at).toLocaleString("vi-VN")}
                {viewingTable.updated_at && (
                  <>
                    {" • "}
                    Cập nhật:{" "}
                    {new Date(viewingTable.updated_at).toLocaleString("vi-VN")}
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deletingTableId}
        onOpenChange={(open) => !open && setDeletingTableId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xóa bảng dữ liệu</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa bảng dữ liệu này?
              <br />
              Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeletingTableId(null)}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              Xóa
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
