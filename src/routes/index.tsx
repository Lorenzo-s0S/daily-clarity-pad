import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Mail, ListChecks, BookOpen, Timer, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import logoAsset from "@/assets/logo.png.asset.json";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

type Task = { id: string; text: string; done: boolean };

function Dashboard() {
  const [taskCount, setTaskCount] = useState(0);
  const [scheduleCount, setScheduleCount] = useState(0);
  const [timerState, setTimerState] = useState<string>("Idle");

  useEffect(() => {
    try {
      const today = JSON.parse(localStorage.getItem("planner:today") ?? "[]") as Task[];
      const yest = JSON.parse(localStorage.getItem("planner:yesterday") ?? "[]") as Task[];
      const sched = JSON.parse(localStorage.getItem("planner:schedule") ?? "[]") as Task[];
      setTaskCount(today.length + yest.length);
      setScheduleCount(sched.filter((s) => !s.done).length);
      const t = localStorage.getItem("pomodoro:status");
      if (t) setTimerState(t);
    } catch {
      /* ignore */
    }
  }, []);

  const tools = [
    { title: "Smart Email Generator", desc: "Draft professional emails in seconds.", to: "/email", icon: Mail, accent: "primary" as const },
    { title: "Task Planner", desc: "AI-prioritized daily schedule.", to: "/planner", icon: ListChecks, accent: "teal" as const },
    { title: "Research Assistant", desc: "Summaries + key insights.", to: "/research", icon: BookOpen, accent: "primary" as const },
    { title: "Pomodoro Timer", desc: "Deep-focus intervals with gentle alerts.", to: "/pomodoro", icon: Timer, accent: "teal" as const },
  ];

  return (
    <div>
      <div className="mb-8 flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:text-left">
        <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary/20 to-teal/20 p-3 glow-primary">
          <img src={logoAsset.url} alt="AI Workplace logo" width={64} height={64} className="h-full w-full object-contain" />
        </div>
        <div className="min-w-0">
          <h1 className="text-3xl font-semibold tracking-tight">AI Workplace</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your AI-powered command center for a productive workday.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard label="Tasks tracked" value={taskCount} sub="Yesterday + today" />
        <SummaryCard label="Schedule items open" value={scheduleCount} sub="Awaiting completion" accent="teal" />
        <SummaryCard label="Timer" value={timerState} sub="Pomodoro status" />
      </div>

      <h2 className="mt-10 mb-3 text-lg font-semibold">Quick access</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {tools.map((t) => (
          <Card key={t.to} className="glass-card group transition hover:-translate-y-0.5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <span
                  className={
                    "grid h-9 w-9 place-items-center rounded-lg " +
                    (t.accent === "primary"
                      ? "bg-primary/15 text-primary"
                      : "bg-teal/15 text-teal")
                  }
                >
                  <t.icon className="h-4 w-4" />
                </span>
                {t.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{t.desc}</p>
              <Button asChild variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/10">
                <Link to={t.to}>
                  Open <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  sub,
  accent = "primary",
}: {
  label: string;
  value: number | string;
  sub: string;
  accent?: "primary" | "teal";
}) {
  return (
    <Card className="glass-card">
      <CardContent className="p-5">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
        <div
          className={
            "mt-1 text-3xl font-semibold " +
            (accent === "teal" ? "text-teal" : "text-foreground")
          }
        >
          {value}
        </div>
        <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
      </CardContent>
    </Card>
  );
}
