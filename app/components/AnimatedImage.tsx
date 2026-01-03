"use client";

import { useRef, useEffect, useState } from "react";

interface AnimatedImageProps {
  src: string;
  alt: string;
  className?: string;
  delay?: number;
}

export default function AnimatedImage({ src, alt, className = "", delay = 0 }: AnimatedImageProps) {
  const imgRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!imgRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={imgRef}
      className={`transform transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <img
        src={src}
        alt={alt}
        className="w-full h-64 object-cover rounded-lg shadow-lg transform hover:scale-105 transition duration-300"
      />
    </div>
  );
}
