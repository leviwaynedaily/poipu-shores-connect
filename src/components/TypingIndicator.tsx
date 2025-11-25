import { useEffect, useState } from "react";

export const TypingIndicator = () => {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 400);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-start gap-2 mb-4">
      <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-2 max-w-[80%]">
        <div className="flex items-center gap-2 text-muted-foreground">
          <span className="text-sm">🐔 Chickens are plucking{dots}</span>
        </div>
      </div>
    </div>
  );
};
