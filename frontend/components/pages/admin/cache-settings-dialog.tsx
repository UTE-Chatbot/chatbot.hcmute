"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Trash2, Save } from "lucide-react";
import { api } from "@/lib/api";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface CacheSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CacheSettingsDialog({
  open,
  onOpenChange,
}: CacheSettingsDialogProps) {
  const [threshold, setThreshold] = useState<string>("0.9");
  const [loading, setLoading] = useState(false);
  const [flushing, setFlushing] = useState(false);
  const [isFlushConfirmOpen, setIsFlushConfirmOpen] = useState(false);

  useEffect(() => {
    if (open) {
      fetchConfig();
    }
  }, [open]);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const res = await api.get("/cache/config");
      if (res.data) {
        setThreshold(String(res.data.cache_threshold));
      }
    } catch (error) {
      console.error("Failed to fetch cache config", error);
      toast.error("Không thể tải cấu hình cache");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const val = parseFloat(threshold);
    if (isNaN(val) || val < 0 || val > 1) {
      toast.error("Ngưỡng (Threshold) phải từ 0.0 đến 1.0");
      return;
    }

    try {
      setLoading(true);
      await api.post("/cache/config", { threshold: val });
      toast.success("Đã cập nhật cấu hình cache");
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to update cache config", error);
      toast.error("Không thể cập nhật cấu hình");
    } finally {
      setLoading(false);
    }
  };

  const handleFlush = async () => {
    try {
      setFlushing(true);
      const res = await api.post("/cache/flush", {});
      toast.success(
        `Đã xóa cache thành công (Đã xóa ${res.data.deleted_count} mục)`
      );
      setIsFlushConfirmOpen(false);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to flush cache", error);
      toast.error("Xóa cache thất bại");
    } finally {
      setFlushing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Cấu hình Cache</DialogTitle>
          <DialogDescription>
            Điều chỉnh ngưỡng tìm kiếm tương đồng và quản lý cache ngữ nghĩa.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <Label htmlFor="threshold" className="min-w-[80px]">
              Threshold
            </Label>
            <Input
              id="threshold"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              className="flex-1"
              type="number"
              step="0.01"
              min="0"
              max="1"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Ngưỡng tương đồng (Cosine Similarity). Giá trị cao hơn (gần 1.0) đòi
            hỏi độ chính xác cao hơn để hit cache.
          </p>
        </div>
        <DialogFooter className="flex justify-between sm:justify-between w-full">
          <Popover
            open={isFlushConfirmOpen}
            onOpenChange={setIsFlushConfirmOpen}
          >
            <PopoverTrigger asChild>
              <Button
                variant="destructive"
                disabled={flushing || loading}
                type="button"
              >
                {flushing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Xóa Cache
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">Xác nhận xóa</h4>
                  <p className="text-sm text-muted-foreground">
                    Bạn có chắc chắn muốn xóa toàn bộ cache? Hành động này không
                    thể hoàn tác.
                  </p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsFlushConfirmOpen(false)}
                  >
                    Hủy
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleFlush}
                    disabled={flushing}
                  >
                    {flushing && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Xóa ngay
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button onClick={handleSave} disabled={loading || flushing}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Lưu
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
