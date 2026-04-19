export function Avatar({ name, size = 30 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: `hsl(${((name || "?").charCodeAt(0) * 7) % 360},55%,45%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.38,
        fontWeight: 700,
        color: "#fff",
        flexShrink: 0,
      }}
    >
      {(name || "?")[0]}
    </div>
  );
}
