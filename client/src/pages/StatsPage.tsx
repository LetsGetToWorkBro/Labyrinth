import { useState, useEffect, useMemo, useRef } from "react";
import { ScreenHeader } from "@/components/ScreenHeader";
import { BeltBadge } from "@/components/BeltBadge";
import { ListSkeleton, StatSkeleton } from "@/components/LoadingSkeleton";
import { fetchCSV, parseCSV, CSV_ENDPOINTS } from "@/lib/api";
import type { Athlete, AcademyConfig } from "@/lib/api";
import { getTierColor } from "@/lib/constants";
import { Search, ExternalLink, Trophy, Target, Swords, Award, TrendingUp, Filter } from "lucide-react";

function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let start = 0;
    const duration = 1200;
    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

export default function StatsPage() {
  const [config, setConfig] = useState<Record<string, string>>({});
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterBelt, setFilterBelt] = useState("all");
  const [filterTier, setFilterTier] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [configCSV, athletesCSV] = await Promise.all([
        fetchCSV(CSV_ENDPOINTS.config),
        fetchCSV(CSV_ENDPOINTS.athletes),
      ]);

      const configRows = parseCSV<any>(configCSV);
      const configMap: Record<string, string> = {};
      configRows.forEach((r: any) => {
        const key = r.Key || r.key;
        const val = r.Value || r.value;
        if (key) configMap[key] = val;
      });
      setConfig(configMap);

      // CSV headers don't match actual data positions, so parse by index
      // Actual: Name, Slug, Wins, Losses, WinRate, Rating, Belt, Tier, Golds, (empty cols)
      const athleteLines = athletesCSV.trim().split("\n").slice(1); // skip header
      const parsed: Athlete[] = athleteLines.map((line: string) => {
        const cols: string[] = [];
        let current = "";
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const ch = line[i];
          if (ch === '"') { inQuotes = !inQuotes; }
          else if (ch === ',' && !inQuotes) { cols.push(current.trim()); current = ""; }
          else { current += ch; }
        }
        cols.push(current.trim());
        return {
          name: cols[0] || "",
          slug: cols[1] || "",
          wins: parseInt(cols[2]) || 0,
          losses: parseInt(cols[3]) || 0,
          winRate: parseFloat(cols[4]) || 0,
          rating: parseFloat(cols[5]) || 0,
          belt: cols[6] || "",
          tier: cols[7] || "",
          golds: parseInt(cols[8]) || 0,
          subRate: 0,
          profileUrl: cols[1] ? `https://jits.gg/athlete/${cols[1]}` : "",
          lastUpdated: "",
        };
      }).filter(a => a.name);
      setAthletes(parsed);
    } catch (err) {
      console.error("Failed to load stats:", err);
    }
    setLoading(false);
  }

  const filteredAthletes = useMemo(() => {
    return athletes.filter(a => {
      if (search && !a.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterBelt !== "all" && a.belt.toLowerCase() !== filterBelt) return false;
      if (filterTier !== "all" && a.tier !== filterTier) return false;
      return true;
    }).sort((a, b) => b.rating - a.rating);
  }, [athletes, search, filterBelt, filterTier]);

  const uniqueBelts = useMemo(() => [...new Set(athletes.map(a => a.belt.toLowerCase()).filter(Boolean))], [athletes]);
  const uniqueTiers = useMemo(() => [...new Set(athletes.map(a => a.tier).filter(Boolean))], [athletes]);

  if (loading) {
    return (
      <div className="app-content">
        <ScreenHeader title="Academy Stats" />
        <div className="px-5 flex gap-3 mb-4"><StatSkeleton /><StatSkeleton /><StatSkeleton /></div>
        <ListSkeleton count={5} />
      </div>
    );
  }

  const natRank = config["National Rank"] || config["national_rank"] || "—";
  const stateRank = config["State Rank"] || config["state_rank"] || "—";
  const golds = parseInt(config["Gold Medals"] || config["gold_medals"] || "0");
  const totalWins = parseInt(config["Total Wins"] || config["total_wins"] || "0");
  const totalMatches = parseInt(config["Total Matches"] || config["total_matches"] || "0");
  const subRate = (config["Submission Rate"] || config["submission_rate"] || "—") + "%";
  const activeComp = config["Active Competitors"] || config["active_competitors"] || "—";

  return (
    <div className="app-content">
      <ScreenHeader title="Academy Stats" subtitle="Powered by jits.gg" />

      {/* Hero Stats */}
      <div className="px-5 mb-4">
        <div className="grid grid-cols-2 gap-3 mb-3">
          <StatCard icon={<Trophy size={16} />} value={`#${natRank}`} label="National Rank" color="#C8A24C" />
          <StatCard icon={<Award size={16} />} value={`#${stateRank}`} label="State Rank (TX)" color="#C8A24C" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <MiniStat value={golds} label="Gold Medals" animated />
          <MiniStat value={totalWins} label="Total Wins" animated />
          <MiniStat value={subRate} label="Sub Rate" />
        </div>
      </div>

      {/* Search + Filter */}
      <div className="px-5 mb-3">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#666" }} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search athletes..."
              className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm outline-none"
              style={{ backgroundColor: "#111", border: "1px solid #222", color: "#F0F0F0" }}
              data-testid="input-search-athletes"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-3 rounded-lg transition-colors"
            style={{ backgroundColor: showFilters ? "rgba(200, 162, 76, 0.1)" : "#111", border: "1px solid #222", color: showFilters ? "#C8A24C" : "#666" }}
            data-testid="button-toggle-filters"
          >
            <Filter size={16} />
          </button>
        </div>

        {showFilters && (
          <div className="flex gap-2 mt-2 flex-wrap">
            <FilterPill label="All Belts" active={filterBelt === "all"} onClick={() => setFilterBelt("all")} />
            {uniqueBelts.map(b => (
              <FilterPill key={b} label={b} active={filterBelt === b} onClick={() => setFilterBelt(b)} />
            ))}
            <div className="w-full h-0" />
            <FilterPill label="All Tiers" active={filterTier === "all"} onClick={() => setFilterTier("all")} />
            {uniqueTiers.map(t => (
              <FilterPill key={t} label={t} active={filterTier === t} onClick={() => setFilterTier(t)} color={getTierColor(t)} />
            ))}
          </div>
        )}
      </div>

      {/* Athletes List */}
      <div className="px-5 pb-6">
        <p className="text-xs mb-3" style={{ color: "#666" }}>{filteredAthletes.length} athletes</p>
        <div className="space-y-2">
          {filteredAthletes.map((a, i) => (
            <button
              key={i}
              onClick={() => a.profileUrl && window.open(a.profileUrl, "_blank")}
              className="w-full text-left p-3 rounded-xl transition-all active:scale-[0.98]"
              style={{ backgroundColor: "#111", border: "1px solid #1A1A1A" }}
              data-testid={`athlete-card-${i}`}
            >
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold truncate" style={{ color: "#F0F0F0" }}>{a.name}</span>
                    <BeltBadge belt={a.belt} />
                    {a.tier && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{
                        backgroundColor: `${getTierColor(a.tier)}20`,
                        color: getTierColor(a.tier),
                      }}>
                        {a.tier}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs" style={{ color: "#999" }}>
                    <span>{a.wins}W - {a.losses}L</span>
                    <span>{a.winRate}% Win</span>
                    {a.golds > 0 && <span style={{ color: "#C8A24C" }}>{a.golds} 🥇</span>}
                    {a.rating > 0 && <span>⭐ {a.rating.toLocaleString()}</span>}
                  </div>
                </div>
                {a.profileUrl && <ExternalLink size={14} style={{ color: "#444", flexShrink: 0 }} />}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, value, label, color }: { icon: React.ReactNode; value: string; label: string; color: string }) {
  return (
    <div className="p-4 rounded-xl" style={{ backgroundColor: "#111", border: "1px solid #1A1A1A" }}>
      <div className="flex items-center gap-2 mb-2">
        <span style={{ color }}>{icon}</span>
        <span className="text-xs font-medium" style={{ color: "#666" }}>{label}</span>
      </div>
      <p className="text-2xl font-bold count-up" style={{ color }}>{value}</p>
    </div>
  );
}

function MiniStat({ value, label, animated }: { value: number | string; label: string; animated?: boolean }) {
  return (
    <div className="p-3 rounded-xl text-center" style={{ backgroundColor: "#111", border: "1px solid #1A1A1A" }}>
      <p className="text-lg font-bold" style={{ color: "#F0F0F0" }}>
        {animated && typeof value === "number" ? <AnimatedCounter target={value} /> : String(value)}
      </p>
      <p className="text-[10px] mt-0.5" style={{ color: "#666" }}>{label}</p>
    </div>
  );
}

function FilterPill({ label, active, onClick, color }: { label: string; active: boolean; onClick: () => void; color?: string }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1 rounded-full text-xs font-medium transition-colors capitalize"
      style={{
        backgroundColor: active ? (color ? `${color}20` : "rgba(200, 162, 76, 0.1)") : "#1A1A1A",
        color: active ? (color || "#C8A24C") : "#666",
        border: `1px solid ${active ? (color ? `${color}40` : "rgba(200, 162, 76, 0.2)") : "#222"}`,
      }}
    >
      {label}
    </button>
  );
}
