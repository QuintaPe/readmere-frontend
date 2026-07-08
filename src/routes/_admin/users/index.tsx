import { Link } from "react-router-dom";
import { useAdminAuth } from "@/auth/auth-context";
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
import {
  Users,
  Trash2,
  UserX,
  UserCheck,
  Shield,
  Eye,
  LogIn,
} from "lucide-react";
import CreateUserDialog from "./components/CreateUserDialog";
import { useAdminUsers, LIMIT } from "./hooks/useAdminUsers";

export default function AdminUsersPage() {
  const { user } = useAdminAuth();
  const {
    rows,
    total,
    search,
    page,
    setSearch,
    setPage,
    toggleRole,
    toggleStatus,
    deleteUser,
    impersonate,
    invalidate,
  } = useAdminUsers();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Usuarios</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestión de cuentas de usuario
          </p>
        </div>
        <CreateUserDialog onCreated={invalidate} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4" /> Todos los usuarios
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
                "usuarios",
                rows.map(
                  ({
                    id,
                    email,
                    role,
                    status,
                    createdAt,
                    displayName,
                    targetLanguage,
                  }) => ({
                    id,
                    email,
                    rol: role,
                    estado: status,
                    nombre: displayName,
                    idioma: targetLanguage,
                    creado: createdAt,
                  }),
                ),
              )
            }
            placeholder="Buscar por email o nombre..."
          />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-left">
                  <th className="pb-2 font-medium">Email</th>
                  <th className="pb-2 font-medium">Nombre</th>
                  <th className="pb-2 font-medium">Idioma</th>
                  <th className="pb-2 font-medium">Registro</th>
                  <th className="pb-2 font-medium">Rol</th>
                  <th className="pb-2 font-medium">Estado</th>
                  <th className="pb-2 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((u) => (
                  <tr
                    key={u.id}
                    className={u.status === "suspended" ? "opacity-60" : ""}
                  >
                    <td className="py-2.5 pr-3 font-mono text-xs">{u.email}</td>
                    <td className="py-2.5 pr-3">{u.displayName || "—"}</td>
                    <td className="py-2.5 pr-3 uppercase text-xs">
                      {u.targetLanguage || "—"}
                    </td>
                    <td className="py-2.5 pr-3 text-xs text-muted-foreground">
                      {new Date(u.createdAt).toLocaleDateString("es-ES")}
                    </td>
                    <td className="py-2.5 pr-3">
                      <Badge
                        variant={u.role === "admin" ? "default" : "secondary"}
                      >
                        {u.role}
                      </Badge>
                    </td>
                    <td className="py-2.5 pr-3">
                      <Badge
                        variant={
                          u.status === "suspended" ? "destructive" : "outline"
                        }
                        className="text-xs"
                      >
                        {u.status === "suspended" ? "Suspendido" : "Activo"}
                      </Badge>
                    </td>
                    <td className="py-2.5">
                      {u.id === user.id ? (
                        <span className="text-xs text-muted-foreground">
                          (tú)
                        </span>
                      ) : (
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            title="Ver detalle"
                            asChild
                          >
                            <Link to={`/admin/users/${u.id}`} viewTransition>
                              <Eye className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            title="Impersonar"
                            onClick={() => impersonate(u)}
                          >
                            <LogIn className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            title={
                              u.role === "admin"
                                ? "Quitar admin"
                                : "Hacer admin"
                            }
                            onClick={() =>
                              toggleRole({
                                id: u.id,
                                role: u.role === "admin" ? "user" : "admin",
                              })
                            }
                          >
                            <Shield className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            title={
                              u.status === "suspended" ? "Activar" : "Suspender"
                            }
                            onClick={() =>
                              toggleStatus({
                                id: u.id,
                                status:
                                  u.status === "suspended"
                                    ? "active"
                                    : "suspended",
                              })
                            }
                          >
                            {u.status === "suspended" ? (
                              <UserCheck className="h-3.5 w-3.5 text-green-500" />
                            ) : (
                              <UserX className="h-3.5 w-3.5 text-orange-500" />
                            )}
                          </Button>
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
                                  ¿Eliminar usuario?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esto eliminará permanentemente a{" "}
                                  <strong>{u.email}</strong> y todos sus datos.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive hover:bg-destructive/90"
                                  onClick={() => deleteUser(u.id)}
                                >
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">
                No hay usuarios
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
