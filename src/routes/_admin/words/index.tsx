import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { TableControls } from "@/components/TableControls";
import { exportCsv } from "@/lib/csv";
import { Trash2, Brain } from "lucide-react";
import { STATUS_VARIANTS, STATUS_LABELS } from "./constants";
import { useAdminWords, LIMIT } from "./hooks/useAdminWords";

export default function AdminWordsPage() {
  const { rows, total, search, page, setSearch, setPage, deleteWord } =
    useAdminWords();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Vocabulario</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Todas las palabras guardadas en la plataforma
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Brain className="h-4 w-4" /> Vocabulario global
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TableControls
            search={search}
            onSearch={setSearch}
            page={page}
            total={total}
            limit={LIMIT}
            onPage={setPage}
            onExport={() =>
              exportCsv(
                "vocabulario",
                rows.map(
                  ({
                    id,
                    term,
                    translation,
                    language,
                    status,
                    createdAt,
                    ownerEmail,
                  }) => ({
                    id,
                    término: term,
                    traducción: translation,
                    idioma: language,
                    estado: status,
                    usuario: ownerEmail,
                    creado: createdAt,
                  }),
                ),
              )
            }
            placeholder="Buscar por término, traducción o usuario..."
          />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-left">
                  <th className="pb-2 font-medium">Término</th>
                  <th className="pb-2 font-medium">Traducción</th>
                  <th className="pb-2 font-medium">Idioma</th>
                  <th className="pb-2 font-medium">Estado</th>
                  <th className="pb-2 font-medium">Usuario</th>
                  <th className="pb-2 font-medium">Fecha</th>
                  <th className="pb-2 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((w) => (
                  <tr key={w.id}>
                    <td className="py-2.5 pr-3 font-medium">{w.term}</td>
                    <td className="py-2.5 pr-3 text-muted-foreground">
                      {w.translation || "—"}
                    </td>
                    <td className="py-2.5 pr-3 uppercase text-xs text-muted-foreground">
                      {w.language}
                    </td>
                    <td className="py-2.5 pr-3">
                      <Badge
                        variant={STATUS_VARIANTS[w.status]}
                        className="text-xs"
                      >
                        {STATUS_LABELS[w.status] || w.status}
                      </Badge>
                    </td>
                    <td className="py-2.5 pr-3 text-xs font-mono text-muted-foreground">
                      {w.ownerEmail || "—"}
                    </td>
                    <td className="py-2.5 pr-3 text-xs text-muted-foreground">
                      {new Date(w.createdAt).toLocaleDateString("es-ES")}
                    </td>
                    <td className="py-2.5">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              ¿Eliminar palabra?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Se eliminará <strong>{w.term}</strong>{" "}
                              permanentemente.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive hover:bg-destructive/90"
                              onClick={() => deleteWord(w.id)}
                            >
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">
                No hay palabras
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
