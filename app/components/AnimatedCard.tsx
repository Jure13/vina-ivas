"use client";

import { useEffect, useRef, ReactNode } from "react";

interface AnimatedCardProps {
  children: ReactNode;
  delay?: number;
  onClick?: () => void;
}

export default function AnimatedCard({ children, delay = 0, onClick }: AnimatedCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const currentCard = cardRef.current;
    if (!currentCard) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && currentCard) {
          setTimeout(() => {
            currentCard.classList.remove("opacity-0", "translate-y-4", "scale-95");
            currentCard.classList.add("opacity-100", "translate-y-0", "scale-100");
          }, delay);
          observer.unobserve(currentCard);
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(currentCard);

    return () => {
      if (currentCard) observer.unobserve(currentCard);
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