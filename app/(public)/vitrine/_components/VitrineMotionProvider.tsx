"use client";

import { useEffect } from "react";
import { registerVitrineGsap } from "../_lib/gsap";

type VitrineMotionProviderProps = {
  children: React.ReactNode;
};

export default function VitrineMotionProvider({
  children,
}: VitrineMotionProviderProps) {
  useEffect(() => {
    const { ScrollTrigger } = registerVitrineGsap();
    ScrollTrigger.refresh();
  }, []);

  return children;
}
