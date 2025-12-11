"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/auth.store";
import { getUserProfile } from "@/services/auth.service";
import { useRouter } from "next/navigation";
import Loader from "@/components/ui/loader";

export default function GoogleSuccessPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();

  useEffect(() => {
    (async () => {
      try {
        const user = await getUserProfile();
        setUser(user);
        if (user?.role === "admin") {
          router.push("/admin");
        } else {
          router.push("/chat");
        }
      } catch (error) {
        router.push("/chat");
      }
    })();
  }, [router, setUser]);

  return <Loader />;
}
