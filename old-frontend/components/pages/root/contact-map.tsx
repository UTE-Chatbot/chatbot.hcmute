"use client";

import { motion } from "framer-motion";
import { AuroraText } from "@/components/ui/aurora-text";
import { MapPin, Phone, Mail, Globe } from "lucide-react";

export default function ContactMap() {
  return (
    <section className="py-8 pb-8 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          className="text-center mb-8 md:mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl text-center sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Liên hệ
          </h2>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Map Column */}
          <motion.div
            className="w-full h-[450px] rounded-3xl overflow-hidden shadow-xl border border-gray-200"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2841.9223528989023!2d106.7693381732418!3d10.850637657824123!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752763f23816ab%3A0x282f711441b6916f!2zVHLGsOG7nW5nIMSQ4bqhaSBo4buNYyBTxrAgcGjhuqFtIEvhu7kgdGh14bqtdCBUaMOgbmggcGjhu5EgSOG7kyBDaMOtIE1pbmg!5e1!3m2!1svi!2s!4v1765131191355!5m2!1svi!2s"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full h-full"
            ></iframe>
          </motion.div>

          {/* Contact Info Column */}
          <motion.div
            className="flex flex-col justify-center h-full space-y-8 p-6 lg:p-10 bg-gray-50 rounded-3xl border border-gray-100 shadow-lg"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="space-y-6">
              {[
                {
                  icon: MapPin,
                  title: "Địa chỉ",
                  description:
                    "1 Võ Văn Ngân, Phường Linh Chiểu, Thành phố Thủ Đức, Thành phố Hồ Chí Minh",
                  type: "address",
                },
                {
                  icon: Phone,
                  title: "Số điện thoại",
                  description: "+84 28 3722 1223",
                  type: "phone",
                },
                {
                  icon: Mail,
                  title: "Email",
                  description: "ptchc@hcmute.edu.vn",
                  type: "email",
                },
                {
                  icon: Globe,
                  title: "Website",
                  description: "hcmute.edu.vn",
                  type: "url",
                },
              ].map((item, index) => (
                <div className="flex items-start space-x-4" key={index}>
                  <div className="bg-primary p-3 rounded-full">
                    <item.icon className="size-6  text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {item.title}
                    </h3>
                    {item.type === "url" ? (
                      <a
                        href={item.description}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline mt-1 block"
                      >
                        {item.description}
                      </a>
                    ) : item.type === "email" ? (
                      <a
                        href={`mailto:${item.description}`}
                        className="text-primary hover:underline mt-1 block"
                      >
                        {item.description}
                      </a>
                    ) : (
                      <p className="text-gray-600 mt-1">{item.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
