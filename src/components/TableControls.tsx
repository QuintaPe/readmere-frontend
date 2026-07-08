import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import { useEffect, useState } from "react";

interface Props {
  search: string;
  onSearch: (v: string) => void;
  page: number;
  total: number;
  limit: number;
  onPage: (p: number) => void;
  onExport?: () => void;
  placeholder?: string;
}

export function TableControls({
  search,
  onSearch,
  page,
  total,
  limit,
  onPage,
  onExport,
  placeholder = "Buscar...",
}: Props) {
  const [draft, setDraft] = useState(search);
  const totalPages = Math.ceil(total / limit);

  useEffect(() => {
    const t = setTimeout(() => onSearch(draft), 300);
    return () => clearTimeout(t);
  }, [draft]);

  return (
    <div className="flex items-center justify-between gap-3 mb-4">
      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={placeholder}
        className="h-8 max-w-xs text-sm"
      />
      <div className="flex items-center gap-2">
        {onExport && (
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 text-xs"
            onClick={onExport}
          >
            <Download className="h-3.5 w-3.5" />
            CSV
          </Button>
        )}
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {total} resultados
        </span>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-xs text-muted-foreground">
          {page}/{Math.max(1, totalPages)}
        </span>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0"
          disabled={page >= totalPages}
          onClick={() => onPage(page + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
