import React, { Children } from "react";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "./LoadingSpinner";

export function AnimatedButton({
  children,
  onClick,
  variant = "default",
  size = "default",
  className = "",
  loading = false,
  disabled = false,
  type = "button",
  ...props
}) {
  return (
    <Button
      type={type}
      variant={variant}
      size={size}
      className={`btn-hover-effect relative ${className}`}
      onClick={onClick}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <LoadingSpinner size="sm" />
        </span>
      )}
      <span className={loading ? "opacity-0" : ""}>{children}</span>
    </Button>
  );
}

export function IconButton({
  icon,
  onClick,
  variant = "ghost",
  size = "icon",
  className = "",
  ...props
}) {
  return (
    <Button
      variant={variant}
      size={size}
      className={`scale-on-hover ${className}`}
      onClick={onClick}
      {...props}
    >
      {icon}
    </Button>
  );
}

export function BounceButton({ children, onClick, className = "", ...props }) {
  const handleClick = (e) => {
    // Add bounce animation class
    e.currentTarget.classList.add("bounce");

    // Remove the class after animation completes
    setTimeout(() => {
      e.currentTarget.classList.remove("bounce");
    }, 500);

    if (onClick) onClick(e);
  };

  return (
    <Button
      className={`relative overflow-hidden ${className}`}
      onClick={handleClick}
      {...props}
    >
      {children}
    </Button>
  );
}
