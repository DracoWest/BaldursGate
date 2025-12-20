import React, { useState } from 'react';
import { AvailabilitySubmission, CharacterName } from '../types';
import { CHARACTER_NAMES, TIMEZONES, MONTH_NAMES } from '../constants';

interface SubmissionModalProps {
  date: Date;
  onClose: () => void;
  onSubmit: (submission: AvailabilitySubmission) => void;
  existingSubmissions: AvailabilitySubmission[];
}

const SubmissionModal: React.FC<SubmissionModalProps> = ({ date, onClose, onSubmit, existingSubmissions }) => {
  const [name, setName] = useState<CharacterName | ''>('');
  const [timezone, setTimezone] = useState('PST');
  const [isAllDay, setIsAllDay] = useState(true);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return alert("Identify your character first, Traveler!");
    
    onSubmit({
      id: Math.random().toString(36).substr(2, 9),
      name: name as CharacterName,
      date: date.toISOString().split('T')[0],
      timezone,
      isAllDay,
      startTime: isAllDay ? '00:00' : startTime,
      endTime: isAllDay ? '23:59' : endTime
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#1a1a1a] border-2 border-[#b08d57] w-full max-w-md p-8 rounded-lg shadow-[0_0_80px_rgba(0,0,0,1)] relative my-8">
        <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-[#b08d57]/40 pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-[#b08d57]/40 pointer-events-none"></div>

        <h2 className="text-3xl font-cinzel text-[#b08d57] mb-2 text-center tracking-wide">DECLARE PRESENCE</h2>
        <p className="text-stone-500 font-medieval text-center mb-10 text-sm tracking-widest border-b border-stone-800 pb-4">
          {MONTH_NAMES[date.getMonth()]} {date.getDate()}, {date.getFullYear()}
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[10px] font-medieval text-stone-500 uppercase mb-2 tracking-widest">Identify Traveler</label>
            <select 
              value={name} 
              onChange={e => setName(e.target.value as any)} 
              className="w-full bg-[#d4c3a1] border border-stone-800 text-black p-3 rounded font-cinzel focus:outline-none focus:ring-2 focus:ring-[#b08d57]/50 transition-all"
            >
              <option value="" className="text-black">Choose Companion</option>
              {CHARACTER_NAMES.map(n => <option key={n} value={n} className="text-black">{n}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-medieval text-stone-500 uppercase mb-2 tracking-widest">Temporal Zone</label>
              <select 
                value={timezone} 
                onChange={e => setTimezone(e.target.value)} 
                className="w-full bg-[#d4c3a1] border border-stone-800 text-black p-3 rounded font-cinzel text-xs focus:outline-none focus:ring-2 focus:ring-[#b08d57]/50 transition-all"
              >
                {TIMEZONES.map(tz => <option key={tz} value={tz} className="text-black">{tz}</option>)}
              </select>
            </div>
            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2 cursor-pointer group py-3 px-1">
                <input 
                  type="checkbox" 
                  checked={isAllDay} 
                  onChange={e => setIsAllDay(e.target.checked)}
                  className="hidden"
                />
                <div className={`w-5 h-5 border flex items-center justify-center transition-all ${isAllDay ? 'bg-[#b08d57] border-[#b08d57]' : 'bg-transparent border-stone-700'}`}>
                  {isAllDay && <span className="text-stone-950 text-[10px]">✓</span>}
                </div>
                <span className={`text-[10px] font-medieval uppercase tracking-widest ${isAllDay ? 'text-[#b08d57]' : 'text-stone-500'}`}>All Day</span>
              </label>
            </div>
          </div>

          {!isAllDay && (
            <div className="grid grid-cols-2 gap-4 pt-2 animate-in fade-in slide-in-from-top-2">
              <div>
                <label className="block text-[10px] font-medieval text-stone-500 uppercase mb-2 tracking-widest text-center">Arrival</label>
                <input 
                  type="time" 
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  className="w-full bg-stone-900/50 border border-stone-800 text-stone-300 p-3 rounded font-cinzel text-center focus:outline-none focus:border-[#b08d57]/60"
                />
              </div>
              <div>
                <label className="block text-[10px] font-medieval text-stone-500 uppercase mb-2 tracking-widest text-center">Departure</label>
                <input 
                  type="time" 
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                  className="w-full bg-stone-900/50 border border-stone-800 text-stone-300 p-3 rounded font-cinzel text-center focus:outline-none focus:border-[#b08d57]/60"
                />
              </div>
            </div>
          )}

          <div className="pt-6 space-y-4">
            <button 
              type="submit" 
              className="w-full bg-[#b08d57] hover:bg-[#c4a169] text-stone-950 p-4 rounded font-bold font-cinzel transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
            >
              SEAL THE COMMITMENT
            </button>
            <button 
              type="button" 
              onClick={onClose} 
              className="w-full text-stone-600 hover:text-stone-400 font-medieval transition-colors uppercase text-[10px] tracking-[0.3em]"
            >
              Dismiss
            </button>
          </div>
        </form>

        {existingSubmissions.length > 0 && (
          <div className="mt-8 pt-6 border-t border-stone-800/50">
            <h3 className="text-[10px] font-medieval text-stone-600 uppercase mb-4 tracking-widest">Party Already Committed</h3>
            <div className="flex flex-wrap gap-2">
              {existingSubmissions.map(s => (
                <div key={s.id} className="group relative">
                  <span className={`text-[10px] px-3 py-1.5 rounded-sm border font-cinzel flex flex-col items-center ${s.isAllDay ? 'bg-emerald-950/20 border-emerald-900/50 text-emerald-500' : 'bg-amber-950/20 border-amber-900/50 text-amber-500'}`}>
                    <span>{s.name}</span>
                    <span className="text-[8px] opacity-60">
                      {s.isAllDay ? 'ALL DAY' : `${s.startTime} - ${s.endTime}`}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubmissionModal;
