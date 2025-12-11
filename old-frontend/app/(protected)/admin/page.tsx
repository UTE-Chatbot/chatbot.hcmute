import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutDashboard, Database, MessageSquare, Users } from "lucide-react";

const DashboardPage = () => {
  const stats = [
    {
      title: "Tổng số hội thoại",
      value: "0",
      description: "Hội thoại trong hệ thống",
      icon: MessageSquare,
    },
    {
      title: "Dữ liệu bảng",
      value: "0",
      description: "Bảng dữ liệu CSV",
      icon: Database,
    },
    {
      title: "Tài liệu",
      value: "0",
      description: "Tài liệu đã tải lên",
      icon: Database,
    },
    {
      title: "Người dùng",
      value: "0",
      description: "Người dùng đã đăng ký",
      icon: Users,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tổng quan</h1>
        <p className="text-muted-foreground mt-2">
          Xem tổng quan về hệ thống chatbot
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Chào mừng đến Admin Panel</CardTitle>
          <CardDescription>
            Quản lý và theo dõi hệ thống chatbot HCMUTE
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-muted rounded-lg">
              <LayoutDashboard className="w-5 h-5 mt-0.5 text-primary" />
              <div>
                <h3 className="font-medium">Bắt đầu quản lý</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Sử dụng menu bên trái để truy cập các chức năng quản lý dữ liệu và hội thoại
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage;
