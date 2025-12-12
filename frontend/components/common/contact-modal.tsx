import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import Link from "next/link";
import React from "react";

interface ContactModalProps {
  trigger: React.ReactNode;
}

export function ContactModal({ trigger }: ContactModalProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="w-full max-h-[90vh] overflow-y-auto">
        DEMO
      </DialogContent>
    </Dialog>
  );
}
