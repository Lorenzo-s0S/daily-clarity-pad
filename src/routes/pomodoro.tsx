import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Timer, Play, Pause, RotateCcw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";

export const Route = createFileRoute("/pomodoro")({
  component: PomodoroPage,
});

type Mode = "50/10" | "25/5";
type Phase = "work" | "break";

const DURATIONS: Record<Mode, { work: number; break: number }> = {
  "50/10": { work: 50 * 60, break: 10 * 60 },
  "25/5": { work: 25 * 60, break: 5 * 60 },
};

function PomodoroPage() {
  const [mode, setMode] = useState<Mode>("25/5");
  const [phase, setPhase] = useState<Phase>("work");
  const [remaining, setRemaining] = useState(DURATIONS["25/5"].work);
  const [running, setRunning] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const lastBeepRef = useRef<number>(-1);

  const total = DURATIONS[mode][phase];

  const getCtx = useCallback(() => {
    if (typeof window === "undefined") return null;
    if (!audioCtxRef.current) {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (Ctor) audioCtxRef.current = new Ctor();
    }
    return audioCtxRef.current;
  }, []);

  const beep = useCallback(
    (freq: number, duration = 0.25, gain = 0.15) => {
      const ctx = getCtx();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      g.gain.value = 0;
      g.gain.linearRampToValueAtTime(gain, ctx.currentTime + 0.02);
      g.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);
      osc.connect(g).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration + 0.05);
    },
    [getCtx],
  );

  const playStartChime = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume();
    beep(523.25, 0.18);
    setTimeout(() => beep(659.25, 0.18), 160);
    setTimeout(() => beep(783.99, 0.22), 320);
  }, [beep, getCtx]);

  // Reset when mode changes
  useEffect(() => {
    setPhase("work");
    setRemaining(DURATIONS[mode].work);
    setRunning(false);
    lastBeepRef.current = -1;
  }, [mode]);

  // Tick
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setRemaining((r) => {
        const next = r - 1;
        // last-5-seconds gentle alert (each of last 5 seconds)
        if (next > 0 && next <= 5 && lastBeepRef.current !== next) {
          lastBeepRef.current = next;
          beep(660, 0.18, 0.12);
        }
        if (next <= 0) {
          // phase switch
          const nextPhase: Phase = phase === "work" ? "break" : "work";
          setPhase(nextPhase);
          lastBeepRef.current = -1;
          // longer completion tone
          beep(880, 0.35, 0.18);
          setTimeout(() => beep(1174.66, 0.35, 0.18), 250);
          return DURATIONS[mode][nextPhase];
        }
        return next;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [running, phase, mode, beep]);

  // Persist status for dashboard
  useEffect(() => {
    const label = !running ? "Idle" : phase === "work" ? "Focus" : "Break";
    localStorage.setItem("pomodoro:status", label);
  }, [running, phase]);

  function toggle() {
    if (!running) {
      playStartChime();
      setRunning(true);
    } else {
      setRunning(false);
    }
  }

  function reset() {
    setRunning(false);
    setPhase("work");
    setRemaining(DURATIONS[mode].work);
    lastBeepRef.current = -1;
  }

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const progress = 1 - remaining / total;
  const isWork = phase === "work";
  const ringColor = isWork ? "var(--primary)" : "var(--teal)";
  const trackColor = "color-mix(in oklab, var(--border) 50%, transparent)";

  const size = 280;
  const stroke = 14;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);

  return (
    <div>
      <PageHeader
        icon={<Timer className="h-5 w-5" />}
        title="Pomodoro Timer"
        description="Deep-focus intervals with gentle audio cues."
      />

      <Card className="glass-card">
        <CardContent className="p-6 sm:p-10">
          <div className="mb-6 flex items-center justify-center gap-2">
            {(["25/5", "50/10"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={
                  "rounded-full border px-4 py-1.5 text-sm transition " +
                  (mode === m
                    ? "border-primary bg-primary text-primary-foreground glow-primary"
                    : "border-border bg-muted/40 text-muted-foreground hover:text-foreground")
                }
              >
                {m}
              </button>
            ))}
          </div>

          <div className="flex flex-col items-center">
            <div className="relative" style={{ width: size, height: size }}>
              <svg width={size} height={size} className="-rotate-90">
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke={trackColor}
                  strokeWidth={stroke}
                  fill="none"
                />
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke={ringColor}
                  strokeWidth={stroke}
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  style={{ transition: "stroke-dashoffset 0.8s linear, stroke 0.4s ease" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span
                  className={
                    "text-xs uppercase tracking-[0.2em] " +
                    (isWork ? "text-primary" : "text-teal")
                  }
                >
                  {isWork ? "Focus" : "Break"}
                </span>
                <span className="mt-2 font-mono text-6xl font-semibold tabular-nums">
                  {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
                </span>
                <span className="mt-2 text-xs text-muted-foreground">Mode {mode}</span>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <Button
                onClick={toggle}
                size="lg"
                className={
                  isWork
                    ? "glow-primary min-w-32"
                    : "min-w-32 bg-teal text-teal-foreground hover:bg-teal/90 glow-teal"
                }
              >
                {running ? (
                  <>
                    <Pause className="mr-2 h-4 w-4" /> Pause
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" /> Start
                  </>
                )}
              </Button>
              <Button onClick={reset} size="lg" variant="outline">
                <RotateCcw className="mr-2 h-4 w-4" /> Reset
              </Button>
            </div>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              A soft ascending chime plays when the timer starts. A gentle beep sounds during the
              last 5 seconds of each interval.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
