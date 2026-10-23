"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

// The intro pulls in framer-motion and a large SVG scene, so it loads only for visitors who will actually see it.
const Intro = dynamic(() => import("./intro").then((m) => m.Intro), { ssr: false });

export function IntroGate() {
  const [on, setOn] = useState(false);
  useEffect(() => setOn(document.documentElement.hasAttribute("data-intro")), []);
  return on ? <Intro /> : null;
}
