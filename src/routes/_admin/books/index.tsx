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
import { Trash2, Library } from "lucide-react";
import { LANG_LABELS } from "./constants";
import { useAdminBooks, LIMIT } from "./hooks/useAdminBooks";

export default function AdminBooksPage() {
  const { rows, total, search, page, setSearch, setPage, deleteBook } =
    useAdminBooks();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Libros</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Todos los libros subidos a la plataforma
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Library className="h-4 w-4" /> Biblioteca global
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
                "libros",
                rows.map(
                  ({
                    id,
                    title,
                    author,
                    language,
                    progress,
                    createdAt,
                    ownerEmail,
                  }) => ({
                    id,
                    título: title,
                    autor: author,
                    idioma: language,
                    progreso: `${Math.round(progress * 100)}%`,
                    usuario: ownerEmail,
                    creado: createdAt,
                  }),
                ),
              )
            }
            placeholder="Buscar por título, autor o usuario..."
          />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-left">
                  <th className="pb-2 font-medium">Título</th>
                  <th className="pb-2 font-medium">Autor</th>
                  <th className="pb-2 font-medium">Idioma</th>
                  <th className="pb-2 font-medium">Progreso</th>
                  <th className="pb-2 font-medium">Usuario</th>
                  <th className="pb-2 font-medium">Fecha</th>
                  <th className="pb-2 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((b) => (
                  <tr key={b.id}>
                    <td className="py-2.5 pr-3 font-medium max-w-[180px] truncate">
                      {b.title}
                    </td>
                    <td className="py-2.5 pr-3 text-muted-foreground max-w-[130px] truncate text-xs">
                      {b.author || "—"}
                    </td>
                    <td className="py-2.5 pr-3">
                      <Badge variant="outline" className="text-xs">
                        {LANG_LABELS[b.language] || b.language}
                      </Badge>
                    </td>
                    <td className="py-2.5 pr-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-14 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{
                              width: `${Math.round(b.progress * 100)}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {Math.round(b.progress * 100)}%
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 pr-3 text-xs font-mono text-muted-foreground">
                      {b.ownerEmail || "—"}
                    </td>
                    <td className="py-2.5 pr-3 text-xs text-muted-foreground">
                      {new Date(b.createdAt).toLocaleDateString("es-ES")}
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
                              ¿Eliminar libro?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Se eliminará <strong>{b.title}</strong>{" "}
                              permanentemente.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive hover:bg-destructive/90"
                              onClick={() => deleteBook(b.id)}
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
                No hay libros
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
