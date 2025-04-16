"use client";
import React, {
  Children,
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useRef,
  useState,
  useMemo,
} from "react";
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";

import { cn } from "@/lib/utils";

// Create the mouse context used by the dock
const MousePositionContext = createContext({ mouseX: 0 });

export function Dock({
  className,
  children,
  iconSize = 40,
  iconMagnification = 60,
  iconDistance = 140,
  direction = "middle",
  ...props
}) {
  // Track both mouse and touch positions
  const [mouseX, setMouseX] = useState(null);
  const containerRef = useRef(null);

  // Handle mouse movement over the dock
  function handleMouseMove(event) {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    // Get mouse X position relative to container
    const x = event.clientX - rect.left;
    setMouseX(x);
  }

  // Reset mouse position when leaving the dock
  function handleMouseLeave() {
    setMouseX(null);
  }

  // Distribute the items in the dock based on direction prop
  const value = useMemo(
    () => ({ mouseX, iconSize, iconMagnification, iconDistance, direction }),
    [mouseX, iconSize, iconMagnification, iconDistance, direction],
  );

  // Clone children to pass the MousePositionContext to them
  const items = Children.map(children, (child) => {
    if (!isValidElement(child)) return null;

    // Pass all dock context values to the icon
    if (child.type.displayName === "DockIcon") {
      return cloneElement(child, {
        mouseX: mouseX,
        size: iconSize,
        magnification: iconMagnification,
        distance: iconDistance,
      });
    }

    // Otherwise, just pass the child through
    return child;
  });

  return (
    <MousePositionContext.Provider value={value}>
      <motion.div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onTouchMove={handleMouseMove}
        onTouchEnd={handleMouseLeave}
        className={cn(
          "flex h-16 items-end justify-center gap-4 rounded-xl bg-background/80 px-4 pb-2 backdrop-blur",
          className,
        )}
        {...props}
      >
        {items}
      </motion.div>
    </MousePositionContext.Provider>
  );
}

export function DockIcon({
  size = 40,
  magnification = 60,
  distance = 140,
  mouseX,
  className,
  children,
  ...props
}) {
  // Create a reference to the icon element
  const ref = useRef(null);

  // Get the mouse context from the parent Dock
  const context = useContext(MousePositionContext);
  const { direction } = context;

  // Use context values if props aren't explicitly provided
  mouseX = mouseX ?? context.mouseX;
  size = size ?? context.iconSize;
  magnification = magnification ?? context.iconMagnification;
  distance = distance ?? context.iconDistance;

  // Icon position values
  const [, setIconCenterX] = useState(0);

  // Update icon center position
  const updateIconCenter = () => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setIconCenterX(rect.left + rect.width / 2);
  };

  // Spring animation for smooth movement
  React.useEffect(() => {
    updateIconCenter();
    window.addEventListener("resize", updateIconCenter);
    return () => window.removeEventListener("resize", updateIconCenter);
  }, []);

  // Calculate distance between mouse and icon center
  const distanceFromMouseToCenter = useMotionValue(0);
  React.useEffect(() => {
    if (mouseX !== null) {
      const rect = ref.current?.getBoundingClientRect();
      if (!rect) return;
      // Calculate the new distance based on icon center position
      const newDistance =
        mouseX - (rect.left - rect.width / 2 + rect.width / 2);
      distanceFromMouseToCenter.set(newDistance);
    }
  }, [mouseX, distanceFromMouseToCenter]);

  // Calculate width based on distance
  const widthSync = useTransform(distanceFromMouseToCenter, (val) => {
    if (mouseX === null) return size;
    // Distance falloff function
    const distanceFalloff = Math.abs(val) / distance;
    let newWidth =
      size + (magnification - size) * (1 - Math.min(1, distanceFalloff));

    // Handle different directions
    if (direction === "left") {
      newWidth = val > 0 ? size : newWidth;
    } else if (direction === "right") {
      newWidth = val < 0 ? size : newWidth;
    }

    return newWidth;
  });

  // Add spring physics for smooth animation
  const width = useSpring(widthSync, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  return (
    <motion.div
      ref={ref}
      style={{ width }}
      className={cn("flex items-center justify-center", className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}

DockIcon.displayName = "DockIcon";
