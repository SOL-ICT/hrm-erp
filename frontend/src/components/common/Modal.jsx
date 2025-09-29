// src/components/common/Modal.jsx
import React, { useEffect } from "react";

export default function Modal({ children, onClose }) {
  // Close on Escape
  useEffect(() => {
    const handleKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
      onClick={onClose}        // click backdrop to close
    >
      <div
        className="bg-white rounded-xl p-6 max-w-lg w-full mx-4"
        onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
      >
        {children}
      </div>
    </div>
  );
}
