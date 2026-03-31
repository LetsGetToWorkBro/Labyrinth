import { useState, useMemo } from "react";
import { ScreenHeader } from "@/components/ScreenHeader";
import { CLASS_SCHEDULE, CLASS_TYPE_COLORS, DAYS_ORDER } from "@/lib/constants";
import type { ClassScheduleItem } from "@/lib/constants";
import { bookTrialClass } from "@/lib/api";
import { CheckCircle, ArrowLeft, ArrowRight, Loader2 } from "lucide-react";

type Step = "category" | "class" | "details" | "confirm";

export default function BookingPage() {
  const [step, setStep] = useState<Step>("category");
  const [category, setCategory] = useState<"adult" | "kids">("adult");
  const [selectedClass, setSelectedClass] = useState<ClassScheduleItem | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [booked, setBooked] = useState(false);
  const [error, setError] = useState("");

  // Get next available dates for a given day
  function getNextDates(dayName: string, count: number = 4): string[] {
    const dates: string[] = [];
    const now = new Date();
    const dayIndex = DAYS_ORDER.indexOf(dayName);
    const currentDay = now.getDay() === 0 ? 6 : now.getDay() - 1; // Convert to Mon=0

    let daysUntil = dayIndex - currentDay;
    if (daysUntil <= 0) daysUntil += 7;

    for (let i = 0; i < count; i++) {
      const date = new Date(now);
      date.setDate(now.getDate() + daysUntil + (i * 7));
      dates.push(date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }));
    }
    return dates;
  }

  const classesForCategory = useMemo(() => {
    const seen = new Set<string>();
    return CLASS_SCHEDULE.filter(c => {
      if (c.category !== category) return false;
      const key = `${c.day}-${c.time}-${c.name}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [category]);

  const handleBook = async () => {
    if (!selectedClass || !selectedDate || !name || !email || !phone) {
      setError("Please fill in all fields");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const typeLabel = CLASS_TYPE_COLORS[selectedClass.type]?.label || "";
      await bookTrialClass({
        name,
        email,
        phone,
        className: `${selectedClass.name} — ${typeLabel}`,
        classDay: selectedClass.day,
        classTime: selectedClass.time,
        classDate: selectedDate,
      });
      setBooked(true);
    } catch (err: any) {
      setError(err.message || "Booking failed. Please try again.");
    }
    setLoading(false);
  };

  if (booked) {
    return (
      <div className="app-content flex flex-col items-center justify-center px-6 text-center" style={{ minHeight: "70vh" }}>
        <CheckCircle size={64} style={{ color: "#4CAF80", marginBottom: 16 }} />
        <h2 className="text-xl font-bold mb-2" style={{ color: "#F0F0F0" }}>You're Booked</h2>
        <p className="text-sm mb-1" style={{ color: "#999" }}>
          {selectedClass?.name} — {selectedClass?.day} at {selectedClass?.time}
        </p>
        <p className="text-sm mb-6" style={{ color: "#999" }}>{selectedDate}</p>

        <div className="w-full p-4 rounded-xl mb-6 text-left" style={{ backgroundColor: "#111", border: "1px solid #1A1A1A" }}>
          <h3 className="text-sm font-semibold mb-2" style={{ color: "#F0F0F0" }}>What to Bring</h3>
          <ul className="text-xs space-y-1.5" style={{ color: "#999" }}>
            <li>• Comfortable athletic clothing (no zippers or pockets)</li>
            <li>• Water bottle</li>
            <li>• Gi (if trying a Gi class — we have loaners available)</li>
            <li>• Positive attitude</li>
          </ul>
        </div>

        <p className="text-xs mb-4" style={{ color: "#666" }}>
          A confirmation has been sent to {email}
        </p>

        <a
          href="/#/"
          className="px-6 py-3 rounded-xl text-sm font-semibold transition-all"
          style={{ backgroundColor: "#C8A24C", color: "#0A0A0A" }}
        >
          Back to Home
        </a>
      </div>
    );
  }

  return (
    <div className="app-content">
      <ScreenHeader
        title="Book a Trial"
        right={
          step !== "category" ? (
            <button
              onClick={() => {
                if (step === "class") setStep("category");
                else if (step === "details") setStep("class");
                else if (step === "confirm") setStep("details");
              }}
              className="p-2 rounded-lg"
              style={{ color: "#666" }}
              data-testid="button-back"
            >
              <ArrowLeft size={18} />
            </button>
          ) : (
            <a href="/#/" className="p-2 rounded-lg" style={{ color: "#666" }}>
              <ArrowLeft size={18} />
            </a>
          )
        }
      />

      {/* Progress */}
      <div className="px-5 mb-4">
        <div className="flex gap-1">
          {["category", "class", "details", "confirm"].map((s, i) => (
            <div
              key={s}
              className="flex-1 h-1 rounded-full"
              style={{
                backgroundColor: ["category", "class", "details", "confirm"].indexOf(step) >= i ? "#C8A24C" : "#1A1A1A",
              }}
            />
          ))}
        </div>
      </div>

      {/* Step: Category */}
      {step === "category" && (
        <div className="px-5 pb-6">
          <h2 className="text-sm font-semibold mb-4" style={{ color: "#F0F0F0" }}>Who is the trial for?</h2>
          <div className="space-y-3">
            <CategoryOption
              title="Adult Classes"
              desc="Ages 16+"
              emoji="🥋"
              selected={category === "adult"}
              onClick={() => { setCategory("adult"); setStep("class"); }}
            />
            <CategoryOption
              title="Kids & Teens"
              desc="Ages 3–15"
              emoji="👶"
              selected={category === "kids"}
              onClick={() => { setCategory("kids"); setStep("class"); }}
            />
          </div>
        </div>
      )}

      {/* Step: Class Selection */}
      {step === "class" && (
        <div className="px-5 pb-6">
          <h2 className="text-sm font-semibold mb-4" style={{ color: "#F0F0F0" }}>Pick a class</h2>
          <div className="space-y-2">
            {classesForCategory.map((cls, i) => {
              const typeStyle = CLASS_TYPE_COLORS[cls.type] || CLASS_TYPE_COLORS.gi;
              return (
                <button
                  key={i}
                  onClick={() => {
                    setSelectedClass(cls);
                    const dates = getNextDates(cls.day);
                    setSelectedDate(dates[0]);
                    setStep("details");
                  }}
                  className="w-full text-left p-4 rounded-xl transition-all active:scale-[0.98]"
                  style={{ backgroundColor: "#111", border: "1px solid #1A1A1A" }}
                  data-testid={`class-option-${i}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium" style={{ color: "#F0F0F0" }}>{cls.name}</p>
                      <p className="text-xs mt-0.5" style={{ color: "#999" }}>{cls.day} at {cls.time}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[10px] font-medium px-2 py-0.5 rounded"
                        style={{ backgroundColor: typeStyle.bg, color: typeStyle.text }}
                      >
                        {typeStyle.label}
                      </span>
                      <ArrowRight size={14} style={{ color: "#444" }} />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step: Details */}
      {step === "details" && selectedClass && (
        <div className="px-5 pb-6">
          <h2 className="text-sm font-semibold mb-1" style={{ color: "#F0F0F0" }}>
            {selectedClass.name} — {selectedClass.day} at {selectedClass.time}
          </h2>
          <p className="text-xs mb-4" style={{ color: "#666" }}>Fill in your details</p>

          {/* Date Selection */}
          <div className="mb-4">
            <label className="block text-xs font-medium mb-1.5" style={{ color: "#999" }}>Select Date</label>
            <div className="space-y-1">
              {getNextDates(selectedClass.day).map((d, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedDate(d)}
                  className="w-full text-left px-4 py-2.5 rounded-lg text-sm transition-colors"
                  style={{
                    backgroundColor: selectedDate === d ? "rgba(200, 162, 76, 0.08)" : "#111",
                    color: selectedDate === d ? "#C8A24C" : "#F0F0F0",
                    border: `1px solid ${selectedDate === d ? "rgba(200, 162, 76, 0.2)" : "#1A1A1A"}`,
                  }}
                  data-testid={`date-option-${i}`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <FormInput label="Full Name" value={name} onChange={setName} placeholder="John Doe" testId="input-book-name" />
          <FormInput label="Email" value={email} onChange={setEmail} placeholder="john@email.com" type="email" testId="input-book-email" />
          <FormInput label="Phone" value={phone} onChange={setPhone} placeholder="(281) 555-1234" type="tel" testId="input-book-phone" />

          <button
            onClick={() => setStep("confirm")}
            disabled={!name || !email || !phone}
            className="w-full py-3 rounded-xl text-sm font-semibold mt-4 transition-all active:scale-[0.98]"
            style={{
              backgroundColor: name && email && phone ? "#C8A24C" : "#1A1A1A",
              color: name && email && phone ? "#0A0A0A" : "#666",
            }}
            data-testid="button-continue"
          >
            Continue
          </button>
        </div>
      )}

      {/* Step: Confirm */}
      {step === "confirm" && selectedClass && (
        <div className="px-5 pb-6">
          <h2 className="text-sm font-semibold mb-4" style={{ color: "#F0F0F0" }}>Confirm Booking</h2>

          <div className="p-4 rounded-xl mb-4 space-y-2" style={{ backgroundColor: "#111", border: "1px solid #1A1A1A" }}>
            <ConfirmRow label="Class" value={`${selectedClass.name} (${CLASS_TYPE_COLORS[selectedClass.type]?.label})`} />
            <ConfirmRow label="Date" value={selectedDate} />
            <ConfirmRow label="Time" value={selectedClass.time} />
            <ConfirmRow label="Name" value={name} />
            <ConfirmRow label="Email" value={email} />
            <ConfirmRow label="Phone" value={phone} />
          </div>

          {error && (
            <div className="text-sm px-3 py-2 rounded-lg mb-3" style={{ backgroundColor: "rgba(224, 85, 85, 0.1)", color: "#E05555" }}>
              {error}
            </div>
          )}

          <button
            onClick={handleBook}
            disabled={loading}
            className="w-full py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
            style={{ backgroundColor: "#C8A24C", color: "#0A0A0A", opacity: loading ? 0.7 : 1 }}
            data-testid="button-confirm-booking"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                Booking...
              </span>
            ) : (
              "Confirm & Book"
            )}
          </button>
        </div>
      )}
    </div>
  );
}

function CategoryOption({ title, desc, emoji, selected, onClick }: {
  title: string; desc: string; emoji: string; selected: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 rounded-xl transition-all active:scale-[0.98]"
      style={{
        backgroundColor: selected ? "rgba(200, 162, 76, 0.08)" : "#111",
        border: `1px solid ${selected ? "rgba(200, 162, 76, 0.2)" : "#1A1A1A"}`,
      }}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{emoji}</span>
        <div>
          <p className="text-sm font-semibold" style={{ color: "#F0F0F0" }}>{title}</p>
          <p className="text-xs" style={{ color: "#666" }}>{desc}</p>
        </div>
        <ArrowRight size={16} style={{ color: "#444", marginLeft: "auto" }} />
      </div>
    </button>
  );
}

function FormInput({ label, value, onChange, placeholder, type = "text", testId }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string; type?: string; testId: string;
}) {
  return (
    <div className="mb-3">
      <label className="block text-xs font-medium mb-1.5" style={{ color: "#999" }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-lg text-sm outline-none"
        style={{ backgroundColor: "#111", border: "1px solid #222", color: "#F0F0F0" }}
        data-testid={testId}
      />
    </div>
  );
}

function ConfirmRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs" style={{ color: "#666" }}>{label}</span>
      <span className="text-sm font-medium text-right" style={{ color: "#F0F0F0" }}>{value}</span>
    </div>
  );
}
