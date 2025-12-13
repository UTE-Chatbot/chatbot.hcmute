"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getThreads,
  deleteThread,
  exportThreadCsv,
} from "@/services/thread.service";
import { ThreadListResponse, ThreadResponse } from "@/types/thread";
import { ThreadDetail } from "./thread-detail";
import { formatDate } from "@/lib/utils"; // Assuming utils has this or I'll use native Date
import { useDebouncedCallback } from "@/lib/hooks/use-debounced-callback";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Search,
  MessageSquare,
  Trash2,
  RefreshCw,
  Eye,
  Calendar,
  User,
  MoreVertical,
  Download,
} from "lucide-react";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { addDays } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyDescription,
} from "@/components/ui/empty";

export function ThreadList() {
  const [data, setData] = useState<ThreadListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [debouncedSearchValue, setDebouncedSearchValue] = useState("");
  const [page, setPage] = useState(1);

  const pageSize = 12; // Adjusted to match grid

  // Date Filters
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });
  const [tempDateRange, setTempDateRange] = useState<DateRange | undefined>(
    dateRange
  );

  const debouncedSetSearch = useDebouncedCallback((value: string) => {
    setDebouncedSearchValue(value);
    setPage(1);
  }, 500);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    debouncedSetSearch(e.target.value);
  };

  const handleApplyFilter = () => {
    setDateRange(tempDateRange);
    setPage(1); // Reset to first page when filtering
  };

  // Actions
  const [viewingThreadId, setViewingThreadId] = useState<string | null>(null);
  const [deletingThreadId, setDeletingThreadId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      // NOTE: Verify if backend supports 'search' param for threads.
      // If not, we might need to filter client side or just send it and hope.
      // Based on service it passes generic params.
      const response = await getThreads({
        page,
        size: pageSize,
        search: debouncedSearchValue || undefined,
        start_date: dateRange?.from?.toISOString(),
        end_date: dateRange?.to?.toISOString(),
      });
      setData(response);
    } catch (err) {
      console.error("Error fetching threads:", err);
      setError("Không thể tải danh sách hội thoại");
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearchValue, dateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = (id: string) => {
    setDeletingThreadId(id);
  };

  const handleConfirmDelete = async () => {
    if (!deletingThreadId) return;

    try {
      await deleteThread(deletingThreadId);
      setDeletingThreadId(null);
      fetchData();
    } catch (err) {
      console.error("Error deleting thread:", err);
      // Ideally show a toast here instead of alert, but keeping simpler for now or use sonner if available
      alert("Không thể xóa hội thoại");
    }
  };

  const handleExport = async () => {
    try {
      await exportThreadCsv(dateRange?.from, dateRange?.to);
    } catch (err) {
      console.error("Failed to export threads:", err);
      alert("Không thể xuất dữ liệu");
    }
  };

  const renderContent = () => {
    if (isLoading && !data) {
      return (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (error) {
      return <div className="text-center text-destructive p-8">{error}</div>;
    }

    if (!data || data.items.length === 0) {
      return (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <MessageSquare />
            </EmptyMedia>
            <EmptyDescription>
              Chưa có hội thoại nào được ghi lại
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      );
    }

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data.items.map((thread) => (
          <Card
            key={thread.id}
            className="overflow-hidden hover:shadow-md transition-shadow group bg-white flex flex-col h-full"
          >
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start gap-2">
                <CardTitle
                  className="text-base font-medium leading-tight line-clamp-2"
                  title={thread.title || "Untitled Conversation"}
                >
                  {thread.title || "Hội thoại không tiêu đề"}
                </CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => setViewingThreadId(thread.thread_id)}
                    >
                      <Eye className="mr-2 h-4 w-4" /> Xem chi tiết
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => handleDelete(thread.thread_id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Xóa
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <CardDescription className="text-xs space-y-1">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {thread.created_at
                    ? new Date(thread.created_at).toLocaleDateString("vi-VN")
                    : "N/A"}
                </div>
                {thread.user ? (
                  <div className="flex items-center gap-2">
                    {thread.user.avatar ? (
                      <img
                        src={thread.user.avatar}
                        alt="Avatar"
                        className="w-4 h-4 rounded-full"
                      />
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                    <span
                      className="truncate max-w-[150px] font-medium"
                      title={thread.user.full_name || thread.user.email}
                    >
                      {thread.user.full_name || thread.user.email}
                    </span>
                  </div>
                ) : thread.user_id ? (
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    User ID: {thread.user_id.substring(0, 8)}...
                  </div>
                ) : null}
              </CardDescription>
            </CardHeader>
            <CardContent className="mt-auto">
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setViewingThreadId(thread.thread_id)}
                >
                  Xem tin nhắn
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header / Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-lg border shadow-sm sticky top-0 z-10">
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
          <InputGroup>
            <InputGroupInput
              value={search}
              onChange={handleSearchChange}
              placeholder="Tìm kiếm hội thoại..."
            />
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
          </InputGroup>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto justify-end">
          <DateRangePicker date={tempDateRange} setDate={setTempDateRange} />
          <Button onClick={handleApplyFilter}>Lọc</Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 w-4 h-4" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="mr-2 w-4 h-4" />
            Làm mới
          </Button>
        </div>
      </div>

      {/* Stats Summary */}
      {data && (
        <div className="text-sm text-muted-foreground">
          Hiển thị {data.items.length} trên tổng số {data.total} hội thoại
        </div>
      )}

      {renderContent()}

      {/* Pagination View (Simplified) */}
      {data && data.pages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <Button
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Trước
          </Button>
          <span className="flex items-center text-sm font-medium">
            Trang {data.page} / {data.pages}
          </span>
          <Button
            variant="outline"
            disabled={page >= data.pages}
            onClick={() => setPage((p) => p + 1)}
          >
            Sau
          </Button>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog
        open={!!viewingThreadId}
        onOpenChange={(open) => !open && setViewingThreadId(null)}
      >
        <DialogContent
          showCloseButton={false}
          className="mb-8 flex h-[calc(100vh-2rem)] min-w-[calc(100vw-2rem)] flex-col justify-between gap-0 p-[2rem]"
        >
          {viewingThreadId && (
            <div className="flex-1 w-full h-full overflow-hidden flex flex-col">
              <ThreadDetail
                threadId={viewingThreadId}
                user={
                  data?.items.find((t) => t.thread_id === viewingThreadId)?.user
                }
                onBack={() => setViewingThreadId(null)}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deletingThreadId}
        onOpenChange={(open) => !open && setDeletingThreadId(null)}
      >
        <DialogContent>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col space-y-2 text-center sm:text-left">
              <h3 className="text-lg font-semibold">Xóa hội thoại</h3>
              <p className="text-sm text-muted-foreground">
                Bạn có chắc chắn muốn xóa hội thoại này? <br />
                Hành động này không thể hoàn tác.
              </p>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
            <Button variant="outline" onClick={() => setDeletingThreadId(null)}>
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
