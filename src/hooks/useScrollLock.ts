"use client";

import { useEffect } from "react";
import { lenisInstance } from "@/lib/lenisInstance";

export function useScrollLock(locked: boolean) {
  useEffect(() => {
    if (typeof document === "undefined") return;

    if (locked) {
      document.body.classList.add("no-scroll");
      lenisInstance.current?.stop();
    } else {
      document.body.classList.remove("no-scroll");
      lenisInstance.current?.start();
    }

    return () => {
      document.body.classList.remove("no-scroll");
      lenisInstance.current?.start();
    };
  }, [locked]);
}
