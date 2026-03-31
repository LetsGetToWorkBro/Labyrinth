import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Loader2, Eye, EyeOff, ArrowLeft } from "lucide-react";
import logoMazeGold from "@assets/maze-gold.png";

export default function LoginPage({ onBack }: { onBack?: () => void } = {}) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }
    setLoading(true);
    setError("");
    const result = await login(email, password);
    setLoading(false);
    if (!result.success) {
      setError(result.error || "Login failed");
    }
  };

  return (
    <div className="min-h-full flex flex-col items-center justify-center px-6" style={{ backgroundColor: "#0A0A0A" }}>
      {/* Logo */}
      <div className="mb-8 text-center flex flex-col items-center">
        <img src={logoMazeGold} alt="Labyrinth BJJ" style={{ width: 80, height: 80 }} />
        <h1 className="text-2xl font-bold" style={{ color: "#F0F0F0" }}>Labyrinth BJJ</h1>
        <p className="text-sm mt-1" style={{ color: "#666" }}>Member Portal</p>
      </div>

      {/* Login Form */}
      <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4">
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "#999" }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-colors"
            style={{
              backgroundColor: "#111",
              border: "1px solid #222",
              color: "#F0F0F0",
            }}
            data-testid="input-email"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "#999" }}>Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-colors pr-10"
              style={{
                backgroundColor: "#111",
                border: "1px solid #222",
                color: "#F0F0F0",
              }}
              data-testid="input-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: "#666" }}
              data-testid="button-toggle-password"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {error && (
          <div className="text-sm px-3 py-2 rounded-lg" style={{ backgroundColor: "rgba(224, 85, 85, 0.1)", color: "#E05555" }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-lg text-sm font-semibold transition-all active:scale-[0.98]"
          style={{
            backgroundColor: "#C8A24C",
            color: "#0A0A0A",
            opacity: loading ? 0.7 : 1,
          }}
          data-testid="button-login"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 size={16} className="animate-spin" />
              Signing in...
            </span>
          ) : (
            "Sign In"
          )}
        </button>
      </form>

      {/* Back / Guest access */}
      {onBack ? (
        <button
          onClick={onBack}
          className="mt-6 flex items-center gap-1 text-xs"
          style={{ color: "#666" }}
          data-testid="button-back-from-login"
        >
          <ArrowLeft size={14} />
          Back to app
        </button>
      ) : (
        <p className="mt-8 text-xs text-center" style={{ color: "#666" }}>
          Don't have an account? Contact the front desk.
        </p>
      )}
    </div>
  );
}
