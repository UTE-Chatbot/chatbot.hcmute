"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/auth.store";
import { useRouter } from "next/navigation";
import Loader from "@/components/ui/loader";

export default function GoogleSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    router.push("/chat");
  }, [router]);

  return <Loader />;
}
