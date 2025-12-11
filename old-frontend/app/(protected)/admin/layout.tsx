"use client";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/pages/admin/admin-sidebar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/stores/auth.store";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { isAdmin } from "@/lib/utils";
import Loader from "@/components/ui/loader";

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsMenuOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsMenuOpen(false);
    }, 100);
  };

  useEffect(() => {
    if (!loading) {
      if (!user || !isAdmin(user)) {
        if (pathname !== "/admin/unauthorized") {
          router.replace("/unauthorized");
        }
      }
    }
  }, [user, loading, router, pathname]);

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader/>
          <p className="mt-4 text-muted-foreground">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin(user)) {
    if (pathname === "/admin/unauthorized") {
      return <>{children}</>;
    }
    return null;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AdminSidebar />
        <main className="flex-1 overflow-auto">
          <div className="sticky top-0 z-10 bg-background border-b">
            <div className="flex items-center justify-between gap-4 p-4">
              <SidebarTrigger />
              <DropdownMenu
                open={isMenuOpen}
                onOpenChange={setIsMenuOpen}
                modal={false}
              >
                <DropdownMenuTrigger
                  asChild
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >
                  <div className="cursor-pointer h-10 w-10 rounded-full overflow-hidden border border-gray-100">
                    <img
                      src={
                        user.avatar ||
                        `https://ui-avatars.com/api/?name=${user.full_name}`
                      }
                      alt="avatar"
                      className="h-full w-full object-cover"
                    />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 p-4"
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-3 pb-3">
                      <p className="text-md font-bold leading-none">
                        {user.full_name}
                      </p>
                      <p className="text-md leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <Button
                    variant="destructive"
                    className="rounded-3xl w-full cursor-pointer"
                    onClick={handleLogout}
                  >
                    Đăng xuất
                  </Button>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;
