import { useState, useEffect } from "react";

export const useScrolled = (threshold = 20, resetAt = 10) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      setIsScrolled((prev) => {
        if (!prev && offset > threshold) return true;
        if (prev && offset < resetAt) return false;
        return prev;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [threshold, resetAt]);

  return isScrolled;
};