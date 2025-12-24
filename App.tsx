import React, { useState, useEffect, useMemo } from 'react';
import { AvailabilitySubmission, DayStatus } from './types';
import CalendarGrid from './components/CalendarGrid';
import SubmissionModal from './components/SubmissionModal';
import { CHARACTER_NAMES } from './constants';
import { supabase } from './supabaseClient';

// --- PASSWORD CONFIGURATION ---
const SITE_PASSCODE = 'DRACO2025'; // Change this to your desired password
// ------------------------------

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passcodeInput, setPasscodeInput] = useState('');
  const [passcodeError, setPasscodeError] = useState(false);
  
  const [submissions, setSubmissions] = useState<AvailabilitySubmission[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showCopyFeedback, setShowCopyFeedback] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const now = new Date();
  const currentMonth = now.getMonth();

  // Check for existing session on load
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
      // Shake effect or feedback
      setTimeout(() => setPasscodeError(false), 2000);
    }
  };

  const fetchSubmissions = async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    else setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('availability')
        .select('*');

      if (error) {
        console.error('Error fetching availability:', error);
      } else if (data) {
        // Robust mapping to handle various database column naming conventions
        const mappedData = data.map((item: any) => ({
          ...item,
          isAllDay: item.is_all_day ?? item.isAllDay ?? item.isallday ?? true,
          startTime: item.start_time ?? item.startTime ?? item.starttime ?? '00:00',
          endTime: item.end_time ?? item.endTime ?? item.endtime ?? '23:59'
        }));
        setSubmissions(mappedData as AvailabilitySubmission[]);
      }
    } catch (e) {
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

    // We use snake_case for the database columns as it is the Postgres/Supabase standard.
    // If your table specifically uses camelCase, you would need to change these back.
    const { error } = await supabase
      .from('availability')
      .upsert({
        name: submission.name,
        date: submission.date,
        timezone: submission.timezone,
        is_all_day: submission.isAllDay,
        start_time: submission.startTime,
        end_time: submission.endTime,
        comments: submission.comments
      }, { onConflict: 'date,name' });

    if (error) {
      console.error('Error saving to Supabase:', error);
      alert('The dice roll failed: ' + error.message + '\n\nPlease check that your Supabase table has columns named: is_all_day, start_time, end_time');
      setSubmissions(prevSubmissions);
    }

    setIsModalOpen(false);
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setIsModalOpen(true);
  };

  const generateShareLink = () => {
    const shareUrl = window.location.href;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setShowCopyFeedback(true);
      setTimeout(() => setShowCopyFeedback(false), 4000);
    });
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
      
      if (distinctNames.size === CHARACTER_NAMES.length) {
        const allDayCommitment = subs.every(s => s.isAllDay);
        map[dateStr] = allDayCommitment ? DayStatus.GREEN : DayStatus.YELLOW;
      } else {
        map[dateStr] = DayStatus.RED;
      }
    });

    return map;
  }, [submissions]);

  // --- GATEKEEPER SCREEN ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0c] px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#b08d57] blur-[150px] rounded-full"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#b08d57] blur-[150px] rounded-full opacity-50"></div>
        </div>

        <div className="w-full max-w-md z-10 text-center">
          <div className="mb-12 relative inline-block">
             <div className="w-24 h-24 mx-auto border-2 border-[#b08d57] rotate-45 flex items-center justify-center animate-gold mb-8">
                <span className="text-4xl -rotate-45">⚔️</span>
             </div>
             <h1 className="text-5xl font-cinzel text-[#b08d57] parchment-glow mb-2 tracking-widest">DRACOWEST</h1>
             <p className="text-stone-500 font-medieval uppercase text-[10px] tracking-[0.4em]">Ancient Gateway</p>
          </div>

          <form onSubmit={handlePasscodeSubmit} className="space-y-6">
            <div className="relative group">
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
              <div className="mt-4">
                 {passcodeError ? (
                   <p className="text-rose-500 font-medieval text-xs animate-pulse">The Weave rejects your words, Traveler.</p>
                 ) : (
                   <p className="text-stone-600 font-medieval text-xs">Speak the secret word to reveal the chronicles.</p>
                 )}
              </div>
            </div>

            <button 
              type="submit"
              className="w-full py-4 bg-[#b08d57] hover:bg-[#c4a169] text-stone-950 font-bold font-cinzel rounded shadow-[0_0_20px_rgba(176,141,87,0.2)] transition-all hover:shadow-[0_0_30px_rgba(176,141,87,0.4)] active:scale-95"
            >
              SPEAK INCANTATION
            </button>
          </form>

          <button 
            onClick={() => alert("The master of the chronicles holds the key.")}
            className="mt-12 text-stone-700 hover:text-stone-500 font-medieval text-[10px] uppercase tracking-widest transition-colors"
          >
            Forgot the word?
          </button>
        </div>
      </div>
    );
  }

  // --- MAIN APP CONTENT ---
  return (
    <div className="min-h-screen pb-24">
      <header className="pt-16 pb-12 text-center relative px-4 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-64 bg-[#b08d57]/5 blur-[120px] -z-10 rounded-full"></div>
        
        <h1 className="text-6xl md:text-8xl font-cinzel text-[#b08d57] parchment-glow mb-4 tracking-tighter">
          DRACOWEST
        </h1>
        <div className="flex items-center justify-center gap-4 mb-10">
          <div className="h-px w-12 bg-stone-800"></div>
          <p className="font-medieval text-stone-500 uppercase tracking-[0.3em] text-xs">The 2025-2026 Chronicles</p>
          <div className="h-px w-12 bg-stone-800"></div>
        </div>
        
        <div className="flex flex-col items-center gap-6">
          <div className="flex flex-wrap justify-center gap-4">
            <button 
              onClick={generateShareLink}
              className="group relative px-8 py-4 bg-[#b08d57] hover:bg-[#c4a169] text-stone-950 font-bold rounded shadow-[0_10px_20px_-10px_rgba(176,141,87,0.5)] transition-all transform hover:-translate-y-1 active:translate-y-0"
            >
              <span className="font-cinzel flex items-center gap-2">
                {showCopyFeedback ? '✨ LINK SEALED ✨' : '🔗 SHARE THIS QUEST'}
              </span>
            </button>
            <button 
              onClick={() => fetchSubmissions(true)}
              disabled={isRefreshing}
              className="px-8 py-4 bg-stone-900 border border-stone-700 text-stone-300 hover:text-white hover:border-stone-500 font-bold rounded transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <span className="font-cinzel">{isRefreshing ? 'CONSULTING...' : 'REFRESH WEAVE'}</span>
            </button>
            <button 
              onClick={() => {
                localStorage.removeItem('dracowest_auth');
                window.location.reload();
              }}
              className="px-4 py-4 bg-stone-950 border border-stone-900 text-stone-700 hover:text-stone-500 text-[10px] font-medieval rounded transition-all uppercase tracking-widest"
            >
              Log Out
            </button>
          </div>
          
          <div className="max-w-md bg-stone-900/50 p-4 rounded-lg border border-stone-800/50 backdrop-blur-sm">
             <p className="text-stone-400 text-sm font-medieval">
                {showCopyFeedback 
                  ? "The party link is in your inventory! Send the URL in your browser address bar to your companions."
                  : "The Weave is active. Red indicates missing companions (0-5). Yellow means all 6 are here but some have limited hours. Gold is full 6-person full-day harmony."}
             </p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 space-y-32">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32">
             <div className="w-16 h-16 border-2 border-[#b08d57] border-t-transparent rounded-full animate-spin mb-6"></div>
             <p className="font-cinzel text-[#b08d57] animate-pulse tracking-widest uppercase text-sm">Deciphering Ancient Availability...</p>
          </div>
        ) : (
          <>
            <section className="relative">
              <div className="sticky top-0 z-20 bg-black/80 backdrop-blur py-4 mb-12 border-b border-stone-800/50 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <h2 className="text-4xl font-cinzel text-[#b08d57] mb-1">2025</h2>
                  <p className="text-stone-600 font-medieval uppercase text-xs tracking-widest">Current Era</p>
                </div>
                <div className="flex gap-4 text-[10px] font-medieval uppercase text-stone-500">
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50 border border-emerald-400"></div> Full Party (All Day)</div>
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-amber-500/50 border border-amber-400"></div> Full Party (Limited)</div>
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-rose-500/50 border border-rose-400"></div> Missing Members</div>
                </div>
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
              <div className="sticky top-0 z-20 bg-black/80 backdrop-blur py-4 mb-12 border-b border-stone-800/50 flex flex-col md:flex-row md:items-end justify-between">
                <div>
                  <h2 className="text-4xl font-cinzel text-[#b08d57] mb-1">2026</h2>
                  <p className="text-stone-600 font-medieval uppercase text-xs tracking-widest">Future Horizons</p>
                </div>
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
