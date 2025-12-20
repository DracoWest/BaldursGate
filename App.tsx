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
      alert('Failed to seal the commitment: ' + error.message);
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
      setTimeout(() => setShowCopyFeedback(false), 3000);
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
    <div className="min-h-screen pb-20 overflow-x-hidden">
      <header className="py-12 text-center border-b border-stone-800 bg-stone-950/80 backdrop-blur shadow-2xl relative">
        <h1 className="text-5xl md:text-7xl font-cinzel text-[#b08d57] parchment-glow mb-2">
          DracoWest
        </h1>
        <p className="font-medieval text-stone-500 uppercase tracking-widest text-sm mb-8">Baldur's Gate Availability</p>
        
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="flex flex-wrap justify-center gap-4 px-4">
            <button 
              onClick={generateShareLink}
              className="bg-[#b08d57] hover:bg-[#8c7045] text-stone-950 px-8 py-3 rounded-full font-bold transition-all shadow-lg flex items-center gap-2 transform hover:scale-105 active:scale-95"
            >
              {showCopyFeedback ? '✨ Copied! ✨' : '🔗 Copy Shareable Link'}
            </button>
            <button 
              onClick={() => fetchSubmissions(true)}
              disabled={isRefreshing}
              className="bg-stone-800 hover:bg-stone-700 text-stone-300 px-6 py-3 rounded-full font-bold transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isRefreshing ? '⌛ Consulting...' : '🔄 Refresh Weave'}
            </button>
          </div>
          {showCopyFeedback && (
            <p className="text-emerald-500 font-medieval animate-pulse text-sm">Link secured for your party!</p>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 mt-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
             <div className="w-12 h-12 border-4 border-[#b08d57] border-t-transparent rounded-full animate-spin"></div>
             <p className="font-cinzel text-[#b08d57] animate-pulse">Consulting the Elders of the Database...</p>
          </div>
        ) : (
          <div className="space-y-20">
            <section>
              <div className="flex items-center justify-between border-b border-stone-800 mb-8">
                <h2 className="text-3xl font-cinzel text-[#b08d57]/70 pb-4">Remainder of 2025</h2>
                <span className="text-stone-600 font-medieval text-sm italic">The Current Age</span>
              </div>
              <CalendarGrid 
                startMonth={currentMonth} 
                startYear={2025} 
                numMonths={12 - currentMonth} 
                dayStatusMap={dayStatusMap} 
                onDayClick={handleDayClick} 
              />
            </section>

            <section>
              <div className="flex items-center justify-between border-b border-stone-800 mb-8">
                <h2 className="text-3xl font-cinzel text-[#b08d57]/70 pb-4">Full Year 2026</h2>
                <span className="text-stone-600 font-medieval text-sm italic">Future Quests</span>
              </div>
              <CalendarGrid 
                startMonth={0} 
                startYear={2026} 
                numMonths={12} 
                dayStatusMap={dayStatusMap} 
                onDayClick={handleDayClick} 
              />
            </section>
          </div>
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