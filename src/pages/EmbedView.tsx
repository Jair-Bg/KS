import { useParams } from "react-router-dom";

export default function EmbedView() {
  const { id } = useParams<{ id: string }>();
  return (
    <div className="bg-transparent p-2">
      <div className="rounded-xl border border-primary/20 bg-card overflow-hidden p-4 text-sm text-muted-foreground">
        Market embed unavailable (id: {id ?? "—"}).
      </div>
    </div>
  );
}
