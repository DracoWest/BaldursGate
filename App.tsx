import React, { useState, useEffect, useMemo } from 'react';
import { AvailabilitySubmission, DayStatus } from './types';
import CalendarGrid from './components/CalendarGrid';
import SubmissionModal from './components/SubmissionModal';
import { CHARACTER_NAMES } from './constants';
import { supabase } from './supabaseClient';

const App: React.FC = () => {
  const [submissions, setSubmissions] = useState<AvailabilitySubmission[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showCopyFeedback, setShowCopyFeedback] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const now = new Date();
  const currentMonth = now.getMonth();

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
        setSubmissions(data as AvailabilitySubmission[]);
      }
    } catch (e) {
      console.error('Fetch error:', e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
    const interval = setInterval(() => fetchSubmissions(), 1000 * 60 * 5);
    return () => clearInterval(interval);
  }, []);

  const handleAddSubmission = async (submission: AvailabilitySubmission) => {
    const prevSubmissions = [...submissions];
    setSubmissions(prev => {
      const filtered = prev.filter(s => !(s.date === submission.date && s.name === submission.name));
      return [...filtered, submission];
    });

    const { error } = await supabase
      .from('availability')
      .upsert({
        name: submission.name,
        date: submission.date,
        timezone: submission.timezone,
        isAllDay: submission.isAllDay,
        startTime: submission.startTime,
        endTime: submission.endTime,
        comments: submission.comments
      }, { onConflict: 'date,name' });

    if (error) {
      console.error('Error saving to Supabase:', error);
      alert('The dice roll failed: ' + error.message);
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
          </div>
          
          <div className="max-w-md bg-stone-900/50 p-4 rounded-lg border border-stone-800/50 backdrop-blur-sm">
             <p className="text-stone-400 text-sm font-medieval">
                {showCopyFeedback 
                  ? "The party link is in your inventory! Send the URL in your browser address bar to your companions."
                  : "Each companion must register their presence for a date to turn Gold. Red means missing companions."}
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
                  <p className="text-stone-600 font-medieval uppercase text-xs tracking-widest">The Current Era</p>
                </div>
                <div className="flex gap-4 text-[10px] font-medieval uppercase text-stone-500">
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50 border border-emerald-400"></div> Full Party</div>
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-amber-500/50 border border-amber-400"></div> Limited Time</div>
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-rose-500/50 border border-rose-400"></div> Missing</div>
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
