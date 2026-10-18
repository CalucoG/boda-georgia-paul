"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { WEDDING_CONFIG } from "../lib/config";

function unlocked() {
  return Date.now() >= new Date(WEDDING_CONFIG.photoUnlockISO).getTime();
}

export default function PhotoAccessButton({ className = "heroBtnPrimary", children = "Subir una foto" }) {
  const [isUnlocked, setIsUnlocked] = useState(unlocked());
  useEffect(() => {
    if (isUnlocked) return;
    const timer = setInterval(() => setIsUnlocked(unlocked()), 1000);
    return () => clearInterval(timer);
  }, [isUnlocked]);

  if (isUnlocked) return <Link className={className} href="/fotos">{children}</Link>;
  return <button className={`${className} photoLockedButton`} type="button" disabled aria-disabled="true">{children}</button>;
}
