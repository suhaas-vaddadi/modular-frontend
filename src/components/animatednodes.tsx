import { useState, useEffect, useRef } from "react";

export default function ScrollLeftElement() {
  const [isVisible, setIsVisible] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [originalOffsetTop, setOriginalOffsetTop] = useState(0);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (elementRef.current) {
      setOriginalOffsetTop(elementRef.current.offsetTop);
      observer.observe(elementRef.current);
    }

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      observer.disconnect();
    };
  }, []);

  const leftOffset = isVisible
    ? Math.min((scrollY - originalOffsetTop - 200) * 0.4, 400)
    : 0;

  const fixedPosition = (scrollY - originalOffsetTop - 200) * 0.4 >= 400;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50">
      {/* Spacer content to enable scrolling */}

      {/* The moving element */}
      <div className="h-screen flex items-center justify-center relative overflow-hidden">
        <div
          ref={elementRef}
          className={`w-32 h-32 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-lg transition-transform duration-300 ease-out flex items-center justify-center text-white font-bold text-xl ${
            fixedPosition ? "fixed top-1/2 -translate-y-1/2" : ""
          }`}
          style={{
            transform: fixedPosition
              ? `translateX(-400px)`
              : `translateX(-${leftOffset}px)`,
          }}
        >
          Moving!
        </div>
      </div>
      <div className="flex h-96" />
      <div className="flex h-96" />
      <div className="flex h-96" />

      {/* More content to continue scrolling */}
    </div>
  );
}
