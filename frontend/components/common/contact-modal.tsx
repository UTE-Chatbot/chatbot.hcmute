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
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "../ui/button";
import { ArrowRight, ChevronDown, ChevronUp } from "lucide-react";

interface ContactModalProps {
  trigger: React.ReactNode;
  open?: boolean;
  setOpen?: (open: boolean) => void;
}

const advisors = [
  {
    id: 1,
    name: "Thầy Nguyễn Hữu Tùng",
    role: "Chuyên viên phụ trách tuyển sinh",
    phone: "0946 939 128",
  },
  {
    id: 2,
    name: "Thầy Trần Trung Hậu",
    role: "Chuyên viên phụ trách tuyển sinh",
    phone: "0983 469 719",
  },
  {
    id: 3,
    name: "Thầy Nguyễn Trần Phú",
    role: "PTP. QT Thương hiệu và Truyền thông",
    phone: "0986 807 479",
  },
  {
    id: 4,
    name: "Cô Phạm Thị Thúy Hạnh",
    role: "Chuyên viên tư vấn tuyển sinh",
    phone: "090 851 2713",
  },
  {
    id: 5,
    name: "Cô Phan Vũ Thanh Thảo",
    role: "Chuyên viên tư vấn tuyển sinh",
    phone: "093 812 7996",
  },
  {
    id: 6,
    name: "Cô Trần Thị Hoa",
    role: "Chuyên viên tư vấn tuyển sinh",
    phone: "0389 695 970",
  },
  {
    id: 7,
    name: "Cô Trần Thị Thu Huyền",
    role: "QTP. QT Thương hiệu và Truyền thông",
    phone: "0985 305 444",
  },
  {
    id: 8,
    name: "Cô Lê Việt Tiên",
    role: "PTP. QT Thương hiệu và Truyền thông",
    phone: "0985 188 457",
  },
  {
    id: 9,
    name: "Thầy Lê Xuân Thân",
    role: "PTP. QT Thương hiệu và Truyền thông",
    phone: "0987 620 732",
  },
  {
    id: 10,
    name: "Cô Phạm Thị Thu Sương",
    role: "Phó Trưởng phòng Đào tạo",
    phone: "0933 951 041",
  },
  {
    id: 11,
    name: "Cô Võ Thị Ngà",
    role: "Trưởng phòng Đào tạo",
    phone: "0938 525 351",
  },
];

const facultyAdvisors = [
  {
    name: "KHOA CƠ KHÍ ĐỘNG LỰC",
    items: [
      {
        id: 1,
        department: "Ngành Công nghệ Kỹ thuật ô tô *",
        advisor: "Nguyễn Văn Long Giang",
        phone: "0903 175 378",
      },
      {
        id: 2,
        department: "Ngành Công nghệ Kỹ thuật nhiệt",
        advisor: "Đoàn Minh Hùng",
        phone: "0908318456",
      },
      {
        id: 3,
        department: "Ngành Năng lượng tái tạo",
        advisor: "Nguyễn Xuân Viên",
        phone: "0964 963 436",
      },
    ],
  },
  {
    name: "KHOA CƠ KHÍ CHẾ TẠO MÁY",
    items: [
      {
        id: 4,
        department: "Ngành Robot và trí tuệ nhân tạo",
        advisor: "Bùi Hà Đức",
        phone: "0966 955 459",
      },
      {
        id: 5,
        department: "Ngành Công nghệ chế tạo máy *",
        advisor: "Đặng Minh Phụng",
        phone: "0906 814 944",
      },
      {
        id: 6,
        department: "Ngành Công nghệ Kỹ thuật cơ điện tử *",
        advisor: "Nguyễn Xuân Quang",
        phone: "0918334377",
      },
      {
        id: 7,
        department: "Ngành Công nghệ Kỹ thuật cơ khí *",
        advisor: "Trần Minh Thế Uyên",
        phone: "0896 443 881",
      },
      {
        id: 8,
        department: "Ngành Kỹ thuật công nghiệp",
        advisor: "Lê Minh Tài",
        phone: "0948 996 955",
      },
      {
        id: 9,
        department: "Ngành Kỹ nghệ gỗ và nội thất",
        advisor: "Quách Văn Thiêm",
        phone: "0934 144 256",
      },
      {
        id: 10,
        department: "Chương trình đào tạo Cơ khí - Tự động hóa",
        advisor: "Phạm Sơn Minh",
        phone: "0938226313",
      },
    ],
  },
  {
    name: "KHOA CÔNG NGHỆ THÔNG TIN",
    items: [
      {
        id: 11,
        department: "Ngành Công nghệ thông tin",
        advisor: "Huỳnh Xuân Phụng",
        phone: "0967 853 915",
      },
      {
        id: 12,
        department: "Ngành An toàn thông tin",
        advisor: "Nguyễn Thị Thanh Vân",
        phone: "0905 131 246",
      },
      {
        id: 13,
        department: "Ngành Kỹ thuật dữ liệu",
        advisor: "Hoàng Văn Dũng",
        phone: "0913 377 591",
      },
    ],
  },
  {
    name: "KHOA ĐIỆN ĐIỆN TỬ",
    items: [
      {
        id: 14,
        department: "Ngành Công nghệ Kỹ thuật điện, điện tử",
        advisor: "Lê Trọng Nghĩa",
        phone: "0813 310 460",
      },
      {
        id: 15,
        department: "Ngành Công nghệ Kỹ thuật điện tử - viễn thông",
        advisor: "Võ Đức Dũng",
        phone: "0903 619 314",
      },
      {
        id: 16,
        department: "Ngành Công nghệ Kỹ thuật máy tính",
        advisor: "Trương Quang Phúc",
        phone: "0917 731 988",
      },
      {
        id: 17,
        department: "Ngành Công nghệ Kỹ thuật điều khiển và tự động hóa",
        advisor: "Trần Vi Đô",
        phone: "0866408284",
      },
      {
        id: 18,
        department: "Ngành Kỹ thuật y sinh (Điện tử y sinh)",
        advisor: "Nguyễn Thanh Hải",
        phone: "0906 738 806",
      },
      {
        id: 19,
        department: "Ngành Hệ thống nhúng và IoT",
        advisor: "Phan Văn Ca",
        phone: "0906 701 123",
      },
      {
        id: 20,
        department: "Chương trình đào tạo Kỹ thuật Thiết kế vi mạch",
        advisor: "Pham Ngọc Sơn",
        phone: "0966 609 555",
      },
    ],
  },
  {
    name: "KHOA CÔNG NGHỆ HÓA HỌC VÀ THỰC PHẨM",
    items: [
      {
        id: 21,
        department: "Ngành Công nghệ Kỹ thuật môi trường",
        advisor: "Hoàng Thị Tuyết Nhung",
        phone: "0902 899 811",
      },
      {
        id: 22,
        department: "Ngành Công nghệ thực phẩm",
        advisor: "Vũ Trần Khánh Linh",
        phone: "0966 955 469",
      },
      {
        id: 23,
        department: "Ngành Công nghệ Kỹ thuật hóa học",
        advisor: "Võ Thị Thu Như",
        phone: "0938023717",
      },
      {
        id: 24,
        department: "Ngành Dinh dưỡng và Khoa học thực phẩm",
        advisor: "Phạm Thị Hoàn",
        phone: "097 220 9396",
      },
      {
        id: 25,
        department:
          "Ngành Quản lý tài nguyên và môi trường (Chuyên ngành Môi trường và Phát triển bền vững) (TS mới 2026)",
        advisor: "Hoàng Thị Tuyết Nhung",
        phone: "0902 899 811",
      },
    ],
  },
  {
    name: "KHOA KINH TẾ",
    items: [
      {
        id: 26,
        department: "Ngành Quản lý công nghiệp",
        advisor: "Nguyễn Thị Thanh Thúy",
        phone: "0987 385 910",
      },
      {
        id: 27,
        department: "Ngành Kế toán",
        advisor: "Đào Thị Kim Yến",
        phone: "0905113320",
      },
      {
        id: 28,
        department: "Ngành Thương mại điện tử",
        advisor: "Nguyễn Thị Hồng",
        phone: "0902 689 024",
      },
      {
        id: 29,
        department: "Ngành Logistics và quản lý chuỗi cung ứng",
        advisor: "Vòng Thình Nam",
        phone: "0907 993 345",
      },
      {
        id: 30,
        department: "Ngành Kinh doanh Quốc tế",
        advisor: "Trương Thị Hòa",
        phone: "0866431418",
      },
      {
        id: 31,
        department: "Ngành Công nghệ tài chính",
        advisor: "Lê Thị Mai Hương",
        phone: "0989219182",
      },
      {
        id: 32,
        department: "Ngành Quản trị Kinh doanh",
        advisor: "Phan Thị Thanh Hiền",
        phone: "0988695414",
      },
    ],
  },
  {
    name: "KHOA THỜI TRANG VÀ DU LỊCH",
    items: [
      {
        id: 33,
        department: "Ngành Công nghệ may",
        advisor: "Nguyễn Ngọc Châu",
        phone: "0908 483 884",
      },
      {
        id: 34,
        department: "Ngành Quản trị NH và DV ăn uống",
        advisor: "Hà Thị Huế",
        phone: "0903 324 213",
      },
      {
        id: 35,
        department: "Ngành Thiết kế thời trang",
        advisor: "Nguyễn Xuân Trà",
        phone: "0918 136 465",
      },
    ],
  },
  {
    name: "KHOA XÂY DỰNG",
    items: [
      {
        id: 36,
        department: "Ngành Công nghệ Kỹ thuật công trình xây dựng*",
        advisor: "Trần Tuấn Kiệt",
        phone: "0909 982 935",
      },
      {
        id: 37,
        department: "Ngành Kỹ thuật xây dựng công trình giao thông*",
        advisor: "Nguyễn Duy Liêm",
        phone: "0913 171 844",
      },
      {
        id: 38,
        department: "Ngành Quản lý xây dựng",
        advisor: "Hà Duy Khánh",
        phone: "0932 137 148",
      },
      {
        id: 39,
        department: "Ngành Hệ thống kỹ thuật công trình xây dựng",
        advisor: "Phan Thành Chiến",
        phone: "0768 647 671",
      },
      {
        id: 40,
        department: "Ngành Quản lý và vận hành hạ tầng",
        advisor: "Nguyễn Huỳnh Tấn Tài",
        phone: "0902 884 691",
      },
      {
        id: 41,
        department: "Ngành Kiến trúc",
        advisor: "Đỗ Xuân Sơn",
        phone: "0916 330 679",
      },
      {
        id: 42,
        department: "Ngành Kiến trúc nội thất",
        advisor: "Nguyễn Văn Hoan",
        phone: "0947 078 401",
      },
    ],
  },
  {
    name: "KHOA IN VÀ TRUYỀN THÔNG",
    items: [
      {
        id: 43,
        department: "Ngành Công nghệ Kỹ thuật in",
        advisor: "Chế Quốc Long",
        phone: "0913 922 377",
      },
      {
        id: 44,
        department: "Ngành Thiết kế đồ họa",
        advisor: "Vũ Trần Mai Trâm",
        phone: "0902 996 092",
      },
      {
        id: 45,
        department:
          "Ngành Công nghệ truyền thông (Truyền thông số và Công nghệ Đa phương tiện)",
        advisor: "Nguyễn Long Giang",
        phone: "0903 678 610",
      },
    ],
  },
  {
    name: "KHOA NGOẠI NGỮ",
    items: [
      {
        id: 46,
        department: "Ngành Sư phạm tiếng Anh",
        advisor: "Đinh Thị Thanh Hằng",
        phone: "0388 441 252",
      },
      {
        id: 47,
        department: "Ngành Ngôn ngữ Anh",
        advisor: "Lê Phương Anh",
        phone: "0989 071 934",
      },
    ],
  },
  {
    name: "KHOA KHOA HỌC ỨNG DỤNG",
    items: [
      {
        id: 48,
        department: "Ngành Công nghệ vật liệu",
        advisor: "Nguyễn Chí Thanh",
        phone: "0336 192 598",
      },
      {
        id: 49,
        department:
          "Ngành Vật lý Kỹ thuật (Công nghệ Bán dẫn và cảm biến đo lường) (TS mới 2026)",
        advisor: "Trần Tuấn Anh",
        phone: "0966 858 227",
      },
    ],
  },
  {
    name: "KHOA CHÍNH TRỊ VÀ LUẬT",
    items: [
      {
        id: 50,
        department: "Ngành Luật",
        advisor: "Nguyễn Thị Tuyết Nga",
        phone: "0915 783 762",
      },
    ],
  },
  {
    name: "VIỆN SƯ PHẠM KỸ THUẬT",
    items: [
      {
        id: 51,
        department: "Ngành Sư phạm công nghệ",
        advisor: "Bùi Văn Hồng",
        phone: "0903 686 912",
      },
      {
        id: 52,
        department: "Ngành Tâm lý học giáo dục",
        advisor: "Dương Thị Kim Oanh",
        phone: "0982 967 064",
      },
    ],
  },
];

export function ContactModal({ trigger, open, setOpen }: ContactModalProps) {
  const [showFacultyAdvisors, setShowFacultyAdvisors] = useState(false);

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
              Hoạt động tư vấn hướng nghiệp và tuyển sinh đóng vai trò quan
              trọng trong việc hỗ trợ thí sinh hiểu rõ về quy trình tuyển sinh,
              các cơ hội học vụ và đưa ra lựa chọn phù hợp với năng lực và sở
              thích của thí sinh. Trường Đại học Sư phạm Kỹ thuật TP.HCM tự hào
              khi có một đội ngũ tư vấn viên tư vấn hướng nghiệp và tuyển sinh
              chuyên nghiệp:
            </p>
            <div className="flex flex-wrap gap-2">
              <p className="font-semibold">Tổng Đài:</p>
              <div className="text-primary font-medium">
                <a href="tel:02837225724" className="hover:underline">
                  028. 3722 5724
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
              <h3 className="text-lg font-bold mb-4">
                Danh sách các ngành đào tạo và Tư vấn chuyên ngành
              </h3>

              {!showFacultyAdvisors ? (
                <div className="flex justify-center pb-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowFacultyAdvisors(true)}
                    className="gap-2"
                  >
                    Xem chi tiết <ChevronDown className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-6 text-left">
                  {facultyAdvisors.map((faculty) => (
                    <div key={faculty.name} className="space-y-2">
                      <h4 className="font-semibold text-primary">
                        {faculty.name}
                      </h4>
                      <div className="border rounded-lg overflow-x-auto shadow-sm max-w-[calc(100vw-4rem)] sm:max-w-none">
                        <Table className="min-w-[700px]">
                          <TableHeader className="bg-muted">
                            <TableRow>
                              <TableHead className="w-[50px] text-center whitespace-nowrap">
                                TT
                              </TableHead>
                              <TableHead className="whitespace-nowrap">
                                Tên ngành
                              </TableHead>
                              <TableHead className="whitespace-nowrap">
                                Họ tên Tư vấn viên
                              </TableHead>
                              <TableHead className="whitespace-nowrap">
                                Số điện thoại
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {faculty.items.map((item) => (
                              <TableRow
                                key={item.id}
                                className="hover:bg-muted/50 transition-colors"
                              >
                                <TableCell className="text-center font-medium whitespace-nowrap">
                                  {item.id}
                                </TableCell>
                                <TableCell className="whitespace-nowrap">
                                  {item.department}
                                </TableCell>
                                <TableCell className="whitespace-nowrap">
                                  {item.advisor}
                                </TableCell>
                                <TableCell className="whitespace-nowrap">
                                  <a
                                    href={`tel:${item.phone.replace(
                                      /[^0-9]/g,
                                      ""
                                    )}`}
                                    className="text-primary hover:underline"
                                  >
                                    {item.phone}
                                  </a>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-center pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowFacultyAdvisors(false)}
                      className="gap-2"
                    >
                      Thu gọn <ChevronUp className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
