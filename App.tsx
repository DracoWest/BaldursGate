import React, { useState, useEffect, useMemo } from 'react';
import GatekeeperCat from "./components/GatekeeperCat";
import { AvailabilitySubmission, DayStatus } from './types';
import CalendarGrid from './components/CalendarGrid';
import SubmissionModal from './components/SubmissionModal';
import { CHARACTER_NAMES } from './constants';
import { supabase } from './supabaseClient';

// --- PASSWORD CONFIGURATION ---
const SITE_PASSCODE = 'karaisqueen';
// ------------------------------

// --- YEAR LOCK ---
const TARGET_YEAR = 2026;
// ----------------

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passcodeInput, setPasscodeInput] = useState('');
  const [passcodeError, setPasscodeError] = useState(false);

  const [submissions, setSubmissions] = useState<AvailabilitySubmission[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Gatekeeper event helper (talks to the GatekeeperCat component)
  const gate = (state: "idle" | "typing" | "success" | "fail") => {
    window.dispatchEvent(
      new CustomEvent("dracowest:gatekeeper", { detail: { state } })
    );
  };

  useEffect(() => {
    const session = localStorage.getItem('dracowest_auth');
    if (session === 'true') setIsAuthenticated(true);
  }, []);

  const handlePasscodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (passcodeInput === SITE_PASSCODE) {
      setIsAuthenticated(true);
      localStorage.setItem('dracowest_auth', 'true');
      gate("success");
      setPasscodeError(false);

      // Let the success animation play before switching screens
      setTimeout(() => {
        setIsAuthenticated(true);
        localStorage.setItem('dracowest_auth', 'true');
      }, 650);
    } else {
      gate("fail");

      setPasscodeError(true);
      setPasscodeInput('');
      setTimeout(() => setPasscodeError(false), 2000);

      setTimeout(() => {
        setPasscodeError(false);
        gate("idle");
      }, 1200);
    }
  };

  const is2026DateString = (dateStr: string) => {
    // expects YYYY-MM-DD
    return typeof dateStr === 'string' && dateStr.startsWith(`${TARGET_YEAR}-`);
  };

  const is2026Date = (d: Date) => d.getFullYear() === TARGET_YEAR;

  const fetchSubmissions = async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const { data, error } = await supabase.from('availability').select('*');
      if (error) throw error;

      if (data) {
        const mappedData = data.map((item: any) => ({
          id: item.id || Math.random().toString(36).substr(2, 9),
          name: item.name,
          date: item.date,
          timezone: item.timezone || 'UTC',
          isAllDay: item.is_all_day ?? item.isAllDay ?? item.isallday ?? true,
          startTime: item.start_time ?? item.startTime ?? item.starttime ?? '00:00',
          endTime: item.end_time ?? item.endTime ?? item.endtime ?? '23:59',
          comments: item.comments || ''
        })) as AvailabilitySubmission[];

        // ✅ HARD FILTER: only keep 2026 entries
        const only2026 = mappedData.filter(s => is2026DateString(s.date));
        setSubmissions(only2026);
      }
    } catch (e: any) {
      console.error('Fetch error:', e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchSubmissions();
