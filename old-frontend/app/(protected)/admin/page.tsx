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
  Loader2,
} from "lucide-react";
import { getDashboardStats } from "@/services/thread.service";
import { DashboardStatsResponse } from "@/types/thread";
import { DashboardCharts } from "@/components/pages/admin/dashboard/dashboard-charts";

const DashboardPage = () => {
  const [stats, setStats] = useState<DashboardStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getDashboardStats();
        setStats(data);
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tổng quan</h1>
        <p className="text-muted-foreground mt-2">
          Xem thống kê và báo cáo về hệ thống chatbot
        </p>
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
