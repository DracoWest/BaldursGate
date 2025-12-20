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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return alert("Select a name!");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#1a1a1a] border-2 border-[#b08d57] w-full max-w-md p-6 rounded-lg">
        <h2 className="text-2xl font-cinzel text-[#b08d57] mb-4">Availability for {MONTH_NAMES[date.getMonth()]} {date.getDate()}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <select value={name} onChange={e => setName(e.target.value as any)} className="w-full bg-stone-200 text-black p-2 rounded">
            <option value="">Select Traveler</option>
            {CHARACTER_NAMES.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <select value={timezone} onChange={e => setTimezone(e.target.value)} className="w-full bg-stone-200 text-black p-2 rounded">
            {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
          </select>
          <button type="submit" className="w-full bg-[#7a1a1c] p-3 rounded font-bold">Seal the Commitment</button>
          <button type="button" onClick={onClose} className="w-full text-stone-500">Cancel</button>
        </form>
      </div>
    </div>
  );
};

export default SubmissionModal;