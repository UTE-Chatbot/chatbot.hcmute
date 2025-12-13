"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import React from "react";
import { motion } from "framer-motion";
import { Button } from "../ui/button";
import { ArrowRight } from "lucide-react";

interface ContactModalProps {
  trigger: React.ReactNode;
  open?: boolean;
  setOpen?: (open: boolean) => void;
}

const advisors = [
  {
    name: "Thầy Nguyễn Hữu Tùng",
    role: "Chuyên viên phụ trách tuyển sinh",
    phone: "0946 939 128",
  },
  {
    name: "Thầy Trần Trung Hậu",
    role: "Chuyên viên phụ trách tuyển sinh",
    phone: "0983 469 719",
  },
  {
    name: "Thầy Lê Thanh Hữu",
    role: "Chuyên viên tư vấn tuyển sinh",
    phone: "0908 204 600",
  },
  {
    name: "Cô Phạm Thị Thúy Hạnh",
    role: "Chuyên viên tư vấn tuyển sinh",
    phone: "090 851 2713",
  },
  {
    name: "Cô Phan Vũ Thanh Thảo",
    role: "Chuyên viên tư vấn tuyển sinh",
    phone: "093 812 7996",
  },
  {
    name: "Cô Trần Thị Hoa",
    role: "Chuyên viên tư vấn tuyển sinh",
    phone: "0389 695 970",
  },
  {
    name: "Thầy Đặng Hữu Khanh",
    role: "Phó Trưởng phòng Tuyển sinh và CTSV",
    phone: "0919 850 721",
  },
  {
    name: "Thầy Lê Quang Bình",
    role: "Phó Trưởng phòng Tuyển sinh và CTSV",
    phone: "0938 775 001",
  },
  {
    name: "Cô Nguyễn Phương Thúy",
    role: "Phó Trưởng phòng Tuyển sinh và CTSV",
    phone: "0988 881 540",
  },
  {
    name: "Cô Phạm Thị Thu Sương",
    role: "Phó Trưởng phòng Đào tạo",
    phone: "0933 951 041",
  },
  {
    name: "Thầy Trần Thanh Thưởng",
    role: "Trưởng phòng Tuyển sinh và CTSV",
    phone: "0902 043 979",
  },
  {
    name: "Thầy Võ Viết Cường",
    role: "Trưởng phòng Đào tạo",
    phone: "0986 523 475",
  },
];

export function ContactModal({ trigger, open, setOpen }: ContactModalProps) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="mb-8 flex overflow-auto h-auto max-h-[calc(100vh-2rem)] min-w-[calc(100vw-2rem)] flex-col justify-between gap-0 p-[2rem]"
      >
        <div className="flex items-center justify-between gap-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Ban tư vấn tuyển sinh
            </h2>
          </div>
          <Button
            variant="destructive"
            effect="expandIcon"
            iconPlacement="right"
            icon={ArrowRight}
            onClick={() => {
              setOpen?.(false);
            }}
          >
            Thoát
          </Button>
        </div>

        <ScrollArea className="flex-1 mt-4 pr-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <p className="text-muted-foreground mt-1">
              Tư vấn hướng nghiệp và tuyển sinh đóng vai trò quan trọng trong
              việc hỗ trợ thí sinh hiểu rõ về quy trình tuyển sinh, các cơ hội
              học vụ và đưa ra lựa chọn phù hợp với năng lực và sở thích của thí
              sinh. Trường Đại học Sư phạm Kỹ thuật TP.HCM tự hào khi có một đội
              ngũ tư vấn viên tư vấn hướng nghiệp và tuyển sinh chuyên nghiệp:
            </p>
            <div className="flex gap-2">
              <p className="font-semibold">Tổng Đài:</p>
              <div className="text-primary font-medium">
                <a href="tel:02837225724" className="hover:underline">
                  028. 3722 5724
                </a>
                <span>-</span>
                <a href="tel:02838961333" className="hover:underline">
                  028. 3896 1333
                </a>
              </div>
            </div>

            <div className="space-y-3">
              <p className="font-semibold text-center">
                Hotline tư vấn hướng nghiệp tuyển sinh chung:
              </p>
              <div className="border rounded-lg overflow-hidden shadow-sm">
                <Table>
                  <TableHeader className="bg-muted">
                    <TableRow>
                      <TableHead className="w-[50px] text-center">TT</TableHead>
                      <TableHead>Họ và tên tư vấn viên</TableHead>
                      <TableHead>Chức vụ</TableHead>
                      <TableHead>Điện thoại</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {advisors.map((advisor, index) => (
                      <TableRow
                        key={advisor.name}
                        className="hover:bg-muted/50 transition-colors"
                      >
                        <TableCell className="text-center font-medium">
                          {index + 1}
                        </TableCell>
                        <TableCell>{advisor.name}</TableCell>
                        <TableCell>{advisor.role}</TableCell>
                        <TableCell>
                          <a
                            href={`tel:${advisor.phone}`}
                            className="text-primary hover:underline"
                          >
                            {advisor.phone}
                          </a>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="text-center text-sm pt-4 border-t">
              Danh sách các ngành đào tạo và Tư vấn chuyên ngành:{" "}
              <a
                href="https://tuyensinh.hcmute.edu.vn/#/dh-chinh-quy/thong-tin-tuyen-sinh-dh-chinh-quy/CAC-NGANH-TUYEN-SINH-NAM-2024-1706762539801#top"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary font-medium hover:underline inline-flex items-center gap-1"
              >
                xem tại đây
              </a>
            </div>
          </motion.div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
