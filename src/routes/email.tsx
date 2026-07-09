import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Mail, Copy, RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { generateAiText } from "@/lib/ai.functions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/PageHeader";
import { AiDisclaimer } from "@/components/AiDisclaimer";

export const Route = createFileRoute("/email")({
  component: EmailPage,
});

const EMAIL_SYSTEM = `You are an expert professional communicator drafting workplace emails.

Your task: given a recipient context, purpose, key points, and desired tone, produce a complete, ready-to-send email.

Rules:
- Output MUST begin with exactly one line "Subject: <subject line>" and then a blank line, followed by the email body.
- Body should include a proper greeting, well-structured paragraphs, and a professional sign-off placeholder like "Best regards,\\n[Your name]".
- Match the requested tone precisely.
- Keep it concise but complete. Avoid filler, avoid clichés, avoid emojis unless friendly tone strongly warrants a single one.
- Do NOT include any commentary before or after the email. Output only the email.`;

function EmailPage() {
  const gen = useServerFn(generateAiText);
  const [recipient, setRecipient] = useState("");
  const [purpose, setPurpose] = useState("");
  const [points, setPoints] = useState("");
  const [tone, setTone] = useState("Formal");
  const [length, setLength] = useState("Medium");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  const lengthGuide: Record<string, string> = {
    Short: "Keep it brief: 2-3 short sentences, under 60 words total. Get straight to the point.",
    Medium: "Aim for a balanced email: 2-3 short paragraphs, roughly 80-150 words.",
    Long: "Write a thorough email: 3-5 paragraphs, roughly 200-350 words, with full context and detail.",
  };

  async function run() {
    if (!purpose.trim() && !points.trim()) {
      toast.error("Add a purpose or key points first.");
      return;
    }
    setLoading(true);
    try {
      const user = `Recipient context: ${recipient || "(not specified)"}
Purpose / topic: ${purpose || "(not specified)"}
Tone: ${tone}
Length: ${length} — ${lengthGuide[length]}
Key points to cover:
${points || "(none)"}`;
      const res = await gen({ data: { system: EMAIL_SYSTEM, user } });
      setOutput(res.content.trim());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate email");
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(output);
    toast.success("Copied to clipboard");
  }

  return (
    <div>
      <PageHeader
        icon={<Mail className="h-5 w-5" />}
        title="Smart Email Generator"
        description="Describe the situation and let AI draft a polished email."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="glass-card">
          <CardContent className="space-y-4 p-5">
            <div className="space-y-2">
              <Label htmlFor="recipient">Recipient context</Label>
              <Input
                id="recipient"
                placeholder="e.g. My professor Dr. Chen"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="purpose">Purpose / topic</Label>
              <Input
                id="purpose"
                placeholder="e.g. Request an extension on the ML assignment"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="points">Key points</Label>
              <Textarea
                id="points"
                rows={6}
                placeholder="- Was ill for 3 days\n- Need 48 more hours\n- Attach doctor's note"
                value={points}
                onChange={(e) => setPoints(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Tone</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Formal">Formal</SelectItem>
                  <SelectItem value="Friendly">Friendly</SelectItem>
                  <SelectItem value="Persuasive">Persuasive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={run} disabled={loading} className="w-full glow-primary">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {loading ? "Drafting…" : "Generate Email"}
            </Button>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="space-y-3 p-5">
            <div className="flex items-center justify-between">
              <Label className="text-base">AI Output</Label>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={copy}
                  disabled={!output}
                >
                  <Copy className="mr-1 h-3.5 w-3.5" /> Copy
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={run}
                  disabled={loading}
                >
                  <RefreshCw className="mr-1 h-3.5 w-3.5" /> Regenerate
                </Button>
              </div>
            </div>
            <Textarea
              rows={20}
              placeholder="Your generated email will appear here — edit freely before sending."
              value={output}
              onChange={(e) => setOutput(e.target.value)}
              className="font-mono text-sm"
            />
            <AiDisclaimer />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
