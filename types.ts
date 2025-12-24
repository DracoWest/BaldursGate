export type CharacterName = 'Draco' | 'Chambo' | 'Chester' | 'Fry' | 'Hops' | 'Snowy';

export interface AvailabilitySubmission {
  id: string;
  name: CharacterName;
  date: string;
  timezone: string;
  isAllDay: boolean;
  startTime: string;
  endTime: string;
  comments?: string;
}

export enum DayStatus {
  NONE = 'none',
  ORANGE = 'orange', // 1-5 members
  YELLOW = 'yellow', // 6 members, limited
  GREEN = 'green'    // 6 members, all day
}
