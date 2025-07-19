"use client";
import { Brain, Calendar, CheckSquare, FileText, Mail } from "lucide-react";
import React, { useState, useEffect } from "react";

export default function LLMNode() {
  const [scrollY, setScrollY] = useState(0);
  const [windowDimensions, setWindowDimensions] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 1200,
    height: typeof window !== "undefined" ? window.innerHeight : 800,
  });

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    const handleResize = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const maxScroll = 800;
  const initialSize = 500;
  const finalSize = 300;

  const progress = Math.min(scrollY / maxScroll, 1);

  const currentSize = initialSize - (initialSize - finalSize) * progress;
  const smallNodeSize = Math.min(progress * 200, 200);

  const cornerOffset =
    smallNodeSize > 0 ? Math.min((progress - 0.5) * 200, 100) : 0;

  const connectionProgress = Math.max(0, Math.min((progress - 0.6) / 0.4, 1));
  const connectionOpacity = connectionProgress;
  const glowIntensity = progress >= 1 ? 1 : 0;

  const { width: windowWidth, height: windowHeight } = windowDimensions;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#353535" }}>
      <div
        className="fixed bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg transition-all duration-100 ease-out z-10"
        style={{
          width: `${currentSize}px`,
          height: `${currentSize}px`,
          fontSize: `${currentSize / 8}px`,
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      >
        {scrollY < 300 && (
          <div
            className="flex w-full h-full flex-col justify-center items-center text-center transition-all duration-300 ease-out"
            style={{
              opacity: 1 - scrollY / 400,
              transform: `scale(${1 - scrollY / 800})`,
            }}
          >
            <h3 className="text-[0.7em]">LLMs are Boring</h3>
            <p className="text-[0.5em]">{`We made them useful`}</p>
          </div>
        )}

        {scrollY >= 300 && (
          <Brain
            className="w-1/2 h-1/2 text-white relative z-10 drop-shadow-lg transition-all duration-500 ease-in"
            style={{
              opacity: Math.min((scrollY - 300) / 100, 1),
              transform: `scale(${Math.min((scrollY - 300) / 100, 1)})`,
            }}
          />
        )}
      </div>

      {/* Connections/Wires */}
      {connectionOpacity > 0 && smallNodeSize > 0 && (
        <svg
          className="fixed inset-0 pointer-events-none z-5"
          style={{ width: "100vw", height: "100vh" }}
        >
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Connection to top-left */}
          <path
            d={`M ${windowWidth / 2} ${windowHeight / 2} L ${
              cornerOffset + smallNodeSize / 2
            } ${cornerOffset + smallNodeSize / 2}`}
            stroke={glowIntensity > 0 ? "#3b82f6" : "#8b5cf6"}
            strokeWidth="4"
            fill="none"
            opacity={connectionOpacity}
            strokeDasharray={`${connectionProgress * 600} 1000`}
            filter={glowIntensity > 0 ? "url(#glow)" : "none"}
          />

          {/* Connection to top-right */}
          <path
            d={`M ${windowWidth / 2} ${windowHeight / 2} L ${
              windowWidth - cornerOffset - smallNodeSize / 2
            } ${cornerOffset + smallNodeSize / 2}`}
            stroke={glowIntensity > 0 ? "#3b82f6" : "#8b5cf6"}
            strokeWidth="4"
            fill="none"
            opacity={connectionOpacity}
            strokeDasharray={`${connectionProgress * 600} 1000`}
            filter={glowIntensity > 0 ? "url(#glow)" : "none"}
          />

          {/* Connection to bottom-left */}
          <path
            d={`M ${windowWidth / 2} ${windowHeight / 2} L ${
              cornerOffset + smallNodeSize / 2
            } ${windowHeight - cornerOffset - smallNodeSize / 2}`}
            stroke={glowIntensity > 0 ? "#3b82f6" : "#8b5cf6"}
            strokeWidth="4"
            fill="none"
            opacity={connectionOpacity}
            strokeDasharray={`${connectionProgress * 600} 1000`}
            filter={glowIntensity > 0 ? "url(#glow)" : "none"}
          />

          {/* Connection to bottom-right */}
          <path
            d={`M ${windowWidth / 2} ${windowHeight / 2} L ${
              windowWidth - cornerOffset - smallNodeSize / 2
            } ${windowHeight - cornerOffset - smallNodeSize / 2}`}
            stroke={glowIntensity > 0 ? "#3b82f6" : "#8b5cf6"}
            strokeWidth="4"
            fill="none"
            opacity={connectionOpacity}
            strokeDasharray={`${connectionProgress * 600} 1000`}
            filter={glowIntensity > 0 ? "url(#glow)" : "none"}
          />
        </svg>
      )}

      {/* Corner nodes */}
      {smallNodeSize > 0 && (
        <>
          {/* Top-left corner */}
          <div
            className="fixed bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg transition-all duration-200 ease-out z-10"
            style={{
              width: `${smallNodeSize}px`,
              height: `${smallNodeSize}px`,
              fontSize: `${smallNodeSize / 4}px`,
              top: `${cornerOffset}px`,
              left: `${cornerOffset}px`,
            }}
          >
            <Calendar className="w-1/2 h-1/2" />
          </div>

          {/* Top-right corner */}
          <div
            className="fixed bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg transition-all duration-200 ease-out z-10"
            style={{
              width: `${smallNodeSize}px`,
              height: `${smallNodeSize}px`,
              fontSize: `${smallNodeSize / 4}px`,
              top: `${cornerOffset}px`,
              right: `${cornerOffset}px`,
            }}
          >
            <FileText className="w-1/2 h-1/2" />
          </div>

          {/* Bottom-left corner */}
          <div
            className="fixed bg-gradient-to-br from-orange-500 to-yellow-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg transition-all duration-200 ease-out z-10"
            style={{
              width: `${smallNodeSize}px`,
              height: `${smallNodeSize}px`,
              fontSize: `${smallNodeSize / 4}px`,
              bottom: `${cornerOffset}px`,
              left: `${cornerOffset}px`,
            }}
          >
            <CheckSquare className="w-1/2 h-1/2" />
          </div>

          {/* Bottom-right corner */}
          <div
            className="fixed bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg transition-all duration-200 ease-out z-10"
            style={{
              width: `${smallNodeSize}px`,
              height: `${smallNodeSize}px`,
              fontSize: `${smallNodeSize / 4}px`,
              bottom: `${cornerOffset}px`,
              right: `${cornerOffset}px`,
            }}
          >
            <Mail className="w-1/2 h-1/2" />
          </div>
        </>
      )}

      {/* Content sections to demonstrate scrolling */}
      <div className="pt-screen">
        <div className="h-screen flex items-center justify-center">
          <div className="text-center p-8"></div>
        </div>

        <div
          className="h-screen flex items-center justify-center "
          style={{ backgroundColor: "#353535" }}
        >
          <div className="text-center p-8"></div>
        </div>
      </div>
    </div>
  );
}
