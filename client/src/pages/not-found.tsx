import { useEffect } from "react";
import { ErrorState } from "@/components/StateComponents";

export default function NotFound() {
  useEffect(() => {
    const t = setTimeout(() => { window.location.hash = '/'; }, 3000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{
      minHeight: "100dvh", width: "100%",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      backgroundColor: "#0A0A0A", padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <ErrorState
          heading="Page not found"
          message="This page doesn't exist. You'll be redirected home in a moment."
          homeHref="/#/"
          retryLabel="Go Home Now"
          onRetry={() => { window.location.hash = '/'; }}
        />
        <p style={{ textAlign: 'center', fontSize: 11, color: '#333', marginTop: 16 }}>Redirecting in 3s…</p>
      </div>
    </div>
  );
}
