"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Upload,
  FileText,
  X,
  Plus,
  Check,
  ChevronsUpDown,
  Trash2,
} from "lucide-react";
import { uploadFile } from "@/services/file.service";
import { createDocument, updateDocument } from "@/services/document.service";
import { getTopics, updateTopics } from "@/services/topic.service";
import {
  DocumentCreate,
  DocumentUpdate,
  DocumentResponse,
  ChunkMode,
} from "@/types/document";
import { TopicData } from "@/types/topic";
import { MinimalTiptap } from "@/components/ui/shadcn-io/minimal-tiptap";
import { cn } from "@/lib/utils";

interface DocumentUploadProps {
  initialData?: DocumentResponse | null;
  onSuccess?: () => void;
}

export function DocumentUpload({
  initialData,
  onSuccess,
}: DocumentUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [existingFilePath, setExistingFilePath] = useState<string | null>(null);

  // Topic management
  const [topicsData, setTopicsData] = useState<TopicData>({});
  const [topic, setTopic] = useState("");
  const [subtopic, setSubtopic] = useState("");
  const [availableSubtopics, setAvailableSubtopics] = useState<string[]>([]);

  // Combobox states
  const [topicOpen, setTopicOpen] = useState(false);
  const [subtopicOpen, setSubtopicOpen] = useState(false);

  // Dialog states
  const [isTopicDialogOpen, setIsTopicDialogOpen] = useState(false);
  const [isSubtopicDialogOpen, setIsSubtopicDialogOpen] = useState(false);
  const [newTopicName, setNewTopicName] = useState("");
  const [newSubtopicName, setNewSubtopicName] = useState("");

  const [fullText, setFullText] = useState("");
  const [chunkMode, setChunkMode] = useState<ChunkMode>(ChunkMode.DELIMITER_SPLIT);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load topics on mount
  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const data = await getTopics();
        setTopicsData(data || {});
      } catch (err) {
        console.error("Failed to load topics:", err);
      }
    };
    fetchTopics();
  }, []);

  // Update available subtopics when topic changes
  useEffect(() => {
    if (!topic || !topicsData[topic]) {
      setAvailableSubtopics([]);
      // Only reset subtopic if the current subtopic is invalid for the new topic
      // We check if the current subtopic exists in the new list to decide
      const val = topicsData[topic];
      let subs: string[] = [];
      if (val) {
        if (Array.isArray(val)) {
          subs = val;
        } else if (typeof val === "object" && val !== null) {
          subs = Object.keys(val);
        }
      }

      // If we switched to a topic that doesn't have the current subtopic, reset it
      // But avoid resetting if we are in the middle of creating it (handled manually)
      if (subtopic && !subs.includes(subtopic)) {
        setSubtopic("");
      }
      return;
    }

    const val = topicsData[topic];
    let subs: string[] = [];

    if (Array.isArray(val)) {
      subs = val;
    } else if (typeof val === "object" && val !== null) {
      subs = Object.keys(val);
    }

    setAvailableSubtopics(subs);

    // Check if current subtopic is still valid
    if (subtopic && !subs.includes(subtopic)) {
      setSubtopic("");
    }
  }, [topic, topicsData]);

  // Load initial data for editing
  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      if (initialData.document_metadata?.topic) {
        setTopic(initialData.document_metadata.topic);
      }
      if (initialData.document_metadata?.subtopic) {
        setSubtopic(initialData.document_metadata.subtopic);
      }
      if (initialData.file_path) {
        setExistingFilePath(initialData.file_path);
      }

      if (initialData.full_text) {
        setFullText(initialData.full_text);
      }
    }
  }, [initialData]);


  useEffect(() => {
    console.log("Full text updated:", fullText);
  },[fullText])
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (!name) {
        setName(selectedFile.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
  };

  const handleRemoveExistingFile = () => {
    setExistingFilePath(null);
  };

  const handleCreateTopic = async () => {
    if (!newTopicName.trim()) return;
    const cleanName = newTopicName.trim();

    try {
      const newData = { ...topicsData, [cleanName]: {} };
      await updateTopics(newData);
      setTopicsData(newData);
      setTopic(cleanName); // Auto select
      setNewTopicName("");
      setIsTopicDialogOpen(false);
    } catch (err) {
      console.error("Failed to create topic:", err);
      setError("Không thể tạo chủ đề mới");
    }
  };

  const handleCreateSubtopic = async () => {
    if (!newSubtopicName.trim() || !topic) return;
    const cleanName = newSubtopicName.trim();

    try {
      const currentTopicData = topicsData[topic];
      let newData = { ...topicsData };

      if (Array.isArray(currentTopicData)) {
        newData[topic] = [...currentTopicData, cleanName];
      } else if (
        typeof currentTopicData === "object" &&
        currentTopicData !== null
      ) {
        newData[topic] = { ...currentTopicData, [cleanName]: [] };
      } else {
        newData[topic] = { [cleanName]: [] };
      }

      await updateTopics(newData);
      setTopicsData(newData);
      setSubtopic(cleanName);
      setNewSubtopicName("");
      setIsSubtopicDialogOpen(false);
    } catch (err) {
      console.error("Failed to create subtopic:", err);
      setError("Không thể tạo chủ đề phụ mới");
    }
  };

  const handleDeleteTopic = async (topicToDelete: string) => {
    if (!window.confirm(`Bạn có chắc muốn xóa chủ đề "${topicToDelete}"?`))
      return;

    try {
      const { [topicToDelete]: _, ...rest } = topicsData;
      await updateTopics(rest);
      setTopicsData(rest);
      if (topic === topicToDelete) {
        setTopic("");
        setSubtopic("");
      }
    } catch (err) {
      console.error("Failed to delete topic:", err);
      setError("Không thể xóa chủ đề");
    }
  };

  const handleDeleteSubtopic = async (subtopicToDelete: string) => {
    if (!topic) return;
    if (
      !window.confirm(`Bạn có chắc muốn xóa chủ đề phụ "${subtopicToDelete}"?`)
    )
      return;

    try {
      const currentTopicData = topicsData[topic];
      let newData = { ...topicsData };

      if (Array.isArray(currentTopicData)) {
        newData[topic] = currentTopicData.filter((s) => s !== subtopicToDelete);
      } else if (
        typeof currentTopicData === "object" &&
        currentTopicData !== null
      ) {
        const { [subtopicToDelete]: _, ...restSub } = currentTopicData;
        newData[topic] = restSub;
      }

      await updateTopics(newData);
      setTopicsData(newData);
      if (subtopic === subtopicToDelete) {
        setSubtopic("");
      }
    } catch (err) {
      console.error("Failed to delete subtopic:", err);
      setError("Không thể xóa chủ đề phụ");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Vui lòng nhập tên tài liệu");
      return;
    }

    if (!initialData && !file && !existingFilePath && !fullText.trim()) {
      setError("Vui lòng tải lên file hoặc nhập nội dung văn bản");
      return;
    }

    try {
      setIsUploading(true);

      let filePath: string | null = null;

      // Upload file if provided
      if (file) {
        filePath = await uploadFile(file);
      }

      // Create or Update document
      if (initialData) {
        const updateData: DocumentUpdate = {
          name: name.trim(),
          document_metadata: {
            topic: topic.trim() || "General",
            subtopic: subtopic.trim() || "General",
          },
          chunk_mode: chunkMode,
        };

        if (filePath) {
          updateData.file_path = filePath;
        } else if (initialData.file_path && !existingFilePath && !filePath) {
          // User explicitly removed the existing file
          updateData.file_path = null;
        }

        if (fullText.trim()) updateData.full_text = fullText.trim();

        await updateDocument(initialData.id, updateData);
      } else {
        const documentData: DocumentCreate = {
          name: name.trim(),
          file_path: filePath || undefined,
          full_text: fullText.trim() || undefined,
          document_metadata: {
            topic: topic.trim() || "General",
            subtopic: subtopic.trim() || "General",
          },
          chunk_mode: chunkMode,
        };

        await createDocument(documentData);
      }

      // Reset form
      setFile(null);
      setExistingFilePath(null);
      setName("");
      setTopic("");
      setSubtopic("");
      setFullText("");
      setChunkMode(ChunkMode.DELIMITER_SPLIT);

      onSuccess?.();
    } catch (err) {
      console.error("Error creating document:", err);
      setError("Không thể tạo tài liệu. Vui lòng thử lại.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          {initialData ? "Cập nhật tài liệu" : "Tạo tài liệu mới"}
        </h2>
        <p className="text-muted-foreground mt-1">
          {initialData
            ? "Cập nhật thông tin hoặc nội dung tài liệu."
            : "Tải lên file hoặc nhập nội dung văn bản. Hệ thống sẽ tự động phân tích và chia nhỏ tài liệu."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Document Name */}
        <div className="space-y-2">
          <Label htmlFor="name">Tên tài liệu</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nhập tên tài liệu..."
            disabled={isUploading}
          />
        </div>

        {/* Topic & Subtopic */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="topic">Chủ đề</Label>
            <Popover open={topicOpen} onOpenChange={setTopicOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={topicOpen}
                  className="w-full justify-between font-normal"
                  disabled={isUploading}
                >
                  {topic ? topic : "Chọn chủ đề..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Tìm chủ đề..." />
                  <CommandList>
                    <CommandEmpty>Không tìm thấy chủ đề.</CommandEmpty>
                    <CommandGroup heading="Chủ đề hiện có">
                      {Object.keys(topicsData).map((t) => (
                        <CommandItem
                          key={t}
                          value={t}
                          onSelect={(currentValue) => {
                            setTopic(
                              currentValue === topic ? "" : currentValue
                            );
                            setTopicOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              topic === t ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <span className="flex-1 truncate">{t}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0 hover:bg-destructive/10 hover:text-destructive"
                            onClick={(e:any) => {
                              e.stopPropagation();
                              handleDeleteTopic(t);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                    <CommandSeparator />
                    <CommandGroup>
                      <CommandItem
                        onSelect={() => {
                          setIsTopicDialogOpen(true);
                          setTopicOpen(false);
                        }}
                        className="text-primary font-medium cursor-pointer"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Tạo chủ đề mới
                      </CommandItem>
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subtopic">Chủ đề phụ</Label>
            <Popover open={subtopicOpen} onOpenChange={setSubtopicOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={subtopicOpen}
                  className="w-full justify-between font-normal"
                  disabled={isUploading || !topic}
                >
                  {subtopic ? subtopic : "Chọn chủ đề phụ..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Tìm chủ đề phụ..." />
                  <CommandList>
                    <CommandEmpty>Không tìm thấy chủ đề phụ.</CommandEmpty>
                    <CommandGroup heading={`Chủ đề phụ của ${topic}`}>
                      {availableSubtopics.map((s) => (
                        <CommandItem
                          key={s}
                          value={s}
                          onSelect={(currentValue) => {
                            setSubtopic(
                              currentValue === subtopic ? "" : currentValue
                            );
                            setSubtopicOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              subtopic === s ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <span className="flex-1 truncate">{s}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0 hover:bg-destructive/10 hover:text-destructive"
                            onClick={(e:any) => {
                              e.stopPropagation();
                              handleDeleteSubtopic(s);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                    <CommandSeparator />
                    <CommandGroup>
                      <CommandItem
                        onSelect={() => {
                          setIsSubtopicDialogOpen(true);
                          setSubtopicOpen(false);
                        }}
                        className="text-primary font-medium cursor-pointer"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Tạo chủ đề phụ mới
                      </CommandItem>
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Chunk Mode - applies to both file and text input */}
        <div className="space-y-2">
          <Label htmlFor="chunkMode">Phương thức chia nhỏ</Label>
          <Select
            value={chunkMode}
            onValueChange={(value) =>
              setChunkMode(value as ChunkMode)
            }
            disabled={isUploading}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ChunkMode.LLM_CHUNK}>
                Chia tự động bằng AI
              </SelectItem>
              <SelectItem value={ChunkMode.DELIMITER_SPLIT}>
                Chia theo dấu phân cách
              </SelectItem>
              <SelectItem value={ChunkMode.MARKDOWN_HEADING_SPLIT}>
                Chia theo tiêu đề
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Chế độ chia nhỏ sẽ được áp dụng khi bạn nhấn "{initialData ? "Cập nhật tài liệu" : "Tạo tài liệu"}"
          </p>
        </div>

        <div className="flex w-full  flex-col gap-6">
          <Tabs
            defaultValue="file"
            className="w-full p-2 rounded-3xl border-1 border-border"
          >
            <TabsList>
              <TabsTrigger value="file">Tải tệp lên</TabsTrigger>
              <TabsTrigger value="text">Nhập văn bản</TabsTrigger>
            </TabsList>
            <TabsContent value="file">
              <Card className="bg-white">
                <CardContent className="">
                  {/* File Upload */}
                  <div className="space-y-2">
                    <Label>Tải lên file (tuỳ chọn)</Label>
                    {!file && !existingFilePath ? (
                      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 hover:border-muted-foreground/50 transition-colors">
                        <label
                          htmlFor="file-upload"
                          className="flex flex-col items-center cursor-pointer"
                        >
                          <Upload className="w-10 h-10 text-muted-foreground mb-2" />
                          <span className="text-sm text-muted-foreground">
                            Nhấp để chọn file hoặc kéo thả file vào đây
                          </span>
                          <span className="text-xs text-muted-foreground mt-1">
                            PDF, DOCX, MARKDOWN
                          </span>
                          <input
                            id="file-upload"
                            type="file"
                            className="hidden"
                            onChange={handleFileChange}
                            accept=".pdf,.docx,.md"
                            disabled={isUploading}
                          />
                        </label>
                      </div>
                    ) : existingFilePath && !file ? (
                      <div className="flex items-center gap-3 p-4 bg-muted rounded-lg border border-primary/20">
                        <FileText className="w-8 h-8 text-primary" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {existingFilePath.split("/").pop()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            File hiện tại (Sẽ được giữ lại nếu không thay đổi)
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleRemoveExistingFile}
                          disabled={isUploading}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                        <Upload className="w-8 h-8 text-green-600" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {file?.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(file ? file.size / 1024 : 0).toFixed(2)} KB
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleRemoveFile}
                          disabled={isUploading}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="text">
              <Card className="!p-0 bg-white border-none">
                <CardContent className="!p-0">
                    <MinimalTiptap
                      content={fullText}
                      onChange={setFullText}
                      placeholder="Bắt đầu nhập nội dung..."
                      className="min-h-[400px]"
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
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <Button type="submit" className="w-full" disabled={isUploading}>
          {isUploading ? (
            <>
              <Upload className="w-4 h-4 mr-2 animate-pulse" />
              Đang tải lên...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              {initialData ? "Cập nhật tài liệu" : "Tạo tài liệu"}
            </>
          )}
        </Button>
      </form>

      {/* Create Topic Dialog */}
      <Dialog open={isTopicDialogOpen} onOpenChange={setIsTopicDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tạo chủ đề mới</DialogTitle>
            <DialogDescription>Nhập tên cho chủ đề mới.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="new-topic" className="mb-2 block">
              Tên chủ đề
            </Label>
            <Input
              id="new-topic"
              value={newTopicName}
              onChange={(e) => setNewTopicName(e.target.value)}
              placeholder="VD: Khoa học máy tính"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsTopicDialogOpen(false)}
            >
              Hủy
            </Button>
            <Button onClick={handleCreateTopic}>Tạo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Subtopic Dialog */}
      <Dialog
        open={isSubtopicDialogOpen}
        onOpenChange={setIsSubtopicDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tạo chủ đề phụ mới</DialogTitle>
            <DialogDescription>
              Nhập tên cho chủ đề phụ mới trong <strong>{topic}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="new-subtopic" className="mb-2 block">
              Tên chủ đề phụ
            </Label>
            <Input
              id="new-subtopic"
              value={newSubtopicName}
              onChange={(e) => setNewSubtopicName(e.target.value)}
              placeholder="VD: Trí tuệ nhân tạo"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsSubtopicDialogOpen(false)}
            >
              Hủy
            </Button>
            <Button onClick={handleCreateSubtopic}>Tạo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
