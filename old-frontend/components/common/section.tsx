"use client";

import { motion } from "framer-motion";

interface SectionProps {
  id?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

export default function Section({
  id,
  title,
  subtitle,
  description,
  children,
  className,
}: SectionProps) {
  const sectionId = title ? title.toLowerCase().replace(/\s+/g, "-") : id;
  return (
    <section id={id || sectionId}>
      <div className={className}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative container mx-auto px-4  max-w-7xl"
        >
          <div className="text-center space-y-4 pb-6 mx-auto">
            {title && (
              <h2 className="text-sm text-primary font-mono font-medium tracking-wider uppercase">
                {title}
              </h2>
            )}
            {subtitle && (
              <h3 className="mx-auto mt-4 max-w-xs text-3xl font-semibold sm:max-w-none sm:text-4xl md:text-5xl">
                {subtitle}
              </h3>
            )}
            {description && (
              <p className="mt-6 text-lg leading-8 text-slate-600 max-w-2xl mx-auto">
                {description}
              </p>
            )}
          </div>
          {children}
        </motion.div>
      </div>
    </section>
  );
}
