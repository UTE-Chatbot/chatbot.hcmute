import { Spinner } from "@/components/ui/shadcn-io/spinner";
import React from "react";
import { cn } from "@/lib/utils";

const Loader = ({
  className,
  spinnerClassName,
}: {
  className?: string;
  spinnerClassName?: string;
}) => {
  return (
    <div
      className={cn(
        "flex h-screen w-full items-center justify-center",
        className
      )}
    >
      <Spinner
        variant="ellipsis"
        className={cn("h-24 w-24 text-primary", spinnerClassName)}
      />
    </div>
  );
};

export default Loader;
