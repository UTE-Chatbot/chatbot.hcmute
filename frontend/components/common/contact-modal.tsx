"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
        className="mb-8 flex flex-col justify-between gap-0 p-4 sm:p-8 overflow-auto h-auto max-h-[85vh] w-[90vw] sm:w-full sm:max-w-4xl"
      >
        <div className="flex items-center justify-between gap-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              Ban tư vấn tuyển sinh
            </h2>
          </div>
          <DialogClose asChild>
            <Button
              variant="destructive"
              effect="expandIcon"
              iconPlacement="right"
              icon={ArrowRight}
            >
              Thoát
            </Button>
          </DialogClose>
        </div>

        <div className="flex-1 mt-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <p className="text-muted-foreground mt-1 whitespace-normal break-words">
              Tư vấn hướng nghiệp và tuyển sinh đóng vai trò quan trọng trong
              việc hỗ trợ thí sinh hiểu rõ về quy trình tuyển sinh, các cơ hội
              học vụ và đưa ra lựa chọn phù hợp với năng lực và sở thích của thí
              sinh. Trường Đại học Sư phạm Kỹ thuật TP.HCM tự hào khi có một đội
              ngũ tư vấn viên tư vấn hướng nghiệp và tuyển sinh chuyên nghiệp:
            </p>
            <div className="flex flex-wrap gap-2">
              <p className="font-semibold">Tổng Đài:</p>
              <div className="text-primary font-medium">
                <a href="tel:02837225724" className="hover:underline">
                  028. 3722 5724
                </a>
                <span> - </span>
                <a href="tel:02838961333" className="hover:underline">
                  028. 3896 1333
                </a>
              </div>
            </div>

            <div className="space-y-3">
              <p className="font-semibold text-center">
                Hotline tư vấn hướng nghiệp tuyển sinh chung:
              </p>
              <div className="border rounded-lg overflow-x-auto shadow-sm max-w-[calc(100vw-4rem)] sm:max-w-none">
                <Table className="min-w-[600px]">
                  <TableHeader className="bg-muted">
                    <TableRow>
                      <TableHead className="w-[50px] text-center whitespace-nowrap">
                        TT
                      </TableHead>
                      <TableHead className="whitespace-nowrap">
                        Họ và tên tư vấn viên
                      </TableHead>
                      <TableHead className="whitespace-nowrap">
                        Chức vụ
                      </TableHead>
                      <TableHead className="whitespace-nowrap">
                        Điện thoại
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {advisors.map((advisor, index) => (
                      <TableRow
                        key={advisor.name}
                        className="hover:bg-muted/50 transition-colors"
                      >
                        <TableCell className="text-center font-medium whitespace-nowrap">
                          {index + 1}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {advisor.name}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {advisor.role}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
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

            <div className="text-center text-sm pt-4 border-t whitespace-normal break-words">
              Danh sách các ngành đào tạo và Tư vấn chuyên ngành:{" "}
              <a
                href="https://tuyensinh.hcmute.edu.vn/#/dh-chinh-quy/thong-tin-tuyen-sinh-dh-chinh-quy/CAC-NGANH-TUYEN-SINH-NAM-2024-1706762539801#top"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary font-medium hover:underline"
              >
                Xem tại đây
              </a>
            </div>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
