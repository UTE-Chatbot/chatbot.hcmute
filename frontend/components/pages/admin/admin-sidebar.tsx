"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import {
  getMaintenanceStatus,
  setMaintenanceStatus,
} from "@/services/thread.service";
import { toast } from "sonner";
import {
  Database,
  FileText,
  MessageSquare,
  LayoutDashboard,
} from "lucide-react";

const menuItems = [
  {
    title: "Tổng quan",
    url: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Quản lý dữ liệu",
    url: "/admin/data",
    icon: Database,
  },
  {
    title: "Quản lý hội thoại",
    url: "/admin/thread",
    icon: MessageSquare,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getMaintenanceStatus()
      .then((status) => setMaintenanceMode(status.enabled))
      .catch((err) => console.error("Failed to fetch maintenance status", err));
  }, []);

  const handleMaintenanceToggle = async (enabled: boolean) => {
    try {
      setLoading(true);
      const status = await setMaintenanceStatus(enabled);
      setMaintenanceMode(status.enabled);
      toast.success(`Chế độ bảo trì đã ${status.enabled ? "bật" : "tắt"}`);
    } catch (err) {
      console.error("Failed to update maintenance status", err);
      toast.error("Không thể cập nhật chế độ bảo trì");
      // Revert state if failed
      setMaintenanceMode(!enabled);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sidebar>
      <SidebarHeader>
        <Link
          href="/"
          className="flex items-center gap-2 px-4 py-2 hover:opacity-80 transition-opacity"
        >
          <img src="/logo/square-logo.png" alt="Logo" className="w-8 h-8" />
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Quản lý</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive =
                  pathname === item.url ||
                  (item.url !== "/admin" &&
                    pathname?.startsWith(`${item.url}/`));
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.url}>
                        <item.icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarGroup>
          <SidebarGroupContent>
            <div className="flex items-center justify-between px-2 py-2">
              <Label htmlFor="maintenance-mode" className="text-sm font-medium">
                Bảo trì
              </Label>
              <Switch
                id="maintenance-mode"
                checked={maintenanceMode}
                onCheckedChange={handleMaintenanceToggle}
                disabled={loading}
              />
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarFooter>
    </Sidebar>
  );
}
