const paths = {
  exit: "M9 4H4v16h5 M13 8l4 4-4 4 M8 12h13",
  qr: "M3 3h6v6H3z M15 3h6v6h-6z M3 15h6v6H3z M15 15h3v3h3v3h-6v-3 M21 12v3 M12 3v3 M12 9v3h3 M3 12h3 M9 12h3v9",
  keyboard:
    "M3 5h18v14H3z M6 9h.01 M10 9h.01 M14 9h.01 M18 9h.01 M6 12h.01 M10 12h.01 M14 12h.01 M18 12h.01 M8 16h8",
  schedule: "M12 8v5l3 2 M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18",
  shop: "M5 8h14l1 13H4z M9 8V6a3 3 0 0 1 6 0v2 M9 14h6 M12 11v6",
  pickup: "M5 4h14v17H5z M9 2v4 M15 2v4 M5 9h14 M9 14h6 M12 11v6",
  expand: "M8 3H3v5 M16 3h5v5 M3 16v5h5 M21 16v5h-5",
  arrow: "M4 12h16 M14 6l6 6-6 6",
  plus: "M12 5v14 M5 12h14",
} as const;
export function Icon({ name }: { name: keyof typeof paths }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}
