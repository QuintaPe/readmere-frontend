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
import { Trash2, Layers } from "lucide-react";
import { useAdminDecks, LIMIT } from "./hooks/useAdminDecks";

export default function AdminDecksPage() {
  const { rows, total, search, page, setSearch, setPage, deleteDeck } =
    useAdminDecks();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mazos</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Todos los mazos de flashcards de la plataforma
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Layers className="h-4 w-4" /> Mazos globales
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
                "mazos",
                rows.map(
                  ({
                    id,
                    name,
                    description,
                    wordCount,
                    createdAt,
                    ownerEmail,
                  }) => ({
                    id,
                    nombre: name,
                    descripción: description,
                    palabras: wordCount,
                    usuario: ownerEmail,
                    creado: createdAt,
                  }),
                ),
              )
            }
            placeholder="Buscar por nombre o usuario..."
          />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-left">
                  <th className="pb-2 font-medium">Mazo</th>
                  <th className="pb-2 font-medium">Descripción</th>
                  <th className="pb-2 font-medium">Palabras</th>
                  <th className="pb-2 font-medium">Usuario</th>
                  <th className="pb-2 font-medium">Fecha</th>
                  <th className="pb-2 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((d) => (
                  <tr key={d.id}>
                    <td className="py-2.5 pr-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-3 w-3 rounded-full shrink-0"
                          style={{ backgroundColor: d.color }}
                        />
                        <span className="font-medium">{d.name}</span>
                      </div>
                    </td>
                    <td className="py-2.5 pr-3 text-muted-foreground max-w-[180px] truncate text-xs">
                      {d.description || "—"}
                    </td>
                    <td className="py-2.5 pr-3 text-sm font-medium">
                      {d.wordCount}
                    </td>
                    <td className="py-2.5 pr-3 text-xs font-mono text-muted-foreground">
                      {d.ownerEmail || "—"}
                    </td>
                    <td className="py-2.5 pr-3 text-xs text-muted-foreground">
                      {new Date(d.createdAt).toLocaleDateString("es-ES")}
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
                            <AlertDialogTitle>¿Eliminar mazo?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Se eliminará <strong>{d.name}</strong> y todas sus
                              palabras asociadas.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive hover:bg-destructive/90"
                              onClick={() => deleteDeck(d.id)}
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
                No hay mazos
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
