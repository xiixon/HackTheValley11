import { memo, useEffect, useState } from "react";

// Same size, spacing, colour and stable random placement as the phone background.
export const PillPattern = memo(function PillPattern() {
  const [seed] = useState(() => Math.random() * 10000);
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  useEffect(() => {
    const resize = () =>
      setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);
  const columns = Math.ceil(size.width / 88) + 1;
  const rows = Math.ceil(size.height / 88) + 1;
  const random = (row: number, column: number, variation: number) => {
    const value =
      Math.sin(row * 127.1 + column * 311.7 + variation * 74.7 + seed) *
      43758.5453;
    return value - Math.floor(value);
  };
  return (
    <div className="pill-pattern" aria-hidden="true">
      {Array.from({ length: rows * columns }, (_, index) => {
        const row = Math.floor(index / columns);
        const column = index % columns;
        return (
          <i
            key={`${row}-${column}`}
            style={{
              left: column * 88 - 12 + random(row, column, 0) * 56,
              top: row * 88 - 12 + random(row, column, 1) * 56,
              opacity: 0.65 + random(row, column, 2) * 0.35,
              transform: `rotate(${random(row, column, 3) * 360}deg) scale(${0.8 + random(row, column, 4) * 0.3})`,
            }}
          />
        );
      })}
    </div>
  );
});
