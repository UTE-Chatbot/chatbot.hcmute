"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";

export default function ThreadManagementPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Quản lý hội thoại</h1>
        <p className="text-muted-foreground mt-2">
          Xem và quản lý tất cả các hội thoại trong hệ thống
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách hội thoại</CardTitle>
          <CardDescription>
            Tất cả hội thoại giữa người dùng và chatbot
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="text-center space-y-2">
              <MessageSquare className="w-12 h-12 mx-auto opacity-50" />
              <p>Chức năng quản lý hội thoại sẽ được triển khai sau</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
