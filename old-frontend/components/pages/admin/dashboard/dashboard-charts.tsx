"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { DashboardStatsResponse } from "@/types/thread";

interface DashboardChartsProps {
  stats: DashboardStatsResponse;
}

export function DashboardCharts({ stats }: DashboardChartsProps) {
  // Use data from stats directly since they match recharts format approximately
  // thread_counts: {date: string, count: number}[]
  // popular_keywords: {keyword: string, count: number}[]

  const formattedKeywords = stats.popular_keywords.map((k) => ({
    name: k.keyword,
    count: k.count,
  }));

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Thống kê hội thoại theo ngày</CardTitle>
          <CardDescription>
            Số lượng hội thoại trong 30 ngày qua
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats.thread_counts}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return `${date.getDate()}/${date.getMonth() + 1}`;
                }}
              />
              <YAxis allowDecimals={false} />
              <Tooltip
                labelFormatter={(value) =>
                  new Date(value).toLocaleDateString("vi-VN")
                }
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#2563eb"
                strokeWidth={2}
                name="Số hội thoại"
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Chủ đề phổ biến</CardTitle>
          <CardDescription>Các topic được quan tâm gần đây</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          {stats.popular_topics.length > 0 ? (
            <div className="flex flex-wrap gap-2 content-start h-full overflow-y-auto p-1">
              {stats.popular_topics.map((topic, i) => (
                <div
                  key={i}
                  className="px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium border border-primary/20"
                >
                  {topic}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Chưa có dữ liệu topic
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Biểu đồ tần suất từ khóa</CardTitle>
          <CardDescription>
            Top từ khóa xuất hiện nhiều nhất trong hội thoại
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[350px]">
          {formattedKeywords.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={formattedKeywords}
                layout="vertical"
                margin={{ left: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={100}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip cursor={{ fill: "transparent" }} />
                <Bar
                  dataKey="count"
                  fill="#16a34a"
                  radius={[0, 4, 4, 0]}
                  name="Số lần xuất hiện"
                  barSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Chưa có dữ liệu từ khóa
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Từ khóa nổi bật (Word Cloud)</CardTitle>
          <CardDescription>Trực quan hóa tần suất từ khóa</CardDescription>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center overflow-hidden">
          {formattedKeywords.length > 0 ? (
            <KeywordsWordCloud keywords={formattedKeywords} />
          ) : (
            <div className="text-muted-foreground">Chưa có dữ liệu từ khóa</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function KeywordsWordCloud({
  keywords,
}: {
  keywords: { name: string; count: number }[];
}) {
  // Simple size normalization
  const maxCount = Math.max(...keywords.map((k) => k.count));
  const minCount = Math.min(...keywords.map((k) => k.count));

  return (
    <div className="flex flex-wrap justify-center gap-4 p-4">
      {keywords.map((keyword, i) => {
        // Calculate font size between 14px and 40px
        const fontSize =
          maxCount === minCount
            ? 16
            : 14 + ((keyword.count - minCount) / (maxCount - minCount)) * 36;

        // Random slight rotation for wordcloud feel
        const rotation = i % 2 === 0 ? 0 : i % 3 === 0 ? -5 : 5;

        // Vary colors
        const colors = [
          "text-blue-500",
          "text-indigo-500",
          "text-purple-500",
          "text-pink-500",
          "text-emerald-500",
          "text-teal-500",
        ];
        const colorClass = colors[i % colors.length];

        return (
          <span
            key={i}
            className={`${colorClass} font-bold transition-all hover:scale-110 cursor-default`}
            style={{
              fontSize: `${fontSize}px`,
              transform: `rotate(${rotation}deg)`,
              opacity: 0.8 + (keyword.count / maxCount) * 0.2,
            }}
            title={`${keyword.name}: ${keyword.count} lần`}
          >
            {keyword.name}
          </span>
        );
      })}
    </div>
  );
}
