// import { Head } from "@inertiajs/react";
// import { useState, useEffect, useRef, useCallback, useMemo } from "react";
// import { publicApi } from "@/lib/api";
// import ThemeToggle from "@/Components/Common/ThemeToggle";
// import daskomIcon from "../../assets/daskom.svg";
// import alarmSound from "../../assets/sound/alarm.wav";

// const PHASE_SEQUENCE = [
//     { key: "preparation", label: "Preparation" },
//     { key: "ta", label: "TA" },
//     { key: "fitb_jurnal", label: "Jurnal" },
//     { key: "mandiri", label: "Mandiri" },
//     { key: "tk", label: "TK" },
//     { key: "feedback", label: "Feedback" },
// ];

// const STATUS_LABELS = {
//     running: "Running",
//     paused: "Paused",
//     completed: "Finished",
//     exited: "Stopped",
//     idle: "Not Yet Started",
// };

// const DK_OPTIONS = ["DK1", "DK2"];
// const MANUAL_TEMPLATES = [10, 20, 30, 60, 90];

// const formatDuration = (totalSeconds = 0) => {
//     const seconds = Math.max(0, Math.floor(totalSeconds));
//     const hours = Math.floor(seconds / 3600);
//     const minutes = Math.floor((seconds % 3600) / 60);
//     const secs = seconds % 60;
//     const pad = (v) => v.toString().padStart(2, "0");
//     if (hours > 0) {
//         return `${pad(hours)}:${pad(minutes)}:${pad(secs)}`;
//     }
//     return `${pad(minutes)}:${pad(secs)}`;
// };

// const getPhaseIndex = (phaseKey) =>
//     PHASE_SEQUENCE.findIndex((p) => p.key === phaseKey);

// const computeElapsedSeconds = (praktikum) => {
//     if (!praktikum?.started_at) {
//         return 0;
//     }
//     const startedAt = new Date(praktikum.started_at);
//     if (Number.isNaN(startedAt.getTime())) {
//         return 0;
//     }
//     if (praktikum.status === "running") {
//         return Math.max(0, Math.floor((Date.now() - startedAt.getTime()) / 1000));
//     }
//     if (praktikum.ended_at) {
//         const endedAt = new Date(praktikum.ended_at);
//         if (!Number.isNaN(endedAt.getTime())) {
//             return Math.max(0, Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000));
//         }
//     }
//     return Math.max(0, Math.floor((Date.now() - startedAt.getTime()) / 1000));
// };

// const computePhaseElapsedSeconds = (praktikum) => {
//     if (!praktikum) {
//         return 0;
//     }
//     const baseSeconds = Math.max(0, Number(praktikum.phase_elapsed_seconds ?? 0));
//     const phaseStartedAt = praktikum.phase_started_at
//         ? new Date(praktikum.phase_started_at)
//         : null;
//     if (
//         praktikum.status === "running" &&
//         phaseStartedAt &&
//         !Number.isNaN(phaseStartedAt.getTime())
//     ) {
//         const delta = Math.max(
//             0,
//             Math.floor((Date.now() - phaseStartedAt.getTime()) / 1000)
//         );
//         return baseSeconds + delta;
//     }
//     if (baseSeconds > 0) {
//         return baseSeconds;
//     }
//     return computeElapsedSeconds(praktikum);
// };

// // ─── Global Alarm Singleton ────────────────────────────────────────────────────
// const globalAudio = typeof window !== "undefined" ? new Audio(alarmSound) : null;
// if (globalAudio) {
//     globalAudio.loop = true;
// }

// function useAlarm() {
//     const isPlayingRef = useRef(false);
//     const [isPlaying, setIsPlaying] = useState(false);

//     const play = useCallback(() => {
//         if (globalAudio && !isPlayingRef.current) {
//             globalAudio.currentTime = 0;
//             globalAudio.play().catch(() => {});
//             isPlayingRef.current = true;
//             setIsPlaying(true);
//         }
//     }, []);

//     const stop = useCallback(() => {
//         if (globalAudio) {
//             globalAudio.pause();
//             globalAudio.currentTime = 0;
//             isPlayingRef.current = false;
//             setIsPlaying(false);
//         }
//     }, []);

//     return { play, stop, isPlaying };
// }

// // ─── Circular Progress Ring ────────────────────────────────────────────────────
// let circularProgressCounter = 0;

// function CircularProgress({ progress, size = 220, strokeWidth = 6, isRunning, children }) {
//     const [gradientId] = useState(() => `timerGradient-${++circularProgressCounter}`);
//     const radius = (size - strokeWidth) / 2;
//     const circumference = 2 * Math.PI * radius;
//     const offset = circumference - progress * circumference;

//     return (
//         <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
//             <svg width={size} height={size} className="absolute -rotate-90">
//                 <defs>
//                     <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
//                         <stop offset="0%" stopColor="var(--depth-color-primary)" />
//                         <stop offset="100%" stopColor="rgba(var(--depth-color-primary-rgb, 99,102,241), 0.5)" />
//                     </linearGradient>
//                 </defs>
//                 <circle
//                     cx={size / 2}
//                     cy={size / 2}
//                     r={radius}
//                     fill="none"
//                     stroke="currentColor"
//                     strokeWidth={strokeWidth}
//                     className="text-depth-secondary/15"
//                 />
//                 <circle
//                     cx={size / 2}
//                     cy={size / 2}
//                     r={radius}
//                     fill="none"
//                     stroke={`url(#${gradientId})`}
//                     strokeWidth={strokeWidth}
//                     strokeLinecap="round"
//                     strokeDasharray={circumference}
//                     strokeDashoffset={offset}
//                     className="transition-[stroke-dashoffset] duration-1000 ease-linear"
//                 />
//             </svg>
//             {isRunning && (
//                 <div
//                     className="absolute rounded-full animate-ping opacity-10"
//                     style={{ width: size - 20, height: size - 20, background: "var(--depth-color-primary)" }}
//                 />
//             )}
//             <div className="relative z-10 flex flex-col items-center justify-center">
//                 {children}
//             </div>
//         </div>
//     );
// }

// // ─── Alarm Popup ───────────────────────────────────────────────────────────────
// function AlarmPopup({ message, onDismiss }) {
//     return (
//         <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
//             <div className="mx-4 w-full max-w-lg animate-bounce-in rounded-depth-lg border border-depth bg-depth-card p-10 shadow-depth-lg">
//                 <div className="flex flex-col items-center gap-6 text-center">
//                     <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
//                         <div className="absolute inset-0 animate-ping rounded-full bg-red-400/30" />
//                         <svg className="relative h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
//                         </svg>
//                     </div>
//                     <h3 className="text-2xl font-bold text-depth-primary">Timer Alert</h3>
//                     <p className="text-base text-depth-secondary">{message}</p>
//                     <button
//                         type="button"
//                         onClick={onDismiss}
//                         className="mt-2 rounded-depth-md px-10 py-4 text-lg font-semibold text-white shadow-depth-md transition-all hover:-translate-y-0.5 hover:shadow-depth-lg"
//                         style={{
//                             background: "linear-gradient(135deg, rgba(239, 68, 68, 0.9), rgba(220, 38, 38, 0.9))",
//                         }}
//                     >
//                         Stop Alarm
//                     </button>
//                 </div>
//             </div>
//         </div>
//     );
// }

// // ─── DK Session Card ───────────────────────────────────────────────────────────
// function DkSessionCard({ praktikum }) {
//     const [totalSeconds, setTotalSeconds] = useState(0);
//     const [phaseSeconds, setPhaseSeconds] = useState(0);

//     useEffect(() => {
//         setTotalSeconds(computeElapsedSeconds(praktikum));
//         setPhaseSeconds(computePhaseElapsedSeconds(praktikum));
//     }, [praktikum]);

//     useEffect(() => {
//         if (praktikum?.status !== "running") {
//             return;
//         }
//         const id = setInterval(() => {
//             setTotalSeconds(computeElapsedSeconds(praktikum));
//             setPhaseSeconds(computePhaseElapsedSeconds(praktikum));
//         }, 1000);
//         return () => clearInterval(id);
//     }, [praktikum]);

//     const currentPhaseIndex = useMemo(() => {
//         if (!praktikum?.current_phase) {
//             return -1;
//         }
//         return getPhaseIndex(praktikum.current_phase);
//     }, [praktikum?.current_phase]);

//     const currentPhaseLabel = useMemo(() => {
//         if (!praktikum?.current_phase) {
//             return "";
//         }
//         const found = PHASE_SEQUENCE.find((p) => p.key === praktikum.current_phase);
//         return found?.label ?? praktikum.current_phase;
//     }, [praktikum?.current_phase]);

//     const statusLabel = STATUS_LABELS[praktikum?.status ?? "idle"] ?? STATUS_LABELS.idle;
//     const kelasName = praktikum?.kelas?.kelas ?? "-";
//     const modulName = praktikum?.modul?.judul ?? "-";
//     const pjName = praktikum?.pj
//         ? [praktikum.pj.nama, praktikum.pj.kode].filter(Boolean).join(" • ")
//         : "-";

//     const isRunning = praktikum?.status === "running";
//     const isPaused = praktikum?.status === "paused";

//     const phaseProgress = useMemo(() => {
//         if (currentPhaseIndex < 0) {
//             return 0;
//         }
//         return (currentPhaseIndex + 1) / PHASE_SEQUENCE.length;
//     }, [currentPhaseIndex]);

//     return (
//         <div className="rounded-depth-lg border border-depth bg-depth-card px-6 py-5 shadow-depth-md transition-all">
//             <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6">
//                 {/* Circle */}
//                 <div className="flex-shrink-0">
//                     <CircularProgress progress={phaseProgress} size={180} strokeWidth={6} isRunning={isRunning}>
//                         <div className="text-4xl font-bold tabular-nums text-depth-primary sm:text-5xl">
//                             {formatDuration(phaseSeconds)}
//                         </div>
//                         <p className="mt-1 text-[0.65rem] font-semibold uppercase tracking-wide text-depth-secondary">
//                             {currentPhaseLabel || "—"}
//                         </p>
//                     </CircularProgress>
//                 </div>

//                 {/* Info */}
//                 <div className="flex flex-1 flex-col items-center gap-3 sm:items-start sm:pt-2">
//                     <div className="flex flex-wrap items-center gap-2">
//                         <span className="text-base font-semibold text-depth-primary">
//                             {kelasName}
//                         </span>
//                         <span className="text-xs text-depth-secondary">•</span>
//                         <span className="text-base text-depth-secondary">{modulName}</span>
//                         <span
//                             className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
//                                 isRunning
//                                     ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
//                                     : isPaused
//                                       ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
//                                       : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
//                             }`}
//                         >
//                             {isRunning && (
//                                 <span className="relative flex h-2 w-2">
//                                     <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
//                                     <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
//                                 </span>
//                             )}
//                             {statusLabel}
//                         </span>
//                     </div>

//                     <p className="text-sm font-medium text-depth-secondary">
//                         Total: {formatDuration(totalSeconds)}
//                     </p>

//                     <div className="flex flex-wrap items-center gap-1.5">
//                         {PHASE_SEQUENCE.map((phase, index) => {
//                             const isCurrent = index === currentPhaseIndex;
//                             const isPast = currentPhaseIndex >= 0 && index < currentPhaseIndex;

//                             return (
//                                 <div
//                                     key={phase.key}
//                                     className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
//                                         isCurrent
//                                             ? "bg-[var(--depth-color-primary)] text-white shadow-depth-sm scale-105"
//                                             : isPast
//                                               ? "bg-depth-primary/10 text-depth-primary"
//                                               : "bg-depth-card text-depth-secondary border border-depth"
//                                     }`}
//                                 >
//                                     {isPast && (
//                                         <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
//                                         </svg>
//                                     )}
//                                     {isCurrent && isRunning && (
//                                         <span className="relative flex h-2 w-2">
//                                             <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
//                                             <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
//                                         </span>
//                                     )}
//                                     {phase.label}
//                                 </div>
//                             );
//                         })}
//                     </div>

//                     {pjName !== "-" && (
//                         <p className="text-sm text-depth-secondary">
//                             PJ: {pjName}
//                         </p>
//                     )}
//                 </div>
//             </div>
//         </div>
//     );
// }

// // ─── DK Tab Content ────────────────────────────────────────────────────────────
// function DkTabContent({ dk, sessions, onAlarm, isActive }) {
//     const prevStatesRef = useRef({});
//     const isActiveRef = useRef(isActive);
//     isActiveRef.current = isActive;

//     useEffect(() => {
//         const prevStates = prevStatesRef.current;

//         for (const session of sessions) {
//             const prev = prevStates[session.id];
//             const currentPhase = session.current_phase;
//             const currentStatus = session.status;

//             if (prev && isActiveRef.current) {
//                 if (prev.phase && prev.phase !== currentPhase) {
//                     const prevIndex = getPhaseIndex(prev.phase);
//                     const currentIndex = getPhaseIndex(currentPhase);
//                     if (currentIndex > prevIndex) {
//                         const kelasName = session.kelas?.kelas ?? "";
//                         const modulName = session.modul?.judul ?? "";
//                         const phaseLabel = PHASE_SEQUENCE.find((p) => p.key === currentPhase)?.label ?? currentPhase;
//                         onAlarm(`${dk} — ${kelasName} ${modulName} — Phase: ${phaseLabel}`);
//                     }
//                 }

//                 if (
//                     ["running", "paused"].includes(prev.status) &&
//                     !["running", "paused"].includes(currentStatus)
//                 ) {
//                     const kelasName = session.kelas?.kelas ?? "";
//                     onAlarm(`${dk} — ${kelasName} — ${STATUS_LABELS[currentStatus] ?? currentStatus}`);
//                 }
//             }

//             prevStates[session.id] = { phase: currentPhase, status: currentStatus };
//         }

//         prevStatesRef.current = prevStates;
//     }, [sessions, dk, onAlarm]);

//     if (sessions.length === 0) {
//         return (
//             <div className="flex flex-col items-center justify-center py-20">
//                 <svg className="mb-4 h-20 w-20 text-depth-secondary/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
//                 </svg>
//                 <p className="text-base text-depth-secondary">
//                     No active sessions for {dk}
//                 </p>
//             </div>
//         );
//     }

//     return (
//         <div className="grid gap-4">
//             {sessions.map((session) => (
//                 <DkSessionCard
//                     key={session.id}
//                     praktikum={session}
//                 />
//             ))}
//         </div>
//     );
// }

// // ─── Manual Timer ──────────────────────────────────────────────────────────────
// function ManualTimer({ onAlarm }) {
//     const [inputMinutes, setInputMinutes] = useState("");
//     const [inputHours, setInputHours] = useState("");
//     const [remainingSeconds, setRemainingSeconds] = useState(0);
//     const [initialSeconds, setInitialSeconds] = useState(0);
//     const [isTimerRunning, setIsTimerRunning] = useState(false);
//     const [isPaused, setIsPaused] = useState(false);
//     const intervalRef = useRef(null);

//     const clearTimer = useCallback(() => {
//         if (intervalRef.current) {
//             clearInterval(intervalRef.current);
//             intervalRef.current = null;
//         }
//     }, []);

//     const createInterval = useCallback(() => {
//         return setInterval(() => {
//             setRemainingSeconds((prev) => {
//                 if (prev <= 1) {
//                     clearInterval(intervalRef.current);
//                     intervalRef.current = null;
//                     setIsTimerRunning(false);
//                     setIsPaused(false);
//                     onAlarm("Manual timer has finished!");
//                     return 0;
//                 }
//                 return prev - 1;
//             });
//         }, 1000);
//     }, [onAlarm]);

//     const startTimer = useCallback(
//         (totalSeconds) => {
//             if (totalSeconds <= 0) {
//                 return;
//             }
//             clearTimer();
//             setRemainingSeconds(totalSeconds);
//             setInitialSeconds(totalSeconds);
//             setIsTimerRunning(true);
//             setIsPaused(false);
//             intervalRef.current = createInterval();
//         },
//         [clearTimer, createInterval]
//     );

//     const handleStartCustom = useCallback(() => {
//         const mins = parseInt(inputMinutes, 10) || 0;
//         const hrs = parseInt(inputHours, 10) || 0;
//         const total = hrs * 3600 + mins * 60;
//         startTimer(total);
//     }, [inputMinutes, inputHours, startTimer]);

//     const handlePauseResume = useCallback(() => {
//         if (isPaused) {
//             setIsPaused(false);
//             intervalRef.current = createInterval();
//         } else {
//             clearTimer();
//             setIsPaused(true);
//         }
//     }, [isPaused, clearTimer, createInterval]);

//     const handleReset = useCallback(() => {
//         clearTimer();
//         setIsTimerRunning(false);
//         setIsPaused(false);
//         setRemainingSeconds(0);
//         setInitialSeconds(0);
//     }, [clearTimer]);

//     useEffect(() => {
//         return () => clearTimer();
//     }, [clearTimer]);

//     const progress = initialSeconds > 0 ? remainingSeconds / initialSeconds : 0;

//     return (
//         <div className="flex flex-col items-center gap-6">
//             <div className="w-full rounded-depth-lg border border-depth bg-depth-card px-6 py-5 shadow-depth-lg">
//                 <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-center sm:gap-6">
//                     <div className="flex-shrink-0">
//                         <CircularProgress progress={progress} size={180} strokeWidth={6} isRunning={isTimerRunning && !isPaused}>
//                             <div className="text-4xl font-bold tabular-nums text-depth-primary sm:text-5xl">
//                                 {formatDuration(remainingSeconds)}
//                             </div>
//                             <p className="mt-1 text-[0.65rem] font-semibold uppercase tracking-wide text-depth-secondary">
//                                 {isTimerRunning
//                                     ? isPaused
//                                         ? "Paused"
//                                         : "Running"
//                                     : remainingSeconds === 0
//                                       ? "Set a timer"
//                                       : "Ready"}
//                             </p>
//                         </CircularProgress>
//                     </div>

//                     {isTimerRunning && (
//                         <div className="flex flex-wrap justify-center gap-3 sm:justify-start">
//                             <button
//                                 type="button"
//                                 onClick={handlePauseResume}
//                                 className="rounded-depth-md px-8 py-3 text-base font-semibold text-white shadow-depth-md transition-all hover:-translate-y-0.5 hover:shadow-depth-lg"
//                                 style={{
//                                     background: isPaused
//                                         ? "linear-gradient(135deg, rgba(34, 197, 94, 0.9), rgba(22, 163, 74, 0.9))"
//                                         : "linear-gradient(135deg, rgba(251, 191, 36, 0.9), rgba(245, 158, 11, 0.9))",
//                                 }}
//                             >
//                                 {isPaused ? "Resume" : "Pause"}
//                             </button>
//                             <button
//                                 type="button"
//                                 onClick={handleReset}
//                                 className="rounded-depth-md px-8 py-3 text-base font-semibold text-white shadow-depth-md transition-all hover:-translate-y-0.5 hover:shadow-depth-lg"
//                                 style={{
//                                     background: "linear-gradient(135deg, rgba(239, 68, 68, 0.9), rgba(220, 38, 38, 0.9))",
//                                 }}
//                             >
//                                 Reset
//                             </button>
//                         </div>
//                     )}
//                 </div>
//             </div>

//             {!isTimerRunning && (
//                 <div className="w-full space-y-4">
//                     <div className="rounded-depth-lg border border-depth bg-depth-card p-6 shadow-depth-md">
//                         <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-depth-secondary">
//                             Quick Start
//                         </h3>
//                         <div className="flex flex-wrap justify-center gap-3">
//                             {MANUAL_TEMPLATES.map((mins) => (
//                                 <button
//                                     key={mins}
//                                     type="button"
//                                     onClick={() => startTimer(mins * 60)}
//                                     className="rounded-depth-md border border-depth bg-depth-card px-6 py-3 text-base font-semibold text-depth-primary shadow-depth-sm transition-all hover:-translate-y-0.5 hover:shadow-depth-md"
//                                 >
//                                     {mins >= 60 ? `${mins / 60}h` : `${mins}m`}
//                                 </button>
//                             ))}
//                         </div>
//                     </div>

//                     <div className="rounded-depth-lg border border-depth bg-depth-card p-6 shadow-depth-md">
//                         <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-depth-secondary">
//                             Custom Timer
//                         </h3>
//                         <div className="flex items-end gap-3">
//                             <div className="flex-1">
//                                 <label
//                                     htmlFor="timer_hours"
//                                     className="mb-1 block text-xs text-depth-secondary"
//                                 >
//                                     Hours
//                                 </label>
//                                 <input
//                                     id="timer_hours"
//                                     type="number"
//                                     min="0"
//                                     max="23"
//                                     value={inputHours}
//                                     onChange={(e) => setInputHours(e.target.value)}
//                                     className="w-full rounded-depth-md border border-depth bg-depth-card p-3 text-base text-depth-primary shadow-depth-sm transition focus:border-[var(--depth-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:ring-offset-0"
//                                     placeholder="0"
//                                 />
//                             </div>
//                             <div className="flex-1">
//                                 <label
//                                     htmlFor="timer_minutes"
//                                     className="mb-1 block text-xs text-depth-secondary"
//                                 >
//                                     Minutes
//                                 </label>
//                                 <input
//                                     id="timer_minutes"
//                                     type="number"
//                                     min="0"
//                                     max="59"
//                                     value={inputMinutes}
//                                     onChange={(e) => setInputMinutes(e.target.value)}
//                                     className="w-full rounded-depth-md border border-depth bg-depth-card p-3 text-base text-depth-primary shadow-depth-sm transition focus:border-[var(--depth-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:ring-offset-0"
//                                     placeholder="0"
//                                 />
//                             </div>
//                             <button
//                                 type="button"
//                                 onClick={handleStartCustom}
//                                 disabled={
//                                     (parseInt(inputMinutes, 10) || 0) === 0 &&
//                                     (parseInt(inputHours, 10) || 0) === 0
//                                 }
//                                 className="rounded-depth-md px-8 py-3 text-base font-semibold text-white shadow-depth-md transition-all hover:-translate-y-0.5 hover:shadow-depth-lg disabled:cursor-not-allowed disabled:opacity-50"
//                                 style={{
//                                     background:
//                                         (parseInt(inputMinutes, 10) || 0) === 0 &&
//                                         (parseInt(inputHours, 10) || 0) === 0
//                                             ? undefined
//                                             : "linear-gradient(135deg, rgba(34, 197, 94, 0.9), rgba(22, 163, 74, 0.9))",
//                                 }}
//                             >
//                                 Start
//                             </button>
//                         </div>
//                     </div>
//                 </div>
//             )}
//         </div>
//     );
// }

// // ─── Main Page ─────────────────────────────────────────────────────────────────
// export default function PraktikumTimer() {
//     const [activeTab, setActiveTab] = useState("DK1");
//     const [sessions, setSessions] = useState({});
//     const [isLoading, setIsLoading] = useState(true);
//     const alarm = useAlarm();
//     const [popup, setPopup] = useState(null);

//     const handleAlarm = useCallback((message) => {
//         alarm.play();
//         setPopup(message);
//     }, [alarm]);

//     const handleDismiss = useCallback(() => {
//         alarm.stop();
//         setPopup(null);
//     }, [alarm]);

//     const groupByDk = useCallback((praktikums) => {
//         const grouped = {};
//         for (const dk of DK_OPTIONS) {
//             grouped[dk] = praktikums.filter((p) => p.dk === dk);
//         }
//         return grouped;
//     }, []);

//     const fetchActiveSessions = useCallback(async () => {
//         try {
//             const { data } = await publicApi.get("/api-v1/praktikum/active");
//             const praktikums = Array.isArray(data?.data) ? data.data : [];
//             setSessions(groupByDk(praktikums));
//         } catch {
//             setSessions({ DK1: [], DK2: [] });
//         } finally {
//             setIsLoading(false);
//         }
//     }, [groupByDk]);

//     // Initial fetch
//     useEffect(() => {
//         fetchActiveSessions();
//     }, [fetchActiveSessions]);

//     // WebSocket: listen for signal to refetch active sessions
//     useEffect(() => {
//         if (!window.Echo) {
//             return;
//         }

//         const channel = window.Echo.channel("praktikum.active-timer");

//         channel.listen(".ActivePraktikumUpdated", () => {
//             fetchActiveSessions();
//         });

//         return () => {
//             window.Echo.leave("praktikum.active-timer");
//         };
//     }, [fetchActiveSessions]);

//     const tabs = useMemo(
//         () =>
//             DK_OPTIONS.map((dk) => ({
//                 key: dk,
//                 label: dk.replace("DK", "DK "),
//                 count: (sessions[dk] ?? []).length,
//             })),
//         [sessions]
//     );

//     return (
//         <>
//             <Head title="Praktikum Timer" />
//             <div className="relative min-h-screen bg-depth-gradient">
//                 {popup && (
//                     <AlarmPopup message={popup} onDismiss={handleDismiss} />
//                 )}

//                 {/* Watermark */}
//                 <div className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center opacity-[0.04]">
//                     <img
//                         src={daskomIcon}
//                         alt=""
//                         className="h-[60vh] w-[60vh] max-w-none select-none"
//                         draggable="false"
//                     />
//                 </div>

//                 <div className="relative z-10 mx-auto max-w-6xl px-4 py-8">
//                     {/* Header */}
//                     <div className="mb-8 flex items-center justify-between">
//                         <div className="flex items-center gap-3">
//                             <img src={daskomIcon} alt="Daskom" className="h-8 w-8" />
//                             <h1 className="text-2xl font-bold text-depth-primary">Praktikum Timer</h1>
//                         </div>
//                         <ThemeToggle />
//                     </div>

//                     {/* DK Tabs */}
//                     <div className="mb-8 flex justify-center">
//                         <div className="inline-flex rounded-depth-lg border border-depth bg-depth-card p-1.5 shadow-depth-sm">
//                             {tabs.map((tab) => (
//                                 <button
//                                     key={tab.key}
//                                     type="button"
//                                     onClick={() => setActiveTab(tab.key)}
//                                     className={`relative flex items-center gap-2 rounded-depth-md px-7 py-3 text-base font-semibold transition-all ${
//                                         activeTab === tab.key
//                                             ? "bg-[var(--depth-color-primary)] text-white shadow-depth-sm"
//                                             : "text-depth-secondary hover:text-depth-primary"
//                                     }`}
//                                 >
//                                     {tab.label}
//                                     {tab.count > 0 && (
//                                         <span
//                                             className={`inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full px-2 text-xs font-bold ${
//                                                 activeTab === tab.key
//                                                     ? "bg-white/20 text-white"
//                                                     : "bg-depth-primary/10 text-depth-primary"
//                                             }`}
//                                         >
//                                             {tab.count}
//                                         </span>
//                                     )}
//                                 </button>
//                             ))}
//                         </div>
//                     </div>

//                     {/* DK Content */}
//                     <div className="min-h-[300px]">
//                         {isLoading && (
//                             <div className="flex items-center justify-center py-20">
//                                 <div className="flex flex-col items-center gap-3">
//                                     <div className="h-10 w-10 animate-spin rounded-full border-4 border-depth border-t-[var(--depth-color-primary)]" />
//                                     <p className="text-base text-depth-secondary">
//                                         Loading sessions...
//                                     </p>
//                                 </div>
//                             </div>
//                         )}

//                         {DK_OPTIONS.map((dk) => (
//                             <div key={dk} className={activeTab === dk && !isLoading ? "" : "hidden"}>
//                                 <DkTabContent
//                                     dk={dk}
//                                     sessions={sessions[dk] ?? []}
//                                     onAlarm={handleAlarm}
//                                     isActive={activeTab === dk}
//                                 />
//                             </div>
//                         ))}
//                     </div>

//                     {/* Manual Timer — always visible below DK content */}
//                     <div className="mt-10 border-t border-depth pt-10">
//                         <h2 className="mb-6 text-center text-xl font-bold text-depth-primary">Manual Timer</h2>
//                         <ManualTimer onAlarm={handleAlarm} />
//                     </div>
//                 </div>
//             </div>
//         </>
//     );
// }
