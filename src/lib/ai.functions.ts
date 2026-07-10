import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const EMAIL_SYSTEM = `You are an expert professional communicator drafting workplace emails.

Your task: given a recipient context, purpose, key points, and desired tone, produce a complete, ready-to-send email.

Rules:
- Output MUST begin with exactly one line "Subject: <subject line>" and then a blank line, followed by the email body.
- Body should include a proper greeting, well-structured paragraphs, and a professional sign-off placeholder like "Best regards,\\n[Your name]".
- Match the requested tone precisely.
- Keep it concise but complete. Avoid filler, avoid clichés, avoid emojis unless friendly tone strongly warrants a single one.
- Do NOT include any commentary before or after the email. Output only the email.`;

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

const SYSTEMS = {
  email: EMAIL_SYSTEM,
  planner: PLANNER_SYSTEM,
  research: RESEARCH_SYSTEM,
} as const;

const InputSchema = z.object({
  kind: z.enum(["email", "planner", "research"]),
  user: z.string().min(1).max(8000),
});

export const generateAiText = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) {
      throw new Error("Missing LOVABLE_API_KEY");
    }

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEMS[data.kind] },
          { role: "user", content: data.user },
        ],
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      if (res.status === 429) {
        throw new Error("Rate limit reached. Please try again in a moment.");
      }
      if (res.status === 402) {
        throw new Error("AI credits exhausted. Add credits in your workspace billing.");
      }
      throw new Error(`AI request failed (${res.status}): ${text.slice(0, 200)}`);
    }

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = json.choices?.[0]?.message?.content ?? "";
    return { content };
  });
