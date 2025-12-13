"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Database, FileText } from "lucide-react";
import { DocumentList } from "@/components/pages/data/document-list";
import { DocumentUpload } from "@/components/pages/data/document-upload";
import { CSVTableList } from "@/components/pages/data/csv-table-list";
import { CSVTableForm } from "@/components/pages/data/csv-table-form";
import { CSVTableResponse } from "@/types/csv-table";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export default function DataManagementPage() {
  const [activeTab, setActiveTab] = useState("table");
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);
  const [showCSVTableForm, setShowCSVTableForm] = useState(false);
  const [editingCSVTable, setEditingCSVTable] =
    useState<CSVTableResponse | null>(null);
  const [documentListKey, setDocumentListKey] = useState(0);
  const [csvTableListKey, setCsvTableListKey] = useState(0);

  const handleDocumentUploadSuccess = () => {
    setShowDocumentUpload(false);
    setDocumentListKey((k) => k + 1);
  };

  const handleCSVTableFormSuccess = () => {
    setShowCSVTableForm(false);
    setEditingCSVTable(null);
    setCsvTableListKey((k) => k + 1);
  };

  const handleAddCSVTable = () => {
    setEditingCSVTable(null);
    setShowCSVTableForm(true);
  };

  const handleEditCSVTable = (table: CSVTableResponse) => {
    setEditingCSVTable(table);
    setShowCSVTableForm(true);
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
          <CSVTableList
            key={csvTableListKey}
            onAdd={handleAddCSVTable}
            onEdit={handleEditCSVTable}
          />
        </TabsContent>

        <TabsContent value="document" className="mt-6 space-y-4">
          <DocumentList
            key={documentListKey}
            onUploadClick={() => setShowDocumentUpload(true)}
          />
        </TabsContent>
      </Tabs>

      {/* Document Upload Modal - Fullscreen */}
      <Dialog open={showDocumentUpload} onOpenChange={setShowDocumentUpload}>
        <DialogContent
          showCloseButton={false}
          className="mb-8 flex h-auto max-h-[calc(100vh-2rem)] min-w-[calc(100vw-2rem)] flex-col justify-between gap-0"
        >
          <div className="flex-1 overflow-auto p-6">
            <DocumentUpload
              onSuccess={handleDocumentUploadSuccess}
              onCancel={() => setShowDocumentUpload(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* CSV Table Form Modal - Fullscreen */}
      <Dialog open={showCSVTableForm} onOpenChange={setShowCSVTableForm}>
        <DialogContent
          showCloseButton={false}
          className="mb-8 flex h-auto max-h-[calc(100vh-2rem)] min-w-[calc(100vw-2rem)] flex-col justify-between gap-0"
        >
          <div className="flex-1 overflow-auto p-6">
            <CSVTableForm
              initialData={editingCSVTable || undefined}
              onSuccess={handleCSVTableFormSuccess}
              onCancel={() => {
                setShowCSVTableForm(false);
                setEditingCSVTable(null);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
