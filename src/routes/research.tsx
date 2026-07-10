import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { BookOpen, Copy, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { generateAiText } from "@/lib/ai.functions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/PageHeader";
import { AiDisclaimer } from "@/components/AiDisclaimer";

export const Route = createFileRoute("/research")({
  component: ResearchPage,
});

const RESEARCH_SYSTEM = `You are a sharp research assistant for a data programmer / student. You produce concise, actionable briefings.

Given a topic, article text, URL, or specific question, plus a context (Data/Programming, Study/Coursework, or General Work), you MUST:

1. Write a 3-5 sentence "summary" tailored to the given context (skip general fluff; go straight to what matters for that context).
2. Extract 3-5 "insights" — each a single crisp sentence starting with a strong verb, scoped to the context (e.g. for Data/Programming, prefer technical/practical takeaways; for Study, prefer conceptual understanding + study strategy; for General Work, prefer decision-oriented takeaways).
3. Suggest 2-3 "next_steps" the user could take right now.

Output MUST be strict JSON only, no prose, no markdown fences. Shape:
{
  "summary": "…",
  "insights": ["…", "…"],
  "next_steps": ["…", "…"]
}

If a URL is given but you cannot access it, use the topic implied by the URL and note it in the summary.`;

type Result = { summary: string; insights: string[]; next_steps: string[] };

function ResearchPage() {
  const gen = useServerFn(generateAiText);
  const [input, setInput] = useState("");
  const [context, setContext] = useState("Data/Programming");
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);

  async function run() {
    if (!input.trim()) {
      toast.error("Add a topic, question, URL, or text.");
      return;
    }
    setLoading(true);
    try {
      const user = `Context: ${context}

Input:
${input}`;
      const res = await gen({ data: { kind: "research", user } });
      const cleaned = res.content.replace(/^```json\s*|\s*```$/g, "").trim();
      const parsed = JSON.parse(cleaned) as Result;
      setResult(parsed);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate briefing");
    } finally {
      setLoading(false);
    }
  }

  async function copyAll() {
    if (!result) return;
    const text = `Summary\n${result.summary}\n\nKey insights\n${result.insights
      .map((i, n) => `${n + 1}. ${i}`)
      .join("\n")}\n\nNext steps\n${result.next_steps.map((i, n) => `${n + 1}. ${i}`).join("\n")}`;
    await navigator.clipboard.writeText(text);
    toast.success("Copied");
  }

  return (
    <div>
      <PageHeader
        icon={<BookOpen className="h-5 w-5" />}
        title="AI Research Assistant"
        description="Paste a topic, question, article or URL. Get a focused briefing."
      />

      <Card className="glass-card">
        <CardContent className="space-y-4 p-5">
          <div className="grid gap-4 sm:grid-cols-[1fr_240px]">
            <div className="space-y-2">
              <Label htmlFor="input">Topic / question / text / URL</Label>
              <Textarea
                id="input"
                rows={6}
                placeholder="e.g. Explain vector databases and when to use them vs Postgres pgvector"
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Context</Label>
              <Select value={context} onValueChange={setContext}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Data/Programming">Data / Programming</SelectItem>
                  <SelectItem value="Study/Coursework">Study / Coursework</SelectItem>
                  <SelectItem value="General Work">General Work</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={run} disabled={loading} className="w-full glow-primary">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                {loading ? "Researching…" : "Generate"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {result && (
        <div className="mt-6 space-y-4">
          <Card className="glass-card">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-primary">Summary</h3>
                <Button size="sm" variant="outline" onClick={copyAll}>
                  <Copy className="mr-1 h-3.5 w-3.5" /> Copy all
                </Button>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-foreground/90">{result.summary}</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-5">
              <h3 className="text-base font-semibold text-teal">Key insights</h3>
              <ul className="mt-3 space-y-2">
                {result.insights.map((i, n) => (
                  <li key={n} className="flex gap-3 text-sm">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-teal/15 text-xs font-semibold text-teal">
                      {n + 1}
                    </span>
                    <span>{i}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-5">
              <h3 className="text-base font-semibold text-primary">Next steps</h3>
              <ul className="mt-3 space-y-2">
                {result.next_steps.map((i, n) => (
                  <li key={n} className="flex gap-3 text-sm">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                      →
                    </span>
                    <span>{i}</span>
                  </li>
                ))}
              </ul>
              <AiDisclaimer />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
