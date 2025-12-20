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
  RED = 'red',
  YELLOW = 'yellow',
  GREEN = 'green'
}