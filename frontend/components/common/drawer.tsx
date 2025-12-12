import { Icons } from "@/components/ui/icons";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTrigger,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer";
import { siteConfig } from "@/lib/config";
import { cn, isAdmin } from "@/lib/utils";
import Link from "next/link";
import { IoMenuSharp } from "react-icons/io5";
import { ContactModal } from "./contact-modal";
import { ArrowRightIcon, LogOut, ChevronDown } from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { signInWithGoogle } from "@/services/auth.service";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState } from "react";

export default function DrawerDemo() {
  const [isOpen, setIsOpen] = useState(false);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const handleLogin = async () => {
    await signInWithGoogle();
    setIsOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
  };

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        <Button variant="outline" size="icon">
          <IoMenuSharp className="text-xl" />
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerTitle>
          <VisuallyHidden>Navigation</VisuallyHidden>
        </DrawerTitle>
        <DrawerDescription>
          <VisuallyHidden>Navigation</VisuallyHidden>
        </DrawerDescription>
        <DrawerHeader className="px-6 text-left">
          <div className="mb-6 flex justify-center items-center w-full">
            <Link
              href="/"
              title="brand-logo"
              className="relative flex items-center space-x-2"
              onClick={() => setIsOpen(false)}
            >
              <img
                src="/logo/square-logo.png"
                alt="Logo"
                className="w-auto h-[60px]"
              />
            </Link>
          </div>
          <nav className="max-h-[60vh] overflow-y-auto w-full">
            <ul className="space-y-2 w-full">
              {siteConfig.header.map((item, index) => (
                <li key={index} className="w-full">
                  {item.trigger ? (
                    <Collapsible className="group/collapsible w-full text-left">
                      <CollapsibleTrigger className="flex w-full items-center justify-between py-2 text-lg font-semibold hover:text-primary transition-colors">
                        {item.trigger}
                        <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-3 pt-2">
                        {item.content?.main && (
                          <Link
                            href={item.content.main.href || "#"}
                            className="block group pl-4"
                            onClick={() => setIsOpen(false)}
                          >
                            <div className="font-medium text-primary group-hover:underline">
                              {item.content.main.title}
                            </div>
                            <div className="text-sm text-muted-foreground line-clamp-2">
                              {item.content.main.description}
                            </div>
                          </Link>
                        )}
                        {item.content?.items.map((sub, i) => (
                          <Link
                            key={i}
                            href={sub.href || "#"}
                            className="block pl-4 py-1 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                            onClick={() => setIsOpen(false)}
                          >
                            {sub.title}
                          </Link>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  ) : item.label === "Liên hệ" ? (
                    <ContactModal
                      trigger={
                        <div className="py-2 text-lg font-semibold cursor-pointer hover:text-primary text-left bg-transparent w-full">
                          {item.label}
                        </div>
                      }
                    />
                  ) : (
                    <Link
                      href={item.href || ""}
                      className="block py-2 text-lg font-semibold hover:text-primary transition-colors text-left"
                      onClick={() => setIsOpen(false)}
                    >
                      {item.label}
                    </Link>
                  )}
                </li>
              ))}
              {isAdmin(user) && (
                <li className="w-full">
                  <Link
                    href="/admin"
                    className="block py-2 font-semibold text-lg hover:text-primary transition-colors text-left"
                    onClick={() => setIsOpen(false)}
                  >
                    Quản lý
                  </Link>
                </li>
              )}
            </ul>
          </nav>
        </DrawerHeader>
        <DrawerFooter className="px-6 pb-8">
          {user ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                <img
                  src={
                    user.avatar ||
                    `https://ui-avatars.com/api/?name=${user.full_name}`
                  }
                  alt="avatar"
                  className="h-10 w-10 rounded-full object-cover border"
                />
                <div className="overflow-hidden">
                  <div className="font-bold truncate">{user.full_name}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </div>
                </div>
              </div>
              <Button
                variant="destructive"
                className="w-full rounded-3xl"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" /> Đăng xuất
              </Button>
            </div>
          ) : (
            <Button
              effect="expandIcon"
              className="rounded-3xl cursor-pointer w-full"
              icon={ArrowRightIcon}
              iconPlacement="right"
              onClick={handleLogin}
            >
              Đăng nhập
            </Button>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
