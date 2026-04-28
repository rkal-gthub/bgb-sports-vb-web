"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NewSchedulePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/sessions/book");
  }, [router]);

  return <p className="text-gray-800">Redirecting to Book Session...</p>;
}
