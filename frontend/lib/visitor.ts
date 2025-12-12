 // utils/visitor.ts
import FingerprintJS from "@fingerprintjs/fingerprintjs";

class Visitor {
  private static visitorId: string | null = null;

  static get() {
    if (typeof window === "undefined") return null;
    return this.visitorId || localStorage.getItem("visitorId");
  }

  static async init() {
    if (typeof window === "undefined") return null;

    if (this.visitorId) return this.visitorId;

    const fp = await FingerprintJS.load();
    const result = await fp.get();

    this.visitorId = result.visitorId;
    localStorage.setItem("visitorId", result.visitorId);

    return result.visitorId;
  }
}

export default Visitor;
