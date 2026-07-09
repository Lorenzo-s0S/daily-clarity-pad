import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ListChecks, Plus, X, Loader2, Sparkles, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";
import { generateAiText } from "@/lib/ai.functions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/PageHeader";
import { AiDisclaimer } from "@/components/AiDisclaimer";

export const Route = createFileRoute("/planner")({
  component: PlannerPage,
});

type Task = { id: string; text: string };
type ScheduleItem = {
  id: string;
  time: string;
  task: string;
  reason: string;
  done: boolean;
};

const PLANNER_SYSTEM = `You are an expert productivity coach for data programmers and students.

Given two lists of tasks (leftover from yesterday, and new for today), produce a prioritized, time-blocked schedule for the day.

Prioritization rules:
1. Leftover tasks from yesterday get slight priority bump (avoid slipping further).
2. Consider urgency (deadlines) and impact (blocking others / high learning value).
3. Group deep-focus tasks (coding, studying) in the morning; meetings/admin midday; lighter tasks late.
4. Include short breaks between deep-focus blocks (Pomodoro-friendly).
5. Assume the workday runs 9:00 to 17:30 unless the tasks imply otherwise.

Output MUST be strict JSON only, no prose, no markdown fences. Shape:
{
  "schedule": [
    { "time": "09:00 – 10:00", "task": "…", "reason": "why this now (1 short sentence)" }
  ]
}`;

function loadTasks(key: string): Task[] {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "[]");
  } catch {
    return [];
  }
}

function PlannerPage() {
  const gen = useServerFn(generateAiText);
  const [yesterday, setYesterday] = useState<Task[]>([]);
  const [today, setToday] = useState<Task[]>([]);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [newY, setNewY] = useState("");
  const [newT, setNewT] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setYesterday(loadTasks("planner:yesterday"));
    setToday(loadTasks("planner:today"));
    try {
      setSchedule(JSON.parse(localStorage.getItem("planner:schedule") ?? "[]"));
    } catch {
      /* */
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("planner:yesterday", JSON.stringify(yesterday));
  }, [yesterday]);
  useEffect(() => {
    localStorage.setItem("planner:today", JSON.stringify(today));
  }, [today]);
  useEffect(() => {
    localStorage.setItem("planner:schedule", JSON.stringify(schedule));
  }, [schedule]);

  function addTask(which: "y" | "t") {
    const text = which === "y" ? newY.trim() : newT.trim();
    if (!text) return;
    const t: Task = { id: crypto.randomUUID(), text };
    if (which === "y") {
      setYesterday((p) => [...p, t]);
      setNewY("");
    } else {
      setToday((p) => [...p, t]);
      setNewT("");
    }
  }

  function removeTask(which: "y" | "t", id: string) {
    if (which === "y") setYesterday((p) => p.filter((x) => x.id !== id));
    else setToday((p) => p.filter((x) => x.id !== id));
  }

  async function generate() {
    if (yesterday.length === 0 && today.length === 0) {
      toast.error("Add some tasks first.");
      return;
    }
    setLoading(true);
    try {
      const user = `Leftover from yesterday:
${yesterday.map((t) => "- " + t.text).join("\n") || "(none)"}

Tasks for today:
${today.map((t) => "- " + t.text).join("\n") || "(none)"}`;
      const res = await gen({ data: { system: PLANNER_SYSTEM, user } });
      const cleaned = res.content.replace(/^```json\s*|\s*```$/g, "").trim();
      const parsed = JSON.parse(cleaned) as { schedule: Array<{ time: string; task: string; reason: string }> };
      const items: ScheduleItem[] = parsed.schedule.map((s) => ({
        id: crypto.randomUUID(),
        time: s.time,
        task: s.task,
        reason: s.reason,
        done: false,
      }));
      setSchedule(items);
      toast.success("Schedule generated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate schedule");
    } finally {
      setLoading(false);
    }
  }

  function toggleDone(id: string) {
    setSchedule((p) => p.map((s) => (s.id === id ? { ...s, done: !s.done } : s)));
  }

  return (
    <div>
      <PageHeader
        icon={<ListChecks className="h-5 w-5" />}
        title="AI Task Planner"
        description="Capture your tasks. Get a time-blocked schedule with reasoning."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <TaskListCard
          title="Leftover from yesterday"
          tone="teal"
          tasks={yesterday}
          value={newY}
          onChange={setNewY}
          onAdd={() => addTask("y")}
          onRemove={(id) => removeTask("y", id)}
        />
        <TaskListCard
          title="Tasks for today"
          tone="primary"
          tasks={today}
          value={newT}
          onChange={setNewT}
          onAdd={() => addTask("t")}
          onRemove={(id) => removeTask("t", id)}
        />
      </div>

      <div className="mt-6 flex justify-center">
        <Button onClick={generate} disabled={loading} size="lg" className="glow-primary">
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          {loading ? "Planning…" : "Generate My Schedule"}
        </Button>
      </div>

      {schedule.length > 0 && (
        <Card className="glass-card mt-8">
          <CardContent className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Today's schedule</h2>
              <Button size="sm" variant="ghost" onClick={() => setSchedule([])}>Clear</Button>
            </div>
            <ol className="space-y-3">
              {schedule.map((s) => (
                <li
                  key={s.id}
                  className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/30 p-3"
                >
                  <Checkbox
                    checked={s.done}
                    onCheckedChange={() => toggleDone(s.id)}
                    className="mt-1"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="rounded bg-primary/15 px-2 py-0.5 text-xs font-mono text-primary">
                        {s.time}
                      </span>
                      <span className={"font-medium " + (s.done ? "line-through text-muted-foreground" : "")}>
                        {s.task}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      <span className="text-teal">Why:</span> {s.reason}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
            <AiDisclaimer />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function TaskListCard({
  title,
  tone,
  tasks,
  value,
  onChange,
  onAdd,
  onRemove,
}: {
  title: string;
  tone: "teal" | "primary";
  tasks: Task[];
  value: string;
  onChange: (v: string) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
}) {
  return (
    <Card className="glass-card">
      <CardContent className="p-5">
        <Label className={"text-base " + (tone === "teal" ? "text-teal" : "text-primary")}>
          {title}
        </Label>
        <div className="mt-3 flex gap-2">
          <Input
            placeholder="Add a task…"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onAdd();
              }
            }}
          />
          <Button onClick={onAdd} size="icon" variant="secondary">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <ul className="mt-3 space-y-1.5">
          {tasks.length === 0 && (
            <li className="text-xs text-muted-foreground">No tasks yet.</li>
          )}
          {tasks.map((t) => (
            <li
              key={t.id}
              className="group flex items-center justify-between gap-2 rounded-md bg-muted/40 px-3 py-2 text-sm"
            >
              <span className="truncate">{t.text}</span>
              <button
                onClick={() => onRemove(t.id)}
                className="text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:text-destructive"
                aria-label="Remove"
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
