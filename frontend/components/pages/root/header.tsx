"use client";

import Drawer from "@/components/common/drawer";
import Menu from "@/components/common/menu";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, isAdmin } from "@/lib/utils";
import { signInWithGoogle } from "@/services/auth.service";
import { useAuthStore } from "@/stores/auth.store";
import { ArrowRightIcon, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function Header() {
  const [addBorder, setAddBorder] = useState(false);
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleLogin = async () => {
    await signInWithGoogle();
  };

  const handleLogout = async () => {
    await logout();
  };

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

  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!headerRef.current) return;

    const updateHeight = () => {
      if (headerRef.current) {
        document.documentElement.style.setProperty(
          "--header-height",
          `${headerRef.current.offsetHeight}px`
        );
      }
    };

    const observer = new ResizeObserver(updateHeight);
    observer.observe(headerRef.current);
    updateHeight();

    return () => observer.disconnect();
  }, []);

  const [showChatButton, setShowChatButton] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show addBorder if scrolled slightly
      if (window.scrollY > 20) {
        setAddBorder(true);
      } else {
        setAddBorder(false);
      }

      // Show Chat Button if scrolled past first section (approx 500px or viewport height)
      if (window.scrollY > 500) {
        setShowChatButton(true);
      } else {
        setShowChatButton(false);
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <header
      ref={headerRef}
      className={
        "sticky top-0 z-50 py-2 border-b !border-[1px] bg-background/60 backdrop-blur"
      }
    >
      <div className="flex justify-between items-center container mx-auto">
        <div className="flex items-center">
          <Link
            href="/"
            title="brand-logo"
            className="relative mr-6 flex items-center space-x-2"
          >
            <img
              src="/logo/square-logo.png"
              alt="Logo"
              className="hidden lg:block w-auto h-[40px]"
            />
            <img
              src="/logo/rectangle.png"
              alt="Logo"
              className="block lg:hidden w-auto h-[40px]"
            />
          </Link>
          <nav className="mr-10 hidden lg:flex items-center gap-2">
            <Menu />
            {isAdmin(user) && (
              <Link href="/admin">
                <Button
                  variant="outline"
                  className="rounded-3xl cursor-pointer "
                >
                  Quản lý
                </Button>
              </Link>
            )}
          </nav>
        </div>
        <div className="hidden lg:block">
          <div className="flex items-center ">
            <div className="gap-2 flex">
              {pathname === "/chat" ? (
                user ? (
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
                          <p className="text-md leading-none truncate max-w-[200px] text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <Button
                        variant="destructive"
                        className="rounded-3xl w-full  cursor-pointer"
                        iconPlacement="right"
                        onClick={handleLogout}
                      >
                        Đăng xuất
                      </Button>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button
                    effect="expandIcon"
                    className="rounded-3xl cursor-pointer"
                    icon={ArrowRightIcon}
                    iconPlacement="right"
                    onClick={handleLogin}
                  >
                    Đăng nhập
                  </Button>
                )
              ) : (
                <Link href="/chat">
                  <Button
                    effect="expandIcon"
                    className="rounded-3xl cursor-pointer"
                    icon={ArrowRightIcon}
                    iconPlacement="right"
                  >
                    Hỏi đáp ngay
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
        <div className="mt-2 cursor-pointer block lg:hidden">
          {pathname === "/" && showChatButton ? (
            <Link href="/chat">
              <Button size="sm" className="rounded-3xl cursor-pointer">
                Hỏi đáp ngay
              </Button>
            </Link>
          ) : (
            <Drawer />
          )}
        </div>
      </div>
      {/* <hr
        className={cn(
          "absolute w-full bottom-0 transition-opacity duration-300 ease-in-out",
          addBorder ? "opacity-100" : "opacity-0"
        )}
      /> */}
    </header>
  );
}
