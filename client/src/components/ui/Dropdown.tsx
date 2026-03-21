import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface DropdownItem {
  label: string;
  onClick: () => void;
  variant?: "default" | "danger";
  disabled?: boolean;
}

interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  disabled?: boolean;
}

/**
 * Smart dropdown that opens up or down based on available viewport space.
 * Renders via portal to avoid overflow:hidden clipping.
 */
export const Dropdown = ({ trigger, items, disabled = false }: DropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, openUp: false });
  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const DROPDOWN_HEIGHT = items.length * 40 + 8; // estimate: 40px per item + padding
  const MARGIN = 8; // gap between trigger and dropdown

  const calculatePosition = () => {
    if (!triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;
    const openUp = spaceBelow < DROPDOWN_HEIGHT && spaceAbove > spaceBelow;

    setPosition({
      top: openUp
        ? rect.top + window.scrollY - DROPDOWN_HEIGHT - MARGIN
        : rect.bottom + window.scrollY + MARGIN,
      left: rect.right + window.scrollX - 160, // align right edge, 160px wide
      openUp,
    });
  };

  const handleOpen = () => {
    if (disabled) return;
    calculatePosition();
    setIsOpen(true);
  };

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClick = (e: MouseEvent) => {
      if (
        dropdownRef.current?.contains(e.target as Node) ||
        triggerRef.current?.contains(e.target as Node)
      )
        return;
      setIsOpen(false);
    };

    const handleScroll = () => setIsOpen(false);
    const handleResize = () => setIsOpen(false);

    document.addEventListener("mousedown", handleClick);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleResize);

    return () => {
      document.removeEventListener("mousedown", handleClick);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleResize);
    };
  }, [isOpen]);

  return (
    <>
      <div ref={triggerRef} onClick={handleOpen} className="inline-flex">
        {trigger}
      </div>

      {isOpen
        ? createPortal(
            <div
              ref={dropdownRef}
              style={{
                position: "absolute",
                top: position.top,
                left: position.left,
                zIndex: 9999,
                width: 160,
              }}
              className={cn(
                "bg-bg-elevated border border-celery-700 rounded-lg shadow-xl py-1",
                "animate-in fade-in-0 zoom-in-95 duration-100",
              )}
            >
              {items.map((item, i) => (
                <button
                  key={i}
                  type="button"
                  disabled={item.disabled}
                  onClick={() => {
                    item.onClick();
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full text-left px-3 py-2 text-sm transition-colors",
                    "disabled:opacity-40 disabled:pointer-events-none",
                    item.variant === "danger"
                      ? "text-red-400 hover:bg-red-950 hover:text-red-300"
                      : "text-celery-300 hover:bg-celery-800 hover:text-celery-100",
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>,
            document.body,
          )
        : null}
    </>
  );
};
