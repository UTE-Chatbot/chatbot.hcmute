"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowRight, Database, FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DocumentList } from "@/components/pages/data/document-list";
import { DocumentUpload } from "@/components/pages/data/document-upload";
import { CSVTableList } from "@/components/pages/data/csv-table-list";
import { CSVTableCreate } from "@/components/pages/data/csv-table-create";
import { CSVTableResponse } from "@/types/csv-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function DataManagementPage() {
  const [activeTab, setActiveTab] = useState("table");
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);
  const [showCSVTableCreate, setShowCSVTableCreate] = useState(false);

  // Document List handles editing internally now
  const [viewingCSVTable, setViewingCSVTable] =
    useState<CSVTableResponse | null>(null);
  const [documentListKey, setDocumentListKey] = useState(0);
  const [csvTableListKey, setCsvTableListKey] = useState(0);

  const handleDocumentUploadSuccess = () => {
    setShowDocumentUpload(false);
    setDocumentListKey((k) => k + 1); // Force refresh document list
  };

  const handleCSVTableCreateSuccess = () => {
    setShowCSVTableCreate(false);
    setCsvTableListKey((k) => k + 1); // Force refresh CSV table list
  };

  const handleViewCSVTable = (table: CSVTableResponse) => {
    setViewingCSVTable(table);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý dữ liệu</h1>
          <p className="text-muted-foreground mt-2">
            Quản lý dữ liệu bảng và tài liệu trong hệ thống
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="table" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            Dữ liệu bảng
          </TabsTrigger>
          <TabsTrigger value="document" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Tài liệu
          </TabsTrigger>
        </TabsList>

        <TabsContent value="table" className="mt-6 space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowCSVTableCreate(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Tạo bảng dữ liệu mới
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Danh sách bảng dữ liệu</CardTitle>
              <CardDescription>
                Xem và quản lý các bảng dữ liệu CSV trong hệ thống
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CSVTableList key={csvTableListKey} onEdit={handleViewCSVTable} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="document" className="mt-6 space-y-4">
          <DocumentList
            key={documentListKey}
            onUploadClick={() => setShowDocumentUpload(true)}
          />
        </TabsContent>
      </Tabs>

      {/* Document Upload Modal (Create) - Fullscreen */}
      <Dialog open={showDocumentUpload} onOpenChange={setShowDocumentUpload}>
        <DialogContent
          showCloseButton={false}
          className="mb-8 flex h-auto max-h-[calc(100vh-2rem)] min-w-[calc(100vw-2rem)] flex-col justify-between gap-0"
        >
          <DialogHeader className="px-2 flex flex-row items-center justify-between">
            <div className="flex w-full items-center gap-4">
              <div className="flex-1"></div>

              <Button
                variant="destructive"
                effect="expandIcon"
                iconPlacement="right"
                icon={ArrowRight}
                onClick={() => {
                  setShowDocumentUpload(false);
                }}
              >
                Thoát
              </Button>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-auto p-6">
            <div>
              <DocumentUpload onSuccess={handleDocumentUploadSuccess} />
              <div className="mt-8 pt-4 border-t flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowDocumentUpload(false)}
                >
                  Hủy và Đóng
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* CSV Table Create Modal */}
      <Dialog open={showCSVTableCreate} onOpenChange={setShowCSVTableCreate}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <CSVTableCreate onSuccess={handleCSVTableCreateSuccess} />
        </DialogContent>
      </Dialog>

      {/* CSV Table Detail Dialog */}
      <Dialog
        open={!!viewingCSVTable}
        onOpenChange={() => setViewingCSVTable(null)}
      >
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              {viewingCSVTable?.name}
            </DialogTitle>
            <DialogDescription>
              {viewingCSVTable?.description || "Không có mô tả"}
            </DialogDescription>
          </DialogHeader>

          {viewingCSVTable && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold mb-2">URL:</h3>
                <a
                  href={viewingCSVTable.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline break-all"
                >
                  {viewingCSVTable.url}
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
                      {viewingCSVTable.columns.map((col, idx) => (
                        <tr key={idx} className="border-t">
                          <td className="p-2 font-mono">{col.name}</td>
                          <td className="p-2">
                            <span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs">
                              {col.type}
                            </span>
                          </td>
                          <td className="p-2">
                            {col.is_categorical ? (
                              <span className="text-green-600">✓</span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="p-2 text-muted-foreground">
                            {col.description}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                Tạo lúc:{" "}
                {new Date(viewingCSVTable.created_at).toLocaleString("vi-VN")}
                {viewingCSVTable.updated_at && (
                  <>
                    {" "}
                    • Cập nhật:{" "}
                    {new Date(viewingCSVTable.updated_at).toLocaleString(
                      "vi-VN"
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
