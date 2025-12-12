"use client";

import React, { useEffect, useRef, useState } from "react";
import Header from "@/components/pages/root/header";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const headerRef = useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  useEffect(() => {
    const updateHeight = () => {
      if (headerRef.current) {
        setHeaderHeight(headerRef.current.offsetHeight);
      }
    };

    const observer = new ResizeObserver(updateHeight);
    if (headerRef.current) {
      observer.observe(headerRef.current);
    }

    // Initial measurement
    updateHeight();

    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden">
      <div ref={headerRef} className="absolute top-0 z-50 w-full">
        <Header />
      </div>
      <div
        className="w-full"
        style={{
          marginTop: `${headerHeight}px`,
          height: `calc(100vh - ${headerHeight}px)`,
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default Layout;
