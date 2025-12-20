import React from 'react';
import { DayStatus } from '../types';
import { MONTH_NAMES } from '../constants';

interface CalendarGridProps {
  startMonth: number;
  startYear: number;
  numMonths: number;
  dayStatusMap: Record<string, DayStatus>;
  onDayClick: (date: Date) => void;
}

const CalendarGrid: React.FC<CalendarGridProps> = ({ 
  startMonth, 
  startYear, 
  numMonths, 
  dayStatusMap,
  onDayClick 
}) => {
  const months = [];
  let currentMonth = startMonth;
  let currentYear = startYear;

  for (let i = 0; i < numMonths; i++) {
    months.push({ month: currentMonth, year: currentYear });
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-12">
      {months.map(({ month, year }) => (
        <Month 
          key={`${month}-${year}`} 
          month={month} 
          year={year} 
          dayStatusMap={dayStatusMap}
          onDayClick={onDayClick}
        />
      ))}
    </div>
  );
};

const Month: React.FC<{ month: number; year: number; dayStatusMap: Record<string, DayStatus>; onDayClick: (date: Date) => void }> = ({ month, year, dayStatusMap, onDayClick }) => {
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));

  return (
    <div className="group">
      <h3 className="text-lg font-cinzel text-stone-500 group-hover:text-[#b08d57] transition-colors mb-4 pl-1 border-l-2 border-[#b08d57]/20 group-hover:border-[#b08d57]/60">
        {MONTH_NAMES[month]} <span className="text-[10px] opacity-40 ml-1">{year}</span>
      </h3>
      <div className="grid grid-cols-7 gap-1 text-center mb-3">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
          <div key={d} className="text-[10px] text-stone-600 font-medieval font-bold uppercase tracking-tighter">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((date, idx) => {
          if (!date) return <div key={idx} className="h-8" />;
          const dateStr = date.toISOString().split('T')[0];
          
          // Request: Red if no users signed up OR partial users.
          // dayStatusMap only contains entries for dates that HAVE submissions.
          // If no submission exists, map[dateStr] is undefined.
          const status = dayStatusMap[dateStr] || DayStatus.RED;
          
          let statusStyles = "";
          if (status === DayStatus.GREEN) {
            statusStyles = "bg-emerald-950/40 border-emerald-500/50 text-emerald-400 hover:bg-emerald-900/60 hover:border-emerald-400";
          } else if (status === DayStatus.YELLOW) {
            statusStyles = "bg-amber-950/40 border-amber-600/50 text-amber-400 hover:bg-amber-900/60 hover:border-amber-500";
          } else {
            // RED is the default now
            statusStyles = "bg-rose-950/20 border-rose-900/50 text-rose-800 hover:bg-rose-950/40 hover:border-rose-700";
          }
          
          const isToday = new Date().toDateString() === date.toDateString();

          return (
            <button 
              key={idx} 
              onClick={() => onDayClick(date)}
              className={`h-9 flex items-center justify-center rounded-sm text-xs font-cinzel border transition-all hover:scale-110 active:scale-95 shadow-sm ${statusStyles} ${isToday ? 'ring-1 ring-[#b08d57] ring-offset-2 ring-offset-black' : ''}`}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarGrid;
