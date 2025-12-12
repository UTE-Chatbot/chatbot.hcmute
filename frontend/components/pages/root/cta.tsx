import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  ArrowRightIcon,
  Bot,
  ChartBar,
  MessageCircleCodeIcon,
  MessageCircleDashed,
  MessageCircleIcon,
  MessageCircleMore,
  MessageSquareHeart,
  MessageSquareIcon,
  PlayIcon,
} from "lucide-react";

export default function CtaSection() {
  return (
    <section className="py-8 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="group relative overflow-hidden rounded-3xl bg-primary px-6 py-16 text-center shadow-xl sm:px-16 md:py-24 transition-all hover:shadow-2xl">
          {/* Background Icon */}
          <div className="absolute bottom-0 md:left-8 transform md:-translate-y-1/2 opacity-20 md:top-1/2 md:right-8 md:transform md:-translate-y-1/2">
            <MessageSquareIcon className="h-50 w-50 md:h-60 md:w-60 text-white  transition-transform duration-500 group-hover:scale-110" />
          </div>

          <div className="relative z-10 flex flex-col items-center gap-6">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
              Luôn sẵn sàng hỗ trợ bạn mọi lúc
            </h2>

            <Link href="/chat">
              <Button
                size="lg"
                variant="secondary"
                effect="expandIcon"
                className="rounded-full     cursor-pointer  text-lg h-14 px-8 shadow-md"
                icon={PlayIcon}
                iconPlacement="right"
              >
                Bắt đầu
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
