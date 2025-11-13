"use client";

import { useEffect, useRef, ReactNode, forwardRef } from "react";

interface AnimatedSectionTitleProps {
  children: ReactNode;
}

// Forward ref so parent can access it if needed
const AnimatedSectionTitle = forwardRef<HTMLHeadingElement, AnimatedSectionTitleProps>(
  ({ children }, ref) => {
    const titleRef = useRef<HTMLHeadingElement>(null);

    useEffect(() => {
      const current = titleRef.current;
      if (!current) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && current) {
            current.classList.remove("opacity-0", "translate-y-4");
            current.classList.add("opacity-100", "translate-y-0");
            observer.disconnect();
          }
        },
        { threshold: 0.2 }
      );

      observer.observe(current);

      return () => observer.disconnect();
    }, []);

    return (
      <h2
        ref={ref || titleRef}
        className="text-3xl md:text-4xl font-bold mb-8 opacity-0 transform translate-y-4 transition-all duration-700 text-center"
      >
        {children}
      </h2>
    );
  }
);

AnimatedSectionTitle.displayName = "AnimatedSectionTitle";

export default AnimatedSectionTitle;