import Visitor from "@/lib/visitor";
import { useEffect, useState } from "react";

export default function useVisitorId() {
  const [visitorId, setVisitorId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
        const id = Visitor.get() || (await Visitor.init());
      if (mounted) setVisitorId(id);
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  return visitorId;
}
