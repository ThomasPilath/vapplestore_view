"use client"

import { useEffect, useState } from "react";
import { useAuthStore } from "@/hook/auth.store";
import { useTheme } from "next-themes";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { storeSettings } from "@/hook/settings.store";

export default function Settings() {
  const { accessToken } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const hideSundays = storeSettings((s) => s.hideSundays);
  const setHideSundays = storeSettings((s) => s.setHideSundays);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  // Charger les paramètres utilisateur
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/user/settings", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (res.ok) {
        const data = await res.json();
        setHideSundays(data.data.hideSundays ?? true);
        if (data.data.theme) {
          setTheme(data.data.theme);
        }
      }
    } catch (error) {
      console.error("Erreur chargement settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setIsSaving(true);
      setMessage("");

      const res = await fetch("/api/user/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          theme,
          hideSundays,
        }),
      });

      if (res.ok) {
        setMessage("Paramètres sauvegardés avec succès !");
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage("Erreur lors de la sauvegarde");
      }
    } catch (error) {
      console.error("Erreur sauvegarde settings:", error);
      setMessage("Erreur lors de la sauvegarde");
    } finally {
      setIsSaving(false);
    }
  };

  // Sauvegarder automatiquement le thème quand il change
  useEffect(() => {
    if (!isLoading && theme) {
      saveSettings();
    }
  }, [theme]);

  if (isLoading) {
    return (
      <div className="flex-1 overflow-auto p-4 md:p-6 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-4xl mx-auto text-center py-8">
          <p className="text-muted-foreground">Chargement des paramètres...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-4 md:p-6 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-4xl mx-auto space-y-6">
        <h2 className="text-2xl md:text-3xl font-bold text-center md:text-left">PARAMÈTRES</h2>

        {message && (
          <div className="p-3 bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400 rounded-md">
            {message}
          </div>
        )}

        {/* Paramètres d'apparence */}
        <Card>
          <CardHeader>
            <CardTitle>Apparence</CardTitle>
            <CardDescription>Personnalisez l'apparence de l'application</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-base font-medium">Thème</Label>
              <p className="text-sm text-muted-foreground mb-3">
                Choisissez le thème de l'interface
              </p>
              <div className="flex gap-2">
                <Button
                  variant={theme === "light" ? "default" : "outline"}
                  onClick={() => setTheme("light")}
                  className="flex-1"
                >
                  Clair
                </Button>
                <Button
                  variant={theme === "dark" ? "default" : "outline"}
                  onClick={() => setTheme("dark")}
                  className="flex-1"
                >
                  Sombre
                </Button>
                <Button
                  variant={theme === "system" ? "default" : "outline"}
                  onClick={() => setTheme("system")}
                  className="flex-1"
                >
                  Système
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Paramètres d'affichage */}
        <Card>
          <CardHeader>
            <CardTitle>Paramètres d'affichage</CardTitle>
            <CardDescription>Configurez l'affichage des données</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between py-4">
              <div className="space-y-1">
                <Label htmlFor="hide-sundays" className="text-base font-medium">
                  Masquer les dimanches
                </Label>
                <p className="text-sm text-muted-foreground">
                  Exclure les dimanches des graphiques et statistiques
                </p>
              </div>
              <Switch
                id="hide-sundays"
                checked={hideSundays}
                onCheckedChange={setHideSundays}
              />
            </div>

            <div className="pt-4">
              <Button onClick={saveSettings} disabled={isSaving}>
                {isSaving ? "Enregistrement..." : "Enregistrer les préférences"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
