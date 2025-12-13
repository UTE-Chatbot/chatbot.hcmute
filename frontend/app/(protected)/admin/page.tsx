"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  LayoutDashboard,
  Database,
  MessageSquare,
  Users,
  FileText,
  Download,
} from "lucide-react";
import Loader from "@/components/ui/loader";
import { getDashboardStats, exportThreadCsv } from "@/services/thread.service";
import { DashboardStatsResponse } from "@/types/thread";
import { DashboardCharts } from "@/components/pages/admin/dashboard/dashboard-charts";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { addDays } from "date-fns";
import { Button } from "@/components/ui/button";

const DashboardPage = () => {
  const [stats, setStats] = useState<DashboardStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });
  const [tempDateRange, setTempDateRange] = useState<DateRange | undefined>(
    dateRange
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getDashboardStats(dateRange?.from, dateRange?.to);
        setStats(data);
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [dateRange]);

  const handleApplyFilter = () => {
    setDateRange(tempDateRange);
  };

  const handleExportCsv = async () => {
    try {
      await exportThreadCsv(dateRange?.from, dateRange?.to);
    } catch (error) {
      console.error("Failed to export CSV", error);
    }
  };

  const statCards = [
    {
      title: "Tổng số hội thoại",
      value: stats?.total_threads ?? 0,
      description: "Hội thoại trong hệ thống",
      icon: MessageSquare,
    },
    {
      title: "Dữ liệu bảng",
      value: stats?.total_csvs ?? 0,
      description: "Bảng dữ liệu CSV",
      icon: Database,
    },
    {
      title: "Tài liệu",
      value: stats?.total_docs ?? 0,
      description: "Tài liệu đã tải lên",
      icon: FileText,
    },
    {
      title: "Người dùng",
      value: stats?.total_users ?? 0,
      description: "Người dùng đã đăng ký",
      icon: Users,
    },
  ];

  if (loading) {
    return <Loader className="h-[50vh]" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tổng quan</h1>
          <p className="text-muted-foreground mt-2">
            Xem thống kê và báo cáo về hệ thống chatbot
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DateRangePicker date={tempDateRange} setDate={setTempDateRange} />
          <Button onClick={handleApplyFilter}>Lọc</Button>
          <Button variant="outline" onClick={handleExportCsv}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stat.value.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {stats && <DashboardCharts stats={stats} />}
    </div>
  );
};

export default DashboardPage;
