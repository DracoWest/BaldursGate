import React, { useState, useEffect, useMemo } from "react";
import GatekeeperCat from "./components/GatekeeperCat";
import CalendarGrid from "./components/CalendarGrid";
import SubmissionModal from "./components/SubmissionModal";
import { AvailabilitySubmission, DayStatus } from "./types";
import { CHARACTER_NAMES } from "./constants";
import { supabase } from "./supabaseClient";

/* ---------------- CONFIG ---------------- */

const SITE_PASSCODE = "karaisqueen";
const TARGET_YEAR = 2026;

/* ---------------- APP ---------------- */

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState("");
  const [passcodeError, setPasscodeError] = useState(false);

  const [submissions, setSubmissions] = useState<AvailabilitySubmission[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(true);

  /* -------- Gatekeeper bridge -------- */

  const gate = (state: "idle" | "success" | "fail") => {
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

  /* -------- Ensure idle gate ONCE -------- */

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

  const fetchSubmissions = async () => {
    setIsLoading(true);

    try {
      const { data } = await supabase.from("availability").select("*");

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
        .filter((s) => is2026DateString(s.date));

      setSubmissions(mapped);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) fetchSubmissions();
  }, [isAuthenticated]);

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

    submissions.forEach((s) => {
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

  /* ================= LOGIN ================= */

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0c] px-4">
        <div className="w-full max-w-md text-center space-y-6">

          <h1 className="text-5xl font-cinzel text-[#b08d57]">DRACOWEST</h1>

          <form onSubmit={handlePasscodeSubmit} className="space-y-6">
            <input
              type="password"
              value={passcodeInput}
              placeholder="Enter Secret Incantation"
              onChange={(e) => setPasscodeInput(e.target.value)}
              className={`w-full text-center text-xl py-4 bg-black border-b-2
                ${passcodeError
                  ? "border-red-500 text-red-400"
                  : "border-[#b08d57] text-[#b08d57]"}`}
            />

            <button className="w-full py-4 bg-[#b08d57] text-black font-bold">
              SPEAK INCANTATION
            </button>

            <GatekeeperCat
              idleSrc="/gate/idle.png"
              successSrc="/gate/granted.png"
              failSrc="/gate/denied.png"
            />
          </form>
        </div>
      </div>
    );
  }

  /* ================= MAIN ================= */

  const selectedDateStr = selectedDate?.toISOString().split("T")[0] ?? null;

  return (
    <div className="min-h-screen pb-24">
      <main className="max-w-7xl mx-auto px-6">
        {isLoading ? (
          <div className="py-32 text-center text-[#b08d57]">
            Loading…
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
          existingSubmissions={submissions.filter(s => s.date === selectedDateStr)}
        />
      )}
    </div>
  );
};

export default App;
