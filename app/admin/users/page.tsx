"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/hook/auth.store";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Edit, Plus, X, Save } from "lucide-react";

interface User {
  id: string;
  username: string;
  roleId: string;
  roleName: string;
  roleLevel: number;
  createdAt: string;
}

interface Role {
  id: string;
  roleName: string;
  level: number;
}

export default function UsersManagementPage() {
  const { user: currentUser, accessToken } = useAuthStore();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal de création/édition
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    roleId: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  // Rediriger si pas admin
  useEffect(() => {
    if (currentUser && currentUser.roleLevel < 2) {
      router.push("/overview");
    }
  }, [currentUser, router]);

  // Charger les données
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError("");

      // Charger les utilisateurs
      const usersRes = await fetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!usersRes.ok) throw new Error("Erreur lors du chargement des utilisateurs");
      const usersData = await usersRes.json();

      // Charger les rôles
      const rolesRes = await fetch("/api/admin/roles", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!rolesRes.ok) throw new Error("Erreur lors du chargement des rôles");
      const rolesData = await rolesRes.json();

      setUsers(usersData.data);
      setRoles(rolesData.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingUser(null);
    // S'assurer qu'un roleId valide est défini
    const defaultRoleId = roles.length > 0 ? roles[0].id : "";
    setFormData({ username: "", password: "", roleId: defaultRoleId });
    setIsModalOpen(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({ username: user.username, password: "", roleId: user.roleId });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError("");

      // Validation côté client
      if (!formData.username || !formData.roleId) {
        setError("Le nom d'utilisateur et le rôle sont requis");
        setIsSaving(false);
        return;
      }

      if (!editingUser && !formData.password) {
        setError("Le mot de passe est requis pour la création d'un utilisateur");
        setIsSaving(false);
        return;
      }

      if (formData.password && formData.password.length < 6) {
        setError("Le mot de passe doit contenir au moins 6 caractères");
        setIsSaving(false);
        return;
      }

      if (editingUser) {
        // Mise à jour
        const body: any = { roleId: formData.roleId };
        if (formData.username !== editingUser.username) {
          body.username = formData.username;
        }
        if (formData.password) {
          body.password = formData.password;
        }

        const res = await fetch(`/api/admin/users?id=${editingUser.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Erreur lors de la mise à jour");
        }
      } else {
        // Création
        console.log("📝 Création d'un utilisateur avec les données:", formData);
        
        const res = await fetch("/api/admin/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(formData),
        });

        if (!res.ok) {
          const data = await res.json();
          console.error("❌ Erreur API:", data);
          throw new Error(data.error || "Erreur lors de la création");
        }
      }

      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (userId: string, username: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur "${username}" ?`)) {
      return;
    }

    try {
      setError("");
      const res = await fetch(`/api/admin/users?id=${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de la suppression");
      }

      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (!currentUser || currentUser.roleLevel < 2) {
    return null;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gestion des utilisateurs</CardTitle>
              <CardDescription>
                Créez, modifiez et supprimez des utilisateurs de l'application
              </CardDescription>
            </div>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvel utilisateur
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 rounded-md">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Chargement...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom d'utilisateur</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Niveau</TableHead>
                  <TableHead>Date de création</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.username}</TableCell>
                    <TableCell>{user.roleName}</TableCell>
                    <TableCell>{user.roleLevel}</TableCell>
                    <TableCell>
                      {new Date(user.createdAt).toLocaleDateString("fr-FR")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(user)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(user.id, user.username)}
                          disabled={user.id === currentUser?.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal de création/édition */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingUser ? "Modifier l'utilisateur" : "Nouvel utilisateur"}
            </DialogTitle>
            <DialogDescription>
              {editingUser
                ? "Modifiez les informations de l'utilisateur"
                : "Créez un nouvel utilisateur pour l'application"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="username">Nom d'utilisateur</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="johndoe"
              />
            </div>

            <div>
              <Label htmlFor="password">
                Mot de passe {editingUser && "(laisser vide pour ne pas changer)"}
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder={editingUser ? "Nouveau mot de passe" : "Mot de passe"}
              />
            </div>

            <div>
              <Label htmlFor="role">Rôle</Label>
              <select
                id="role"
                value={formData.roleId}
                onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                className="w-full px-3 py-2 border rounded-md bg-background"
              >
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.roleName} (niveau {role.level})
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950 p-3 rounded-md">
                {error}
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                <X className="h-4 w-4 mr-2" />
                Annuler
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
