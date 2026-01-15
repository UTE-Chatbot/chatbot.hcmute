"use client";

import { motion } from "framer-motion";

import { AuroraText } from "@/components/ui/aurora-text";
import { Icons } from "@/components/ui/icons";
import { HeroVideoDialog } from "@/components/ui/hero-video-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { DotPattern } from "@/components/ui/dot-pattern";
import { GridPattern } from "@/components/ui/grid-pattern";
import { ArrowRightIcon } from "lucide-react";

const ease = [0.16, 1, 0.3, 1] as const;

function HeroPill() {
  return (
    <motion.a
      href="/blog/introducing-acme-ai"
      className="flex w-auto items-center space-x-2 rounded-full bg-primary/20 px-2 py-1 ring-1 ring-accent whitespace-pre"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease }}
    >
      <div className="w-fit rounded-full bg-accent px-2 py-0.5 text-center text-xs font-medium text-primary sm:text-sm">
        📣 Announcement
      </div>
      <p className="text-xs font-medium text-primary sm:text-sm">
        Introducing Acme.ai
      </p>
      <svg
        width="12"
        height="12"
        className="ml-1"
        viewBox="0 0 12 12"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M8.78141 5.33312L5.20541 1.75712L6.14808 0.814453L11.3334 5.99979L6.14808 11.1851L5.20541 10.2425L8.78141 6.66645H0.666748V5.33312H8.78141Z"
          fill="hsl(var(--primary))"
        />
      </svg>
    </motion.a>
  );
}

function HeroTitles() {
  return (
    <div className="flex w-full max-w-2xl flex-col space-y-2 overflow-hidden pt-2 lg:pt-0">
      <motion.h1
        className="text-center space-x-3 lg:text-left text-4xl font-medium leading-tight text-foreground sm:text-5xl md:text-6xl"
        initial={{ filter: "blur(10px)", opacity: 0, y: 50 }}
        animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
        transition={{
          duration: 1,
          ease,
          staggerChildren: 0.2,
        }}
      >
        {["Trợ lý", <AuroraText>tuyển sinh</AuroraText>].map((text, index) => (
          <motion.span
            key={index}
            className="inline-block text-balance font-semibold"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.8,
              delay: index * 0.2,
              ease,
            }}
          >
            {text}
          </motion.span>
        ))}
      </motion.h1>
      <motion.p
        className="mx-auto lg:mx-0 max-w-xl text-center lg:text-left text-[0.85rem] sm:text-xl leading-7 text-muted-foreground sm:leading-9 whitespace-nowrap"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.6,
          duration: 0.8,
          ease,
        }}
      >
        Trường Đại học Công nghệ Kỹ thuật TP. Hồ Chí Minh
      </motion.p>
    </div>
  );
}

function HeroCTA() {
  return (
    <>
      <motion.div
        className="mx-auto lg:mx-0 mt-6 flex w-full max-w-2xl flex-col items-center lg:items-start justify-center lg:justify-start space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.8, ease }}
      >
        <Link href="/chat">
          <Button
            size="lg"
            effect="expandIcon"
            className="rounded-full     cursor-pointer  text-lg h-14 px-8 shadow-md"
            icon={ArrowRightIcon}
            iconPlacement="right"
          >
            Trò chuyện với trợ lý
          </Button>
        </Link>
      </motion.div>
      <motion.p
        className="mt-5 text-[0.8rem] text-muted-foreground text-center lg:text-left"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0, duration: 0.8 }}
      >
        Tư vấn 24/7, đa dạng thông tin
      </motion.p>
    </>
  );
}

function HeroImage() {
  return (
    <motion.div
      className="relative mx-auto flex w-full flex-col items-center justify-center"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.2, duration: 1, ease }}
    >
      <HeroVideoDialog
        animationStyle="from-center"
        videoSrc="https://www.youtube.com/embed/PXlK5z4uuo8"
        thumbnailSrc="/images/welcome-banner.png"
        thumbnailAlt="Hero Video"
        className="border mt-8 rounded-lg shadow-lg max-w-screen-lg"
      />
    </motion.div>
  );
}

export default function Hero2() {
  return (
    <section id="hero">
      <div className="relative  flex w-full flex-col items-center justify-start px-4 sm:px-6 pt-12 md:pt-24 gap-8  lg:px-8">
        <div className="flex flex-col lg:flex-row items-center justify-center gap-2 md:gap-12 w-full max-w-6xl mx-auto">
          {/* Left Column: Robot Banner */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1, ease }}
            className="flex-shrink-0"
          >
            <img
              src="/images/robot-banner.png"
              alt="Robot Banner"
              className="w-full max-w-[250px] h-auto "
            />
          </motion.div>

          {/* Right Column: Text */}
          <div className="flex flex-col items-center lg:items-start">
            <HeroTitles />
            <HeroCTA />
          </div>
        </div>

        <GridPattern
          width={50}
          height={50}
          x={-5}
          y={-5}
          strokeDasharray={"8 4"}
          className={cn(
            "[mask-image:radial-gradient(600px_circle_at_top_right,white,transparent)]",
            "z-[-1]"
          )}
        />
        <HeroImage />
        <div className="pointer-events-none absolute inset-x-0 -bottom-12 h-1/8 bg-gradient-to-t from-background via-background to-transparent lg:h-1/4"></div>
      </div>
    </section>
  );
}
