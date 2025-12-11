import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-6 px-4">
        <div className="flex justify-center">
          <ShieldAlert className="w-24 h-24 text-destructive" />
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Không có quyền truy cập</h1>
          <p className="text-muted-foreground text-lg">
            Bạn không có quyền truy cập trang này. Vui lòng đăng nhập với tài khoản quản trị viên.
          </p>
        </div>
        <div className="flex gap-4 justify-center">
          <Link href="/">
            <Button>Về trang chủ</Button>
          </Link>
          <Link href="/chat">
            <Button variant="outline">Đi đến Chat</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
