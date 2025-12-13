"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { AuroraText } from "@/components/ui/aurora-text";
import { Phone, Globe, Glasses, Video } from "lucide-react";
import { ContactModal } from "@/components/common/contact-modal";
import { HeroVideoDialog } from "@/components/ui/hero-video-dialog";

const EXPLORE_ITEMS = [
  {
    title: "Thông tin liên hệ",
    description: "Kết nối với nhà trường, phòng ban và các đơn vị.",
    href: "https://hcmute.edu.vn/lien-he",
    icon: Phone,
  },
  {
    title: "Website HCMUTE",
    description: "Cổng thông tin chính thức của trường ĐH SPKT TP.HCM.",
    href: "https://hcmute.edu.vn",
    icon: Globe,
  },
  {
    title: "VR 360",
    description: "Tham quan khuôn viên trường qua thực tế ảo.",
    href: "https://360.hcmute.edu.vn",
    icon: Glasses,
  },
  {
    title: "Video giới thiệu HCMUTE",
    description: "Xem video giới thiệu về lịch sử và phát triển của trường.",
    href: "https://www.youtube.com/c/HCMUTEChannel",
    icon: Video,
  },
];

export default function Explore() {
  return (
    <section className="pt-0 pb-16 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl text-center sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Khám phá thêm
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {EXPLORE_ITEMS.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              {item.title === "Thông tin liên hệ" ? (
                <ContactModal
                  trigger={
                    <div className="relative h-64 rounded-2xl overflow-hidden group cursor-pointer shadow-md hover:shadow-xl transition-all duration-300">
                      {/* Background - Primary */}
                      <div className="absolute inset-0 bg-primary group-hover:bg-primary/90 transition-colors duration-300">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <item.icon className="w-24 h-24 text-white/20 group-hover:scale-110 group-hover:text-white/30 transition-all duration-500" />
                        </div>
                      </div>

                      {/* Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                      {/* Content */}
                      <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                        <h3 className="text-white font-bold text-xl mb-2 group-hover:text-white/90">
                          {item.title}
                        </h3>
                        <p className="text-white/80 text-sm line-clamp-2 opacity-80 group-hover:opacity-100 transition-opacity duration-300 delay-75">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  }
                />
              ) : item.title === "Video giới thiệu HCMUTE" ? (
                <HeroVideoDialog
                  videoSrc="https://www.youtube.com/embed/PXlK5z4uuo8"
                  thumbnailSrc="" // Not used when children are provided
                  animationStyle="from-center"
                  className="h-full"
                >
                  <div className="relative h-64 rounded-2xl overflow-hidden group cursor-pointer shadow-md hover:shadow-xl transition-all duration-300">
                    {/* Background - Primary */}
                    <div className="absolute inset-0 bg-primary group-hover:bg-primary/90 transition-colors duration-300">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <item.icon className="w-24 h-24 text-white/20 group-hover:scale-110 group-hover:text-white/30 transition-all duration-500" />
                      </div>
                    </div>

                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                    {/* Content */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                      <h3 className="text-white font-bold text-xl mb-2 group-hover:text-white/90">
                        {item.title}
                      </h3>
                      <p className="text-white/80 text-sm line-clamp-2 opacity-80 group-hover:opacity-100 transition-opacity duration-300 delay-75">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </HeroVideoDialog>
              ) : (
                <Link href={item.href} target="_blank" className="block h-full">
                  <div className="relative h-64 rounded-2xl overflow-hidden group cursor-pointer shadow-md hover:shadow-xl transition-all duration-300">
                    {/* Background - Primary */}
                    <div className="absolute inset-0 bg-primary group-hover:bg-primary/90 transition-colors duration-300">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <item.icon className="w-24 h-24 text-white/20 group-hover:scale-110 group-hover:text-white/30 transition-all duration-500" />
                      </div>
                    </div>

                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                    {/* Content */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                      <h3 className="text-white font-bold text-xl mb-2 group-hover:text-white/90">
                        {item.title}
                      </h3>
                      <p className="text-white/80 text-sm line-clamp-2 opacity-80 group-hover:opacity-100 transition-opacity duration-300 delay-75">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </Link>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
