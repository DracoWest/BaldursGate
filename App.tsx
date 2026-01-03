import React, { useState, useEffect, useMemo } from "react";
import GatekeeperCat from "./components/GatekeeperCat";
import { AvailabilitySubmission, DayStatus } from "./types";
import CalendarGrid from "./components/CalendarGrid";
import SubmissionModal from "./components/SubmissionModal";
import { CHARACTER_NAMES } from "./constants";
import { supabase } from "./supabaseClient";

/* ---------------- CONFIG ---------------- */

const SITE_PASSCODE = "karaisqueen";
const TARGET_YEAR = 2026;

type GateState = "idle" | "typing" | "success" | "fail";

/* ---------------- APP ---------------- */

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState("");
  const [passcodeError, setPasscodeError] = useState(false);

  const [submissions, setSubmissions] = useState<AvailabilitySubmission[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  /* -------- Gatekeeper bridge -------- */

  const gate = (state: GateState) => {
    window.dispatchEvent(
      new CustomEvent("dracowest:gatekeeper", { detail: { state } })
    );
  };

  /* -------- Restore auth -------- */

  useEffect(() => {
    if (localStorage.getItem("dracowest_auth") === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  /* -------- Initial gate state (IMPORTANT) -------- */

  useEffect(() => {
    if (!isAuthenticated) {
      gate("idle");
    }
  }, [isAuthenticated]);

  /* -------- Passcode submit -------- */

  const handlePasscodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (passcodeInput === SITE_PASSCODE) {
      gate("success");
      setPasscodeError(false);

      setTimeout(() => {
        localStorage.setItem("dracowest_auth", "true");
        setIsAuthenticated(true);
      }, 650);
    } else {
      gate("fail");
      setPasscodeError(true);
      setPasscodeInput("");

      setTimeout(() => {
        setPasscodeError(false);
        gate("idle");
      }, 1200);
    }
  };

  /* -------- Date guards -------- */

  const is2026DateString = (d: string) =>
    typeof d === "string" && d.startsWith(`${TARGET_YEAR}-`);

  const is2026Date = (d: Date) => d.getFullYear() === TARGET_YEAR;

  /* -------- Fetch submissions -------- */

  const fetchSubmissions = async (manual = false) => {
    manual ? setIsRefreshing(true) : setIsLoading(true);

    try {
      const { data, error } = await supabase.from("availability").select("*");
      if (error) throw error;

      const mapped: AvailabilitySubmission[] = (data || [])
        .map((item: any) => ({
          id: item.id ?? crypto.randomUUID(),
          name: item.name,
          date: item.date,
          timezone: item.timezone ?? "UTC",
          isAllDay:
            item.is_all_day ?? item.isAllDay ?? item.isallday ?? true,
          startTime:
            item.start_time ?? item.startTime ?? item.starttime ?? "00:00",
          endTime:
            item.end_time ?? item.endTime ?? item.endtime ?? "23:59",
          comments: item.comments ?? "",
        }))
        .filter(s => is2026DateString(s.date));

      setSubmissions(mapped);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchSubmissions();
    const t = setInterval(fetchSubmissions, 1000 * 60 * 5);
    return () => clearInterval(t);
  }, [isAuthenticated]);

  /* -------- Add / Update -------- */

  const handleAddSubmission = async (submission: AvailabilitySubmission) => {
    if (!is2026DateString(submission.date)) {
      alert(`Only ${TARGET_YEAR} is allowed.`);
      return;
    }

    const prev = [...submissions];

    setSubmissions(s =>
      [...s.filter(x => !(x.date === submission.date && x.name === submission.name)), submission]
    );

    const payloads = [
      {
        name: submission.name,
        date: submission.date,
        timezone: submission.timezone,
        is_all_day: submission.isAllDay,
        start_time: submission.startTime,
        end_time: submission.endTime,
        comments: submission.comments,
      },
      {
        name: submission.name,
        date: submission.date,
        timezone: submission.timezone,
        isAllDay: submission.isAllDay,
        startTime: submission.startTime,
        endTime: submission.endTime,
        comments: submission.comments,
      },
    ];

    let saved = false;
    let lastErr: any = null;

    for (const p of payloads) {
      const { error } = await supabase
        .from("availability")
        .upsert(p, { onConflict: "date,name" });

      if (!error) {
        saved = true;
        break;
      }
      lastErr = error;
    }

    if (!saved) {
      console.error(lastErr);
      setSubmissions(prev);
      alert("Save failed.");
    }

    setIsModalOpen(false);
  };

  /* -------- Delete -------- */

  const handleDeleteSubmission = async (date: string, name: string) => {
    const prev = [...submissions];
    setSubmissions(s => s.filter(x => !(x.date === date && x.name === name)));

    const { error } = await supabase
      .from("availability")
      .delete()
      .eq("date", date)
      .eq("name", name);

    if (error) {
      console.error(error);
      alert("Delete failed.");
      setSubmissions(prev);
    }
  };

  /* -------- Calendar click -------- */

  const handleDayClick = (date: Date) => {
    if (!is2026Date(date)) return;
    setSelectedDate(date);
    setIsModalOpen(true);
  };

  /* -------- Status map -------- */

  const dayStatusMap = useMemo(() => {
    const map: Record<string, DayStatus> = {};
    const grouped: Record<string, AvailabilitySubmission[]> = {};

    submissions.forEach(s => {
      grouped[s.date] ??= [];
      grouped[s.date].push(s);
    });

    Object.entries(grouped).forEach(([date, subs]) => {
      const names = new Set(subs.map(s => s.name));
      if (names.size === CHARACTER_NAMES.length) {
        map[date] = subs.every(s => s.isAllDay)
          ? DayStatus.GREEN
          : DayStatus.YELLOW;
      } else if (names.size > 0) {
        map[date] = DayStatus.ORANGE;
      }
    });

    return map;
  }, [submissions]);

  /* ================= LOGIN SCREEN ================= */

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0c] px-4 relative overflow-hidden">
        <div className="w-full max-w-md text-center space-y-6 z-10">

          <h1 className="text-5xl font-cinzel text-[#b08d57] parchment-glow">
            DRACOWEST
          </h1>

          <form onSubmit={handlePasscodeSubmit} className="space-y-6">
            <input
              type="password"
              value={passcodeInput}
              placeholder="Enter Secret Incantation"
              onChange={(e) => {
                const v = e.target.value;
                setPasscodeInput(v);
                gate(v.length ? "typing" : "idle");
              }}
              className={`w-full bg-stone-900/50 border-b-2 py-4 px-2 text-center text-xl font-cinzel tracking-[0.2em] outline-none
                ${passcodeError ? "border-rose-500 text-rose-500" : "border-[#b08d57] text-[#b08d57]"}`}
              autoFocus
            />

            <button className="w-full py-4 bg-[#b08d57] text-black font-bold font-cinzel rounded">
              SPEAK INCANTATION
           </button>

  {/* Gatekeeper sits DIRECTLY under the button */}
  <div className="mt-4 flex justify-center">
    <GatekeeperCat
      idleSrc="/gate/idle.png"
      successSrc="/gate/granted.png"
      failSrc="/gate/denied.png"
    />
  </div>
</form>
        </div>
      </div>
    );
  }

  /* ================= MAIN APP ================= */

  const selectedDateStr = selectedDate?.toISOString().split("T")[0] ?? null;

  return (
    <div className="min-h-screen pb-24">
      <header className="pt-16 pb-12 text-center">
        <h1 className="text-6xl md:text-8xl font-cinzel text-[#b08d57] parchment-glow">
          DRACOWEST
        </h1>

        <div className="flex justify-center gap-4 mt-8">
          <button
            onClick={() => fetchSubmissions(true)}
            className="px-8 py-3 bg-[#b08d57] text-black font-bold rounded"
            disabled={isRefreshing}
          >
            {isRefreshing ? "CONSULTING…" : "REFRESH WEAVE"}
          </button>

          <button
            onClick={() => {
              localStorage.removeItem("dracowest_auth");
              window.location.reload();
            }}
            className="px-8 py-3 bg-stone-900 border border-stone-700 text-stone-300 rounded"
          >
            LOG OUT
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6">
        {isLoading ? (
          <div className="py-32 text-center text-[#b08d57]">
            Deciphering Ancient Availability…
          </div>
        ) : (
          <CalendarGrid
            startMonth={0}
            startYear={TARGET_YEAR}
            numMonths={12}
            dayStatusMap={dayStatusMap}
            onDayClick={handleDayClick}
          />
        )}
      </main>

      {isModalOpen && selectedDate && selectedDateStr && (
        <SubmissionModal
          date={selectedDate}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleAddSubmission}
          onDelete={handleDeleteSubmission}
          existingSubmissions={submissions.filter(s => s.date === selectedDateStr)}
        />
      )}
    </div>
  );
};

export default App;

