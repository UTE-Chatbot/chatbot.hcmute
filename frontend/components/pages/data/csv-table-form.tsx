"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Database,
  Plus,
  X,
  Upload,
  FileSpreadsheet,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { uploadFile } from "@/services/file.service";
import { createCSVTable, updateCSVTable } from "@/services/csv_table.service";
import type {
  CSVTableCreate,
  CSVTableColumnInput,
  CSVTableResponse,
  ColumnType,
} from "@/types/csv-table";
import { ColumnTypeLabels, ColumnTypeDescriptions } from "@/types/csv-table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface CSVTableFormProps {
  initialData?: CSVTableResponse;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CSVTableForm({
  initialData,
  onSuccess,
  onCancel,
}: CSVTableFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(
    initialData?.description || ""
  );
  const [columns, setColumns] = useState<CSVTableColumnInput[]>(
    initialData?.columns || [
      {
        name: "",
        type: "TEXT" as ColumnType,
        description: "",
        is_categorical: false,
      },
    ]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [csvPreview, setCsvPreview] = useState<string[][] | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [preservedColumns, setPreservedColumns] = useState<Set<string>>(
    new Set()
  );

  const isEditMode = !!initialData;

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setDescription(initialData.description || "");
      setColumns(initialData.columns);
    }
  }, [initialData]);

  const parseCSV = (text: string): string[][] => {
    const lines = text.split("\n").filter((line) => line.trim());
    return lines.map((line) => {
      // Simple CSV parsing (handles basic cases)
      const values: string[] = [];
      let current = "";
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          values.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      values.push(current.trim());

      return values;
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    if (!selectedFile.name.endsWith(".csv")) {
      setError("Vui lòng chọn file CSV");
      return;
    }

    setFile(selectedFile);
    setError(null);
    setPreviewError(null);

    if (!name) {
      setName(selectedFile.name.replace(".csv", ""));
    }

    // Parse CSV for preview and column detection
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const rows = parseCSV(text);

        if (rows.length === 0) {
          setPreviewError("File CSV trống");
          return;
        }

        setCsvPreview(rows);

        // Auto-detect columns from header
        const headers = rows[0];
        if (headers.length > 0) {
          if (isEditMode && initialData) {
            // In edit mode: compare new headers with existing columns
            const existingColumnMap = new Map(
              columns.map((col) => [col.name.toLowerCase().trim(), col])
            );

            const preserved = new Set<string>();

            const newColumns = headers.map((header) => {
              const trimmedHeader = header.trim();
              const existingColumn = existingColumnMap.get(
                trimmedHeader.toLowerCase()
              );

              if (existingColumn) {
                // Column name matches: preserve all existing data
                preserved.add(trimmedHeader.toLowerCase());
                return {
                  name: trimmedHeader, // Use new header for consistent naming
                  type: existingColumn.type,
                  description: existingColumn.description,
                  is_categorical: existingColumn.is_categorical,
                };
              } else {
                // New column: create with defaults
                return {
                  name: trimmedHeader,
                  type: "TEXT" as ColumnType,
                  description: "",
                  is_categorical: false,
                };
              }
            });

            setColumns(newColumns);
            setPreservedColumns(preserved);
          } else {
            // Create mode: generate new columns
            const newColumns = headers.map((header) => ({
              name: header,
              type: "TEXT" as ColumnType,
              description: "",
              is_categorical: false,
            }));
            setColumns(newColumns);
          }
        }
      } catch (err) {
        console.error("Error parsing CSV:", err);
        setPreviewError(
          "Không thể đọc file CSV. Vui lòng kiểm tra định dạng file."
        );
      }
    };
    reader.onerror = () => {
      setPreviewError("Lỗi khi đọc file");
    };
    reader.readAsText(selectedFile);
  };

  const handleRemoveFile = () => {
    setFile(null);
    setCsvPreview(null);
    setPreviewError(null);
    setPreservedColumns(new Set());

    // Restore original columns when removing file in edit mode
    if (isEditMode && initialData) {
      setColumns(initialData.columns);
    }
  };

  const handleAddColumn = () => {
    setColumns([
      ...columns,
      {
        name: "",
        type: "TEXT" as ColumnType,
        description: "",
        is_categorical: false,
      },
    ]);
  };

  const handleRemoveColumn = (index: number) => {
    if (columns.length <= 1) return;
    setColumns(columns.filter((_, i) => i !== index));
  };

  const handleColumnChange = (
    index: number,
    field: keyof CSVTableColumnInput,
    value: string | boolean
  ) => {
    const newColumns = [...columns];
    newColumns[index] = { ...newColumns[index], [field]: value };
    setColumns(newColumns);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!name.trim()) {
      setError("Vui lòng nhập tên bảng dữ liệu");
      return;
    }

    if (!isEditMode && !file) {
      setError("Vui lòng tải lên file CSV");
      return;
    }

    const validColumns = columns.filter((col) => col.name.trim() !== "");
    if (validColumns.length === 0) {
      setError("Vui lòng thêm ít nhất một cột");
      return;
    }

    try {
      setIsSubmitting(true);

      let fileUrl = initialData?.url;

      // Upload new file if provided
      if (file) {
        fileUrl = await uploadFile(file);
      }

      if (!fileUrl) {
        setError("Không thể tải file lên. Vui lòng thử lại.");
        return;
      }

      const tableData: CSVTableCreate = {
        name: name.trim(),
        url: fileUrl,
        description: description.trim() || undefined,
        columns: validColumns,
      };

      if (isEditMode && initialData) {
        await updateCSVTable(initialData.id, tableData);
      } else {
        await createCSVTable(tableData);
      }

      onSuccess?.();
    } catch (err) {
      console.error("Error saving CSV table:", err);
      setError(
        `Không thể ${
          isEditMode ? "cập nhật" : "tạo"
        } bảng dữ liệu. Vui lòng thử lại.`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {isEditMode ? "Chỉnh sửa bảng dữ liệu" : "Tạo bảng dữ liệu CSV mới"}
          </h2>
          <p className="text-muted-foreground mt-1">
            {isEditMode
              ? "Cập nhật thông tin và cấu trúc bảng dữ liệu"
              : "Tải lên file CSV và định nghĩa cấu trúc các cột"}
          </p>
        </div>
        {onCancel && (
          <Button
            variant="destructive"
            effect="expandIcon"
            iconPlacement="right"
            icon={ArrowRight}
            onClick={onCancel}
          >
            Thoát
          </Button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Thông tin cơ bản</CardTitle>
            <CardDescription>Tên và mô tả cho bảng dữ liệu</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Table Name */}
            <div className="space-y-2">
              <Label htmlFor="table-name">Tên bảng *</Label>
              <Input
                id="table-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ví dụ: thong_tin_sinh_vien"
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground">
                Đặt tên ngắn gọn, dễ hiểu cho bảng dữ liệu
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả về nội dung và mục đích sử dụng của bảng dữ liệu..."
                rows={3}
                disabled={isSubmitting}
              />
            </div>
          </CardContent>
        </Card>

        {/* CSV File Upload */}
        <Card>
          <CardHeader>
            <CardTitle>File CSV {isEditMode ? "(Tùy chọn)" : "*"}</CardTitle>
            <CardDescription>
              {isEditMode
                ? "Tải lên file CSV mới nếu muốn thay đổi dữ liệu"
                : "Tải lên file CSV chứa dữ liệu của bạn"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!file && !isEditMode ? (
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 hover:border-muted-foreground/50 transition-colors">
                <label
                  htmlFor="csv-upload"
                  className="flex flex-col items-center cursor-pointer"
                >
                  <Upload className="w-12 h-12 text-muted-foreground mb-3" />
                  <span className="text-sm font-medium text-muted-foreground mb-1">
                    Nhấp để chọn file CSV hoặc kéo thả file vào đây
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Các cột sẽ được tự động phát hiện từ dòng đầu tiên
                  </span>
                  <input
                    id="csv-upload"
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    accept=".csv"
                    disabled={isSubmitting}
                  />
                </label>
              </div>
            ) : file ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                  <FileSpreadsheet className="w-8 h-8 text-primary" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveFile}
                    disabled={isSubmitting}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {/* CSV Preview */}
                {csvPreview && csvPreview.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-muted px-4 py-2 border-b">
                      <h4 className="text-sm font-semibold">
                        Xem trước dữ liệu
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Hiển thị {Math.min(5, csvPreview.length)} dòng đầu tiên
                      </p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-muted/50">
                          <tr>
                            {csvPreview[0]?.map((header, idx) => (
                              <th
                                key={idx}
                                className="text-left p-2 font-semibold whitespace-nowrap"
                              >
                                {header || `Cột ${idx + 1}`}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {csvPreview.slice(1, 6).map((row, rowIdx) => (
                            <tr key={rowIdx} className="border-t">
                              {row.map((cell, cellIdx) => (
                                <td
                                  key={cellIdx}
                                  className="p-2 whitespace-nowrap"
                                >
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Column Comparison Info */}
                {isEditMode && preservedColumns.size > 0 && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 mt-0.5 text-blue-600 dark:text-blue-400 shrink-0" />
                      <div className="text-sm text-blue-900 dark:text-blue-100">
                        <p className="font-medium mb-1">
                          Đã so sánh cột với dữ liệu hiện tại
                        </p>
                        <p className="text-xs">
                          • {preservedColumns.size} cột giữ nguyên thông tin
                          (kiểu dữ liệu, mô tả)
                          <br />• {columns.length - preservedColumns.size} cột
                          mới với cấu hình mặc định
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {previewError && (
                  <div className="flex items-start gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{previewError}</span>
                  </div>
                )}
              </div>
            ) : isEditMode ? (
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Đang sử dụng file:{" "}
                  <a
                    href={initialData?.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {initialData?.url}
                  </a>
                </div>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                  <label
                    htmlFor="csv-upload"
                    className="flex flex-col items-center cursor-pointer"
                  >
                    <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">
                      Nhấp để tải lên file CSV mới
                    </span>
                    <input
                      id="csv-upload"
                      type="file"
                      className="hidden"
                      onChange={handleFileChange}
                      accept=".csv"
                      disabled={isSubmitting}
                    />
                  </label>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Columns Definition */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Định nghĩa các cột *</CardTitle>
                <CardDescription>
                  Xác định tên, kiểu dữ liệu và mô tả cho từng cột
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddColumn}
                disabled={isSubmitting}
              >
                <Plus className="w-4 h-4 mr-2" />
                Thêm cột
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {columns.map((column, index) => {
                const isPreserved = preservedColumns.has(
                  column.name.toLowerCase().trim()
                );
                return (
                  <div
                    key={index}
                    className={cn(
                      "p-4 border rounded-lg bg-card space-y-3",
                      isEditMode &&
                        file &&
                        isPreserved &&
                        "border-green-500/50 bg-green-50/50 dark:bg-green-950/20",
                      isEditMode &&
                        file &&
                        !isPreserved &&
                        "border-blue-500/50 bg-blue-50/50 dark:bg-blue-950/20"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          Cột {index + 1}
                        </span>
                        {isEditMode && file && (
                          <Badge
                            variant={isPreserved ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {isPreserved ? "Giữ nguyên" : "Mới"}
                          </Badge>
                        )}
                      </div>
                      {columns.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveColumn(index)}
                          disabled={isSubmitting}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Tên cột</Label>
                        <Input
                          value={column.name}
                          onChange={(e) =>
                            handleColumnChange(index, "name", e.target.value)
                          }
                          placeholder="student_id"
                          disabled={isSubmitting}
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">Kiểu dữ liệu</Label>
                        <Select
                          value={column.type}
                          onValueChange={(value) =>
                            handleColumnChange(index, "type", value)
                          }
                          disabled={isSubmitting}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(ColumnTypeLabels).map(
                              ([type, label]) => (
                                <SelectItem key={type} value={type}>
                                  <div className="flex flex-col">
                                    <span className="font-medium">{label}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {
                                        ColumnTypeDescriptions[
                                          type as ColumnType
                                        ]
                                      }
                                    </span>
                                  </div>
                                </SelectItem>
                              )
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Mô tả</Label>
                      <Input
                        value={column.description}
                        onChange={(e) =>
                          handleColumnChange(
                            index,
                            "description",
                            e.target.value
                          )
                        }
                        placeholder="Mô tả ý nghĩa của cột này..."
                        disabled={isSubmitting}
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`categorical-${index}`}
                        checked={column.is_categorical}
                        onCheckedChange={(checked: boolean) =>
                          handleColumnChange(
                            index,
                            "is_categorical",
                            checked === true
                          )
                        }
                        disabled={isSubmitting}
                      />
                      <Label
                        htmlFor={`categorical-${index}`}
                        className="text-xs font-normal cursor-pointer"
                      >
                        Dữ liệu phân loại (có số lượng giá trị hữu hạn, ví dụ:
                        giới tính, khoa)
                      </Label>
                    </div>

                    <Badge variant="outline" className="text-xs">
                      {ColumnTypeLabels[column.type]}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Error Message */}
        {error && (
          <div className="flex items-start gap-2 p-4 bg-destructive/10 text-destructive rounded-lg">
            <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex gap-3">
          <Button type="submit" className="flex-1" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Database className="w-4 h-4 mr-2 animate-pulse" />
                {isEditMode ? "Đang cập nhật..." : "Đang tạo..."}
              </>
            ) : (
              <>
                <Database className="w-4 h-4 mr-2" />
                {isEditMode ? "Cập nhật bảng dữ liệu" : "Tạo bảng dữ liệu"}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
