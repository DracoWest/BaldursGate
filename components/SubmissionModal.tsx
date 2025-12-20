import React, { useState, useEffect } from 'react';
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

  // Load the character name from local storage on mount so users don't have to keep selecting it
  useEffect(() => {
    const savedName = localStorage.getItem('dracowest_selected_character');
    if (savedName && CHARACTER_NAMES.includes(savedName as CharacterName)) {
      setName(savedName as CharacterName);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return alert("Select your character!");
    
    // Save selection for future use to local storage
    localStorage.setItem('dracowest_selected_character', name);

    onSubmit({
      id: Math.random().toString(36).substr(2, 9),
      name: name as CharacterName,
      date: date.toISOString().split('T')[0],
      timezone,
      isAllDay,
      startTime: '00:00',
      endTime: '23:59'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div className="bg-[#1a1a1a] border-2 border-[#b08d57] w-full max-w-md p-8 rounded-lg shadow-[0_0_50px_rgba(0,0,0,1)] relative overflow-hidden">
        {/* Decorative corner element */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#b08d57]/30"></div>
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#b08d57]/30"></div>

        <h2 className="text-2xl font-cinzel text-[#b08d57] mb-2 text-center">Declare Availability</h2>
        <p className="text-stone-500 font-medieval text-center mb-8 text-sm">
          For the date of {MONTH_NAMES[date.getMonth()]} {date.getDate()}, {date.getFullYear()}
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-medieval text-stone-500 uppercase mb-2">Identify Traveler</label>
            <select 
              value={name} 
              onChange={e => setName(e.target.value as any)} 
              className="w-full bg-stone-900 border border-stone-700 text-[#b08d57] p-3 rounded font-cinzel focus:outline-none focus:border-[#b08d57]"
            >
              <option value="">Select Character</option>
              {CHARACTER_NAMES.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medieval text-stone-500 uppercase mb-2">Temporal Zone</label>
            <select 
              value={timezone} 
              onChange={e => setTimezone(e.target.value)} 
              className="w-full bg-stone-900 border border-stone-700 text-stone-300 p-3 rounded font-cinzel focus:outline-none focus:border-[#b08d57]"
            >
              {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
            </select>
          </div>

          <div className="pt-4 space-y-3">
            <button 
              type="submit" 
              className="w-full bg-[#b08d57] hover:bg-[#8c7045] text-stone-950 p-4 rounded font-bold font-cinzel transition-colors shadow-lg active:scale-95"
            >
              Seal the Commitment
            </button>
            <button 
              type="button" 
              onClick={onClose} 
              className="w-full text-stone-600 hover:text-stone-400 font-medieval transition-colors"
            >
              Dismiss
            </button>
          </div>
        </form>

        {existingSubmissions.length > 0 && (
          <div className="mt-8 pt-6 border-t border-stone-800">
            <h3 className="text-xs font-medieval text-stone-500 uppercase mb-3">Others Committed</h3>
            <div className="flex flex-wrap gap-2">
              {existingSubmissions.map(s => (
                <span key={s.id} className="text-xs bg-stone-800 text-emerald-500 px-3 py-1 rounded-full border border-emerald-900/50">
                  {s.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubmissionModal;
