"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getFeedbacks,
  deleteFeedback,
  exportFeedbackCsv,
  getDashboardStats,
} from "@/services/thread.service";
import { FeedbackListResponse, ThreadFeedbackResponse, DashboardStatsResponse } from "@/types/thread";
import { ThreadDetail } from "@/components/pages/admin/thread/thread-detail";
import { useDebouncedCallback } from "@/lib/hooks/use-debounced-callback";
import { formatDate } from "@/lib/utils";

import {
  Card,
  CardContent,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Star,
  Trash2,
  RefreshCw,
  Eye,
  Calendar,
  Download,
  Check,
  X,
  MessageSquare,
} from "lucide-react";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { addDays } from "date-fns";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyDescription,
} from "@/components/ui/empty";
import { toast } from "sonner";

export default function FeedbackManagementPage() {
  const [data, setData] = useState<FeedbackListResponse | null>(null);
  const [stats, setStats] = useState<DashboardStatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [debouncedSearchValue, setDebouncedSearchValue] = useState("");
  const [page, setPage] = useState(1);
  const [ratingFilter, setRatingFilter] = useState<string>("all");

  const pageSize = 10;

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });
  const [tempDateRange, setTempDateRange] = useState<DateRange | undefined>(
    dateRange
  );

  const [viewingThreadId, setViewingThreadId] = useState<string | null>(null);
  const [deletingFeedbackId, setDeletingFeedbackId] = useState<string | null>(null);

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
    setPage(1);
  };

  const fetchStats = useCallback(async () => {
    try {
      const dashboardStats = await getDashboardStats(dateRange?.from, dateRange?.to);
      setStats(dashboardStats);
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  }, [dateRange]);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const ratingParam = ratingFilter !== "all" ? parseInt(ratingFilter) : undefined;
      const response = await getFeedbacks({
        page,
        size: pageSize,
        search: debouncedSearchValue || undefined,
        rating: ratingParam,
        start_date: dateRange?.from?.toISOString(),
        end_date: dateRange?.to?.toISOString(),
      });
      setData(response);
    } catch (err) {
      console.error("Error fetching feedbacks:", err);
      setError("Không thể tải danh sách phản hồi");
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearchValue, ratingFilter, dateRange]);

  useEffect(() => {
    fetchData();
    fetchStats();
  }, [fetchData, fetchStats]);

  const handleDelete = (id: string) => {
    setDeletingFeedbackId(id);
  };

  const handleConfirmDelete = async () => {
    if (!deletingFeedbackId) return;

    try {
      await deleteFeedback(deletingFeedbackId);
      setDeletingFeedbackId(null);
      toast.success("Đã xóa phản hồi");
      fetchData();
      fetchStats();
    } catch (err) {
      console.error("Error deleting feedback:", err);
      toast.error("Không thể xóa phản hồi");
    }
  };

  const handleExport = async () => {
    try {
      await exportFeedbackCsv(dateRange?.from, dateRange?.to);
    } catch (err) {
      console.error("Failed to export feedbacks:", err);
      toast.error("Không thể xuất dữ liệu CSV");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý phản hồi</h1>
          <p className="text-muted-foreground mt-2">
            Theo dõi và đánh giá phản hồi từ người dùng cho mô hình RLHF/RAG
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DateRangePicker date={tempDateRange} setDate={setTempDateRange} />
          <Button onClick={handleApplyFilter}>Lọc</Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Xuất CSV
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tổng số phản hồi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold">{stats?.total_feedbacks ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Điểm trung bình</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold flex items-center gap-1.5">
              {stats?.average_rating ?? 0}
              <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Độ chính xác cao</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-emerald-600">{stats?.accurate_percentage ?? 0}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nội dung hữu ích</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-blue-600">{stats?.helpful_percentage ?? 0}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Câu trả lời dễ hiểu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-purple-600">{stats?.understandable_percentage ?? 0}%</div>
          </CardContent>
        </Card>
      </div>

      <Card className="p-4 bg-white border border-gray-100 rounded-3xl shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <InputGroup>
              <InputGroupAddon>
                <Search className="h-4 w-4 text-muted-foreground" />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Tìm theo nội dung phản hồi hoặc tiêu đề hội thoại..."
                value={search}
                onChange={handleSearchChange}
                className="pl-9 rounded-2xl"
              />
            </InputGroup>
          </div>
          <div className="w-full md:w-[180px]">
            <Select value={ratingFilter} onValueChange={(val) => { setRatingFilter(val); setPage(1); }}>
              <SelectTrigger className="rounded-2xl">
                <SelectValue placeholder="Số sao đánh giá" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả đánh giá</SelectItem>
                <SelectItem value="5">5 Sao</SelectItem>
                <SelectItem value="4">4 Sao</SelectItem>
                <SelectItem value="3">3 Sao</SelectItem>
                <SelectItem value="2">2 Sao</SelectItem>
                <SelectItem value="1">1 Sao</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading && !data ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-center text-destructive p-8">{error}</div>
        ) : !data || data.items.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <MessageSquare />
              </EmptyMedia>
              <EmptyDescription>
                Không tìm thấy phản hồi nào phù hợp
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="space-y-4">
            <div className="border border-gray-100 rounded-2xl overflow-hidden">
              <table className="w-full text-sm border-collapse text-left">
                <thead>
                  <tr className="bg-muted/40 border-b border-gray-100 font-semibold text-muted-foreground">
                    <th className="p-4">Hội thoại</th>
                    <th className="p-4 w-[120px]">Đánh giá</th>
                    <th className="p-4 w-[100px] text-center">Chính xác</th>
                    <th className="p-4 w-[100px] text-center">Hữu ích</th>
                    <th className="p-4 w-[100px] text-center">Dễ hiểu</th>
                    <th className="p-4">Ý kiến đóng góp</th>
                    <th className="p-4 w-[140px]">Ngày gửi</th>
                    <th className="p-4 w-[100px] text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.items.map((feedback) => (
                    <tr key={feedback.id} className="hover:bg-muted/10 transition-colors">
                      <td className="p-4 font-medium max-w-[200px] truncate">
                        {feedback.thread?.title || "Hội thoại không tiêu đề"}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${
                                star <= feedback.rating
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-muted-foreground/20"
                              }`}
                            />
                          ))}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        {feedback.is_accurate ? (
                          <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 rounded-full p-1"><Check className="h-3 w-3" /></Badge>
                        ) : feedback.is_accurate === false ? (
                          <Badge variant="destructive" className="bg-rose-50 text-rose-700 hover:bg-rose-50 rounded-full p-1"><X className="h-3 w-3" /></Badge>
                        ) : (
                          <span className="text-muted-foreground/30">-</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {feedback.is_helpful ? (
                          <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 rounded-full p-1"><Check className="h-3 w-3" /></Badge>
                        ) : feedback.is_helpful === false ? (
                          <Badge variant="destructive" className="bg-rose-50 text-rose-700 hover:bg-rose-50 rounded-full p-1"><X className="h-3 w-3" /></Badge>
                        ) : (
                          <span className="text-muted-foreground/30">-</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {feedback.is_understandable ? (
                          <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 rounded-full p-1"><Check className="h-3 w-3" /></Badge>
                        ) : feedback.is_understandable === false ? (
                          <Badge variant="destructive" className="bg-rose-50 text-rose-700 hover:bg-rose-50 rounded-full p-1"><X className="h-3 w-3" /></Badge>
                        ) : (
                          <span className="text-muted-foreground/30">-</span>
                        )}
                      </td>
                      <td className="p-4 max-w-[250px] truncate text-muted-foreground" title={feedback.comment || ""}>
                        {feedback.comment || <span className="text-muted-foreground/30 font-light italic">Không có góp ý</span>}
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {feedback.created_at ? formatDate(feedback.created_at) : ""}
                      </td>
                      <td className="p-4 text-right space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setViewingThreadId(feedback.thread_id)}
                          className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-xl"
                          title="Xem hội thoại"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(feedback.id)}
                          className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl"
                          title="Xóa phản hồi"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-4">
              <div className="text-sm text-muted-foreground">
                Trang {data.page} / {Math.ceil(data.total / pageSize)} ({data.total} phản hồi)
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-xl"
                >
                  Trước
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page * pageSize >= data.total}
                  className="rounded-xl"
                >
                  Sau
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      <Dialog open={!!viewingThreadId} onOpenChange={(open) => !open && setViewingThreadId(null)}>
        <DialogContent className="max-w-4xl h-[85vh] rounded-3xl p-6 bg-background flex flex-col">
          {viewingThreadId && <ThreadDetail threadId={viewingThreadId} onBack={() => setViewingThreadId(null)} />}
        </DialogContent>
      </Dialog>

      <Dialog open={!!deletingFeedbackId} onOpenChange={(open) => !open && setDeletingFeedbackId(null)}>
        <DialogContent className="sm:max-w-[400px] rounded-3xl p-6">
          <div className="space-y-4">
            <h3 className="text-lg font-bold">Xác nhận xóa phản hồi</h3>
            <p className="text-sm text-muted-foreground">
              Bạn có chắc chắn muốn xóa phản hồi này không? Hành động này không thể hoàn tác.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDeletingFeedbackId(null)} className="rounded-xl">Huỷ</Button>
              <Button variant="destructive" onClick={handleConfirmDelete} className="rounded-xl">Xóa</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
