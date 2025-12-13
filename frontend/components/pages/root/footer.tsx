import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { FaEarthAsia } from "react-icons/fa6";
import { FaFacebook } from "react-icons/fa";

const footerSocials = [
  {
    href: "https://www.facebook.com/ute.sao/",
    name: "Facebook",
    icon: <FaFacebook className="size-5 md:size-8" />,
  },
  {
    href: "https://sao.hcmute.edu.vn/",
    name: "Website",
    icon: <FaEarthAsia className="size-5 md:size-8" />,
  },
];

export function Footer() {
  return (
    <footer className=" bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mx-auto w-full max-w-screen-xl px-4 py-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex space-x-4">
              {footerSocials.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  className="text-gray-500 hover:text-foreground transition-colors"
                >
                  {social.icon}
                  <span className="sr-only">{social.name}</span>
                </a>
              ))}
            </div>
            <span className="text-sm text-muted-foreground text-center">
              Bản quyền thuộc về
              <br className="block sm:!hidden" />
              <span className="hidden sm:!inline"> </span>
              <a href="/" className="font-medium hover:underline">
                Phòng TS & CTSV HCMUTE
              </a>{" "}
              © {new Date().getFullYear()}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
