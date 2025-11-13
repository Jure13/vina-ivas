"use client";

import { useEffect, useRef, ReactNode } from "react";

interface AnimatedCardProps {
  children: ReactNode;
  delay?: number; // milliseconds for staggered appearance
  onClick?: () => void;
}

export default function AnimatedCard({ children, delay = 0, onClick }: AnimatedCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cardRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && cardRef.current) {
          setTimeout(() => {
            cardRef.current!.classList.remove("opacity-0", "translate-y-4", "scale-95");
            cardRef.current!.classList.add("opacity-100", "translate-y-0", "scale-100");
          }, delay);
          observer.unobserve(cardRef.current);
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(cardRef.current);

    return () => {
      if (cardRef.current) observer.unobserve(cardRef.current);
    };
  }, [delay]);

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      className="bg-white rounded-lg p-4 shadow-md opacity-0 scale-95 translate-y-4 transform transition-all duration-700 hover:scale-105 hover:shadow-xl cursor-pointer"
    >
      {children}
    </div>
  );
}