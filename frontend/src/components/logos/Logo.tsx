// src/components/Logo.tsx
import React from "react";
import { Link } from "react-router-dom";
import { businessInfo } from "../../config/businessInfo";

interface LogoProps {
  // Allows you to add custom classes to style the container (e.g., margins, alignment)
  className?: string;
  // Controls if the logo is clickable and links home. Defaults to true.
  isLink?: boolean;
}

const Logo: React.FC<LogoProps> = ({ className = "", isLink = true }) => {
  // 1. The core content of the logo (icon + text)
  const content = (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Emerald Icon Box */}
      <div className="w-8 h-8 bg-emerald-500 rounded grid grid-cols-2 gap-0.5 p-1 shrink-0">
        <div className="bg-white rounded-sm"></div>
        <div className="bg-white rounded-sm"></div>
        <div className="bg-white rounded-sm"></div>
        <div className="bg-emerald-700 rounded-sm"></div>
      </div>

      {/* Brand Text */}
      <div>
        <h1 className="text-xl font-bold leading-none tracking-tight text-gray-900">
          {businessInfo.name}
        </h1>
        <p className="text-xs text-gray-500 font-medium mt-0.5">
          Powered by Oni
        </p>
      </div>
    </div>
  );

  // 2. If isLink is true, wrap the content in a Link to home ('/')
  if (isLink) {
    return (
      <Link to="/" className="hover:opacity-80 transition-opacity block">
        {content}
      </Link>
    );
  }

  // 3. Otherwise, just show the content
  return content;
};

export default Logo;
