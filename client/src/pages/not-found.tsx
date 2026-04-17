import { useEffect } from "react";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  // Auto-redirect home after 2.5s to recover from stray hash navigations
  useEffect(() => {
    const t = setTimeout(() => { window.location.hash = '/'; }, 2500);
    return () => clearTimeout(t);
  }, []);

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
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <p style={{ fontSize: 12, color: "#444", margin: 0 }}>Redirecting home...</p>
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
        Go Home Now
      </a>
    </div>
  );
}
