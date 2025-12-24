import React, { useState, useEffect, useMemo } from 'react';
import { AvailabilitySubmission, DayStatus } from './types';
import CalendarGrid from './components/CalendarGrid';
import SubmissionModal from './components/SubmissionModal';
import { CHARACTER_NAMES } from './constants';
import { supabase } from './supabaseClient';

// --- PASSWORD CONFIGURATION ---
const SITE_PASSCODE = 'karaisqueen';
// ------------------------------

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passcodeInput, setPasscodeInput] = useState('');
  const [passcodeError, setPasscodeError] = useState(false);

  const [submissions, setSubmissions] = useState<AvailabilitySubmission[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const now = new Date();
  const currentMonth = now.getMonth();

  useEffect(() => {
    const session = localStorage.getItem('dracowest_auth');
    if (session === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handlePasscodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcodeInput === SITE_PASSCODE) {
      setIsAuthenticated(true);
      localStorage.setItem('dracowest_auth', 'true');
      setPasscodeError(false);
    } else {
      setPasscodeError(true);
      setPasscodeInput('');
      setTimeout(() => setPasscodeError(false), 2000);
    }
  };

  const fetchSubmissions = async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const { data, error } = await supabase.from('availability').select('*');
      if (error) throw error;

      if (data) {
        const mappedData = data.map((item: any) => ({
          id: item.id || Math.random().toString(36).substr(2, 9),
          name: item.name,
          date: item.date,
          timezone: item.timezone || 'UTC',
          isAllDay: item.is_all_day ?? item.isAllDay ?? item.isallday ?? true,
          startTime: item.start_time ?? item.startTime ?? item.starttime ?? '00:00',
          endTime: item.end_time ?? item.endTime ?? item.endtime ?? '23:59',
          comments: item.comments || ''
        }));
        setSubmissions(mappedData as AvailabilitySubmission[]);
      }
    } catch (e: any) {
      console.error('Fetch error:', e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchSubmissions();
      const interval = setInterval(() => fetchSubmissions(), 1000 * 60 * 5);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const handleAddSubmission = async (submission: AvailabilitySubmission) => {
    const prevSubmissions = [...submissions];
    setSubmissions(prev => {
      const filtered = prev.filter(s => !(s.date === submission.date && s.name === submission.name));
      return [...filtered, submission];
    });

    // TRY MULTIPLE COLUMN NAMING STRATEGIES
    const basePayload = {
      name: submission.name,
      date: submission.date,
      timezone: submission.timezone,
      comments: submission.comments || ''
    };

    const strategies = [
      { ...basePayload, is_all_day: submission.isAllDay, start_time: submission.startTime, end_time: submission.endTime },
      { ...basePayload, isallday: submission.isAllDay, starttime: submission.startTime, endtime: submission.endTime },
      { ...basePayload, isAllDay: submission.isAllDay, startTime: submission.startTime, endTime: submission.endTime }
    ];

    let success = false;
    let lastError = null;

    for (const payload of strategies) {
      const { error } = await supabase.from('availability').upsert(payload, { onConflict: 'date,name' });
      if (!error) {
        success = true;
        break;
      }
      lastError = error;
    }

    if (!success) {
      console.error('Final Save Error:', lastError);
      alert(`The Weave is blocked. Error: ${lastError?.message || 'Check Supabase columns'}`);
      setSubmissions(prevSubmissions);
    }

    setIsModalOpen(false);
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setIsModalOpen(true);
  };

  const dayStatusMap = useMemo(() => {
    const map: Record<string, DayStatus> = {};
    const groupedByDate: Record<string, AvailabilitySubmission[]> = {};

    submissions.forEach(s => {
      if (!groupedByDate[s.date]) groupedByDate[s.date] = [];
      groupedByDate[s.date].push(s);
    });

    Object.entries(groupedByDate).forEach(([dateStr, subs]) => {
      const distinctNames = new Set(subs.map(s => s.name));
      const count = distinctNames.size;

      if (count === CHARACTER_NAMES.length) {
        const allDayCommitment = subs.every(s => s.isAllDay);
        map[dateStr] = allDayCommitment ? DayStatus.GREEN : DayStatus.YELLOW;
      } else if (count > 0) {
        map[dateStr] = DayStatus.ORANGE;
      } else {
        map[dateStr] = DayStatus.NONE;
      }
    });

    return map;
  }, [submissions]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0c] px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#b08d57] blur-[150px] rounded-full"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#b08d57] blur-[150px] rounded-full opacity-50"></div>
        </div>

        <div className="w-full max-w-md z-10 text-center">
          <div className="mb-10 relative inline-block">
            <div className="w-24 h-24 mx-auto border-2 border-[#b08d57] rotate-45 flex items-center justify-center animate-gold mb-8">
              <span className="text-4xl -rotate-45">⚔️</span>
            </div>

            <h1 className="text-5xl font-cinzel text-[#b08d57] parchment-glow mb-2 tracking-widest">
              DRACOWEST
            </h1>

            <p className="text-stone-500 font-medieval uppercase text-[10px] tracking-[0.4em]">
              Ancient Gateway
            </p>

            {/* NEW WITTY BG-STYLE MESSAGE */}
            <div className="mt-6 max-w-sm mx-auto">
              <p className="text-stone-400 font-medieval text-sm leading-relaxed">
                No passcode? Then linger at the threshold.
                <span className="block mt-2 text-[#b08d57] font-cinzel tracking-wide">
                  Great things will be revealed when the party is ready.
                </span>
              </p>
              <div className="mt-5 h-px w-40 mx-auto bg-stone-800/80" />
            </div>
            {/* END NEW MESSAGE */}
          </div>

          <form onSubmit={handlePasscodeSubmit} className="space-y-6">
            <input
              type="password"
              placeholder="Enter Secret Incantation"
              value={passcodeInput}
              onChange={(e) => setPasscodeInput(e.target.value)}
              className={`w-full bg-stone-900/50 border-b-2 py-4 px-2 text-center text-xl font-cinzel tracking-[0.2em] outline-none transition-all duration-500
                ${passcodeError ? 'border-rose-500 text-rose-500 animate-shake' : 'border-stone-800 text-[#b08d57] focus:border-[#b08d57] focus:bg-stone-900'}
              `}
              autoFocus
            />
            <button
              type="submit"
              className="w-full py-4 bg-[#b08d57] hover:bg-[#c4a169] text-stone-950 font-bold font-cinzel rounded"
            >
              SPEAK INCANTATION
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      <header className="pt-16 pb-12 text-center relative px-4 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-64 bg-[#b08d57]/5 blur-[120px] -z-10 rounded-full"></div>
        <h1 className="text-6xl md:text-8xl font-cinzel text-[#b08d57] parchment-glow mb-4 tracking-tighter">DRACOWEST</h1>
        <div className="flex items-center justify-center gap-4 mb-10 text-stone-500 font-medieval uppercase tracking-[0.3em] text-xs">
          <div className="h-px w-12 bg-stone-800"></div>
          The 2025-2026 Chronicles
          <div className="h-px w-12 bg-stone-800"></div>
        </div>

        <div className="flex flex-col items-center gap-6">
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => fetchSubmissions(true)}
              className="px-10 py-4 bg-[#b08d57] text-stone-950 hover:bg-[#c4a169] font-bold rounded font-cinzel"
              disabled={isRefreshing}
            >
              {isRefreshing ? 'CONSULTING...' : 'REFRESH WEAVE'}
            </button>

            {/* SHARE LINK BUTTON REMOVED */}

            <button
              onClick={() => {
                localStorage.removeItem('dracowest_auth');
                window.location.reload();
              }}
              className="px-10 py-4 bg-stone-900 border border-stone-700 text-stone-400 hover:text-stone-200 font-bold rounded font-cinzel transition-all"
            >
              LOG OUT
            </button>
          </div>

          <div className="max-w-md bg-stone-900/50 p-6 rounded-lg border border-stone-800/50 backdrop-blur-sm">
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mb-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span className="text-[10px] font-medieval uppercase text-stone-400">Full Party All Day</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <span className="text-[10px] font-medieval uppercase text-stone-400">Full Party Limited</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span className="text-[10px] font-medieval uppercase text-stone-400">Partial Party</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                <span className="text-[10px] font-medieval uppercase text-stone-400">No Signups</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 space-y-32">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="w-16 h-16 border-2 border-[#b08d57] border-t-transparent rounded-full animate-spin mb-6"></div>
            <p className="font-cinzel text-[#b08d57] animate-pulse uppercase text-sm">Deciphering Ancient Availability...</p>
          </div>
        ) : (
          <>
            <section className="relative">
              <div className="sticky top-0 z-20 bg-black/80 backdrop-blur py-4 mb-12 border-b border-stone-800/50">
                <h2 className="text-4xl font-cinzel text-[#b08d57]">2025</h2>
              </div>
              <CalendarGrid
                startMonth={currentMonth}
                startYear={2025}
                numMonths={12 - currentMonth}
                dayStatusMap={dayStatusMap}
                onDayClick={handleDayClick}
              />
            </section>

            <section className="relative pb-24">
              <div className="sticky top-0 z-20 bg-black/80 backdrop-blur py-4 mb-12 border-b border-stone-800/50">
                <h2 className="text-4xl font-cinzel text-[#b08d57]">2026</h2>
              </div>
              <CalendarGrid
                startMonth={0}
                startYear={2026}
                numMonths={12}
                dayStatusMap={dayStatusMap}
                onDayClick={handleDayClick}
              />
            </section>
          </>
        )}
      </main>

      {isModalOpen && selectedDate && (
        <SubmissionModal
          date={selectedDate}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleAddSubmission}
          existingSubmissions={submissions.filter(s => s.date === selectedDate.toISOString().split('T')[0])}
        />
      )}
    </div>
  );
};

export default App;
