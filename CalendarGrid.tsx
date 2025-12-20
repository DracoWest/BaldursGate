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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
    <div className="bg-stone-900/30 p-4 rounded-xl border border-stone-800">
      <h3 className="text-xl font-cinzel text-[#b08d57] mb-4 text-center">{MONTH_NAMES[month]} {year}</h3>
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <div key={d} className="text-xs text-stone-600 font-bold">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {days.map((date, idx) => {
          if (!date) return <div key={idx} />;
          const dateStr = date.toISOString().split('T')[0];
          const status = dayStatusMap[dateStr] || DayStatus.NONE;
          let bgColor = "bg-rose-950/40 border-rose-500/20";
          if (status === DayStatus.GREEN) bgColor = "bg-emerald-900/60 border-emerald-400";
          if (status === DayStatus.YELLOW) bgColor = "bg-amber-800/60 border-amber-400";
          
          return (
            <div 
              key={idx} 
              onClick={() => onDayClick(date)}
              className={`h-10 flex items-center justify-center rounded cursor-pointer border transition-all hover:scale-110 ${bgColor}`}
            >
              {date.getDate()}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarGrid;