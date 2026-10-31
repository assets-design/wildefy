"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Old /lander URL — redirects to the main homepage. */
export default function LanderRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/");
  }, [router]);

  return null;
}
