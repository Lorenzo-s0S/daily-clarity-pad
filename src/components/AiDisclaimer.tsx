import { AlertTriangle } from "lucide-react";

export function AiDisclaimer() {
  return (
    <div className="mt-8 flex items-start gap-2 rounded-lg border border-border/60 bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal" />
      <span>
        Responsible AI: AI-generated content may contain errors — please review before use.
      </span>
    </div>
  );
}
