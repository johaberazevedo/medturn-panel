"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let registered = false;

export function registerVitrineGsap() {
  if (registered) return { gsap, ScrollTrigger };

  gsap.registerPlugin(useGSAP, ScrollTrigger);
  registered = true;

  return { gsap, ScrollTrigger };
}

export { gsap, ScrollTrigger, useGSAP };
