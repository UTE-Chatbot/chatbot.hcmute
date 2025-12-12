"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MessageSquare } from "lucide-react";
import { ThreadList } from "@/components/pages/admin/thread/thread-list";

export default function ThreadManagementPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Quản lý hội thoại</h1>
        <p className="text-muted-foreground mt-2">
          Xem và quản lý tất cả các hội thoại trong hệ thống
        </p>
      </div>

      <ThreadList />
    </div>
  );
}
