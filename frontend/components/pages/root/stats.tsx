"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { AuroraText } from "@/components/ui/aurora-text";
import { MagicCard } from "@/components/ui/magic-card";
import { NumberTicker } from "@/components/ui/number-ticker";

const STATS = [
  {
    value: 63,
    suffix: "+",
    label: "Năm hình thành, Phát triển bền vững",
    description:
      "Trường được thành lập năm 1962 với bề dài truyền thống và thành tích",
  },
  {
    value: 300000,
    suffix: "+ m²",
    label: "Diện tích khuôn viên Nhà trường",
    description:
      "Trường có cơ sở chính 174.247m²; cơ sở Lê Văn Việt 44.408m²; Phân hiệu Tỉnh Bình Phước: 90.000 m²",
  },
  {
    value: 98,
    suffix: "%",
    label: "Sinh viên có việc làm ngay",
    description:
      "Tỷ lệ sinh viên có việc làm sau khi tốt nghiệp trong vòng 6 tháng đạt mức cao hàng năm.",
  },
  {
    value: 150,
    suffix: "+",
    label: "Đối tác quốc tế",
    description:
      "Hợp tác với nhiều trường đại học và tổ chức giáo dục uy tín trên toàn thế giới.",
  },
  {
    value: 50,
    suffix: "+",
    label: "Câu lạc bộ đội nhóm",
    description:
      "Môi trường năng động với nhiều CLB học thuật, văn hóa, nghệ thuật và thể thao.",
  },
];

export default function Stats() {
  // Carousel state for Stats
  const [statsCarouselApi, setStatsCarouselApi] = useState<CarouselApi>();
  const [canScrollStatsPrev, setCanScrollStatsPrev] = useState(false);
  const [canScrollStatsNext, setCanScrollStatsNext] = useState(false);

  // Effect for Stats Carousel
  useEffect(() => {
    if (!statsCarouselApi) {
      return;
    }

    const updateStatsScrollState = () => {
      setCanScrollStatsPrev(statsCarouselApi.canScrollPrev());
      setCanScrollStatsNext(statsCarouselApi.canScrollNext());
    };

    updateStatsScrollState();
    statsCarouselApi.on("select", updateStatsScrollState);
    statsCarouselApi.on("reInit", updateStatsScrollState);

    return () => {
      statsCarouselApi.off("select", updateStatsScrollState);
      statsCarouselApi.off("reInit", updateStatsScrollState);
    };
  }, [statsCarouselApi]);

  return (
    <section className="pt-16 pb-0 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        {/* Stats Title */}
        <motion.div
          className="text-center mb-8 md:mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl text-center sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Những con số
            <AuroraText className="px-2">ấn tượng</AuroraText>
          </h2>

          {/* Mobile Navigation */}
          <div className="flex md:hidden justify-center gap-4 mt-4">
            <button
              className={`bg-white hover:bg-gray-100 shadow-md rounded-full p-3 transition-all duration-200 ${
                !canScrollStatsPrev ? "opacity-50 cursor-not-allowed" : ""
              }`}
              onClick={() => statsCarouselApi?.scrollPrev()}
              disabled={!canScrollStatsPrev}
            >
              <ChevronLeft className="w-6 h-6 text-gray-600" />
            </button>
            <button
              className={`bg-white hover:bg-gray-100 shadow-md rounded-full p-3 transition-all duration-200 ${
                !canScrollStatsNext ? "opacity-50 cursor-not-allowed" : ""
              }`}
              onClick={() => statsCarouselApi?.scrollNext()}
              disabled={!canScrollStatsNext}
            >
              <ChevronRight className="w-6 h-6 text-gray-600" />
            </button>
          </div>
        </motion.div>

        {/* Stats Carousel */}
        <div className="mb-12 md:mb-20 flex justify-between relative">
          {canScrollStatsPrev && (
            <div className="hidden md:flex items-center pr-4">
              <button
                className={`bg-white hover:bg-gray-100 shadow-md rounded-full p-3 shadow-lg transition-bg duration-200`}
                onClick={() => statsCarouselApi?.scrollPrev()}
              >
                <ChevronLeft className="w-6 h-6 text-gray-600" />
              </button>
            </div>
          )}

          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            plugins={[
              Autoplay({
                delay: 6000,
              }),
            ]}
            className="w-full"
            setApi={setStatsCarouselApi}
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {STATS.map((stat, index) => (
                <CarouselItem
                  key={index}
                  className="pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3 pt-4"
                >
                  <div className="h-full p-4 md:p-6 rounded-2xl bg-white border border-gray-150 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
                    <div className="flex flex-col items-start text-left h-full">
                      <div className="mb-4 flex items-baseline">
                        {stat.value ? (
                          <>
                            <NumberTicker
                              value={stat.value}
                              className="text-primary text-5xl font-bold"
                            />
                            <span className="text-primary text-5xl font-bold ml-1">
                              {stat.suffix}
                            </span>
                          </>
                        ) : (
                          <span className="text-primary text-5xl font-bold">
                            {stat.display}
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors duration-300">
                        {stat.label}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {stat.description}
                      </p>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>

          {canScrollStatsNext && (
            <div className="hidden md:flex items-center pl-4">
              <button
                className={`bg-white hover:bg-gray-100 shadow-md rounded-full p-3 shadow-lg transition-bg duration-200`}
                onClick={() => statsCarouselApi?.scrollNext()}
              >
                <ChevronRight className="w-6 h-6 text-gray-600" />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
