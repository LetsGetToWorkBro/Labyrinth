import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div style={{
      minHeight: "100dvh",
      width: "100%",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#0A0A0A",
      padding: 24,
      gap: 16,
    }}>
      <AlertCircle size={40} style={{ color: "#E05555" }} />
      <h1 style={{ fontSize: 24, fontWeight: 700, color: "#F0F0F0", margin: 0 }}>404 Page Not Found</h1>
      <p style={{ fontSize: 14, color: "#666", margin: 0 }}>
        The page you're looking for doesn't exist.
      </p>
      <a
        href="/#/"
        style={{
          marginTop: 8,
          padding: "12px 28px",
          borderRadius: 12,
          backgroundColor: "#C8A24C",
          color: "#0A0A0A",
          fontWeight: 700,
          fontSize: 15,
          textDecoration: "none",
        }}
      >
        Go Home
      </a>
    </div>
  );
}
