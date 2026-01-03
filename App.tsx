import React, { useState, useEffect, useMemo } from 'react';
import GatekeeperCat from "./components/GatekeeperCat";
import { AvailabilitySubmission, DayStatus } from './types';
import CalendarGrid from './components/CalendarGrid';
import SubmissionModal from './components/SubmissionModal';
@@ -24,21 +25,41 @@ const App: React.FC = () => {
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

@@ -194,6 +215,9 @@ const App: React.FC = () => {
  }, [submissions]);

  if (!isAuthenticated) {
    // Ensure idle cat when landing here
    gate("idle");

    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0c] px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
@@ -231,7 +255,13 @@ const App: React.FC = () => {
              type="password"
              placeholder="Enter Secret Incantation"
              value={passcodeInput}
              onChange={(e) => setPasscodeInput(e.target.value)}
              onChange={(e) => {
                const v = e.target.value;
                setPasscodeInput(v);

                if (v.length === 0) gate("idle");
                else gate("typing");
              }}
              className={`w-full bg-stone-900/50 border-b-2 py-4 px-2 text-center text-xl font-cinzel tracking-[0.2em] outline-none transition-all duration-500
                ${passcodeError ? 'border-rose-500 text-rose-500 animate-shake' : 'border-stone-800 text-[#b08d57] focus:border-[#b08d57] focus:bg-stone-900'}
              `}
@@ -243,6 +273,14 @@ const App: React.FC = () => {
            >
              SPEAK INCANTATION
            </button>

            {/* Gatekeeper Cat UNDER the button */}
            <GatekeeperCat
              idleSrc="/gate/idle.png"
              successSrc="/gate/granted.png"
              failSrc="/gate/denied.png"
              enableSound={false}
            />
          </form>
        </div>
      </div>
@@ -334,7 +372,6 @@ const App: React.FC = () => {
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleAddSubmission}
          existingSubmissions={submissions.filter(s => s.date === selectedDateStr)}
          // ✅ NEW PROP
          onDelete={handleDeleteSubmission}
        />
      )}
