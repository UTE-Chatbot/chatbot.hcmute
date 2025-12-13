"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  LINKED_SCHOOL_HTML_CONTENT,
  SCHOOL_TABLE_HTML_CONTENT,
} from "@/assets/constants/global_content";
import { Footer } from "@/components/pages/root/footer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { motion } from "framer-motion";

const AboutPage = () => {
  const [selectedTable, setSelectedTable] = useState("1");
  const [searchQuery, setSearchQuery] = useState("");
  const contentRef = useRef<HTMLDivElement>(null);

  const tableOptions = [
    { value: "1", label: "Danh sách trường liên kết" },
    {
      value: "2",
      label:
        "Danh sách trường chuyên, năng khiếu, trường ưu tiên & phân hiệu Bình Phước",
    },
  ];

  const getContent = () => {
    switch (selectedTable) {
      case "1":
        return LINKED_SCHOOL_HTML_CONTENT;
      case "2":
        return SCHOOL_TABLE_HTML_CONTENT;
      default:
        return "";
    }
  };

  useEffect(() => {
    if (!contentRef.current) return;

    // Re-render content to ensure all rows are present before filtering
    // This is important if getContent() changes the DOM structure
    // For this specific case, getContent() returns HTML strings, so the DOM is re-rendered
    // when selectedTable changes, which triggers this effect.

    const rows = contentRef.current.querySelectorAll("tbody tr");
    const query = searchQuery.toLowerCase().trim();

    rows.forEach((row) => {
      if (!query) {
        (row as HTMLElement).style.display = ""; // Show all rows if query is empty
        return;
      }

      const text = row.textContent?.toLowerCase() || "";
      if (text.includes(query)) {
        (row as HTMLElement).style.display = "";
      } else {
        (row as HTMLElement).style.display = "none";
      }
    });
  }, [searchQuery, selectedTable]);

  return (
    <div className="flex flex-col min-h-screen">
      <div className="container mx-auto py-8 px-4 flex-grow space-y-8">
        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="max-w-4xl mx-auto space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Tìm kiếm
              </label>
              <Input
                placeholder="Tìm kiếm theo tên trường, tỉnh thành..."
                className=" text-base shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Chọn danh sách muốn xem
              </label>
              <Select value={selectedTable} onValueChange={setSelectedTable}>
                <SelectTrigger className="w-full bg-background border-input shadow-sm h-12 text-base">
                  <SelectValue placeholder="Chọn danh sách" />
                </SelectTrigger>
                <SelectContent>
                  {tableOptions.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      className="py-3"
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </motion.div>

        {/* Content Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="shadow-lg !pt-0 !bg-white border-muted rounded-3xl overflow-hidden">
            <CardContent className="p-0 !bg-white">
              <div
                ref={contentRef} // Added ref
                className="
                            p-0
                            overflow-auto
                            h-[600px]
                            max-w-none
                            prose prose-sm md:prose-base dark:prose-invert
                            prose-headings:text-primary
                            
                            /* Ensure text content has padding since we removed it from container */
                            [&_p]:px-4 [&_h1]:px-4 [&_h2]:px-4 [&_h3]:px-4 [&_ul]:px-4
                            
                            /* Table Styling Override */
                            [&_table]:w-full 
                            [&_table]:border-separate 
                            [&_table]:border-spacing-0 
                            [&_table]:border-0 /* Remove outer border to let Card handle it */
                            [&_table]:my-0 /* Flush to top */
                            
                            /* Header Cells - Sticky & Styled */
                            [&_th]:sticky
                            [&_th]:top-0
                            [&_th]:z-10
                            [&_th]:border-b
                            [&_th]:border-r
                            [&_th]:border-border 
                            [&_th]:bg-card /* Opaque background needed for sticky */
                            [&_th]:shadow-[0_1px_0_0_hsl(var(--border))]
                            [&_th]:p-3 
                            [&_th]:text-left 
                            [&_th]:font-semibold 
                            [&_th]:text-foreground
                            [&_th:last-child]:border-r-0
                            /* Reset prose specific padding removals */
                            [&_th:first-child]:pl-4 /* Add extra padding for edge */
                            [&_th:last-child]:pr-4

                            /* Body Cells */
                            [&_td]:border-b
                            [&_td]:border-r
                            [&_td]:border-border 
                            [&_td]:p-3 
                            [&_td]:text-foreground
                            [&_td:last-child]:border-r-0
                            [&_tr:last-child_td]:border-b-0
                            /* Reset prose specific padding removals */
                            [&_td:first-child]:pl-4
                            [&_td:last-child]:pr-4

                            /* Zebra Striping */
                            [&_tr:nth-child(even)]:bg-muted/20
                            [&_tr:hover]:bg-muted/40
                            [&_tr]:transition-colors
                        "
                dangerouslySetInnerHTML={{ __html: getContent() }}
              />
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
};

export default AboutPage;
