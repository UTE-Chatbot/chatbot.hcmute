import { Icons } from "@/components/ui/icons";
import { FaTwitter } from "react-icons/fa";
import { FaYoutube } from "react-icons/fa6";
import { RiInstagramFill } from "react-icons/ri";
import * as React from "react";
import { ContactIcon } from "lucide-react";

type HeaderItem =
  | {
      trigger: string;
      content: {
        main?: {
          icon: React.ReactNode;
          title: string;
          description: string;
          href: string;
        };
        items: {
          href: string;
          title: string;
          description: string;
        }[];
      };
      href?: never;
      label?: never;
      icon?: any;
    }
  | {
      trigger?: never;
      icon?: any;
      content?: never;
      href: string;
      label: string;
    };

export const BLUR_FADE_DELAY = 0.15;

export const siteConfig = {
  name: "Chatbot Tư Vấn Tuyển Sinh | Trường Đại học Công nghệ Kỹ thuật TP. Hồ Chí Minh",
  shortName: "Chatbot Tư Vấn Tuyển Sinh | HCMUTE",
  description:
    "Chatbot tư vấn tuyển sinh của Trường Đại học Công nghệ Kỹ thuật TP. Hồ Chí Minh. Giải đáp thông tin về ngành học, điểm chuẩn và thủ tục tuyển sinh.",
  ogDescription:
    "Chatbot tư vấn tuyển sinh của Trường Đại học Công nghệ Kỹ thuật TP. Hồ Chí Minh. Hỗ trợ thông tin tuyển sinh 24/7.",
  url: "https://chatbot.hcmute.edu.vn/",
  ogImage:
    "https://res.cloudinary.com/dh7w9mvrq/image/upload/v1744577513/471306834_1312910153458292_2571871794578179435_n_w28hmt.jpg",
  keywords: [
    "chatbot tuyển sinh",
    "HCMUTE",
    "Đại học Sư Phạm Kỹ Thuật",
    "tư vấn tuyển sinh",
    "đại học",
    "tuyển sinh đại học",
    "tuyển sinh HCMUTE",
    "điểm chuẩn HCMUTE",
    "ngành học HCMUTE",
    "tuyển sinh 2025",
    "xét tuyển đại học",
    "Sư phạm Kỹ thuật TP.HCM",
  ],
  header: [
    {
      trigger: "Thông tin tuyển sinh",
      content: {
        items: [
          {
            href: "/lien-ket",
            title: "Danh sách trường",
            description: "Trường Trung học phổ thông liên kết tuyển sinh",
          },
          // {
          //   href: "/diem-chuan",
          //   title: "Điểm chuẩn các năm",
          //   description: "Tổng hợp điểm chuẩn hàng năm",
          // },
        ],
      },
    },
    {
      icon: ContactIcon,
      href: "https://tuyensinh.hcmute.edu.vn",
      label: "Liên hệ",
    },
  ] as HeaderItem[],
};

export type SiteConfig = typeof siteConfig;
