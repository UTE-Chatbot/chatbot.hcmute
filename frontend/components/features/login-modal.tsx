"use client";

import { GenericModal } from "@/components/common/generic-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Icons } from "@/components/ui/icons"; // Assuming Icons has Google icon, if not I will use a placeholder or check icons.tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLogin?: () => void;
}

export function LoginModal({ open, onOpenChange, onLogin }: LoginModalProps) {
  return (
    <GenericModal
      open={open}
      onOpenChange={onOpenChange}
      title="Chào mừng bạn trở lại"
      className="sm:max-w-[400px]"
    >
      <Tabs defaultValue="login" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="login">Đăng nhập</TabsTrigger>
          <TabsTrigger value="register">Đăng ký</TabsTrigger>
        </TabsList>

        <TabsContent value="login">
          <div className="grid gap-6">
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={onLogin}
            >
              <Icons.google className="h-4 w-4" />
              Tiếp tục với Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Hoặc
                </span>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="grid gap-2">
                <label
                  htmlFor="email-login"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Email
                </label>
                <Input
                  id="email-login"
                  type="email"
                  placeholder="m@example.com"
                />
              </div>
              <div className="grid gap-2">
                <label
                  htmlFor="password-login"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Mật khẩu
                </label>
                <Input id="password-login" type="password" />
              </div>
              <Button type="submit" onClick={onLogin} className="w-full">
                Đăng nhập
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="register">
          <div className="grid gap-6">
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={onLogin}
            >
              <Icons.google className="h-4 w-4" />
              Tiếp tục với Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Hoặc
                </span>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="grid gap-2">
                <label
                  htmlFor="email-register"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Email
                </label>
                <Input
                  id="email-register"
                  type="email"
                  placeholder="m@example.com"
                />
              </div>
              <div className="grid gap-2">
                <label
                  htmlFor="password-register"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Mật khẩu
                </label>
                <Input id="password-register" type="password" />
              </div>
              <div className="grid gap-2">
                <label
                  htmlFor="password-confirm"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Nhập lại mật khẩu
                </label>
                <Input id="password-confirm" type="password" />
              </div>
              <Button type="submit" onClick={onLogin} className="w-full">
                Đăng ký
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </GenericModal>
  );
}
