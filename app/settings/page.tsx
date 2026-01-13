"use client"

import { storeSettings } from "@/hook/settings.store";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

export default function Settings() {
  const hideSundays = storeSettings((s) => s.hideSundays);
  const setHideSundays = storeSettings((s) => s.setHideSundays);

  return (
    <div className="flex-1 overflow-auto p-4 md:p-6 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-4xl mx-auto space-y-6">
        <h2 className="text-2xl md:text-3xl font-bold text-center md:text-left">PARAMÈTRES</h2>

        {/* Paramètres d'affichage */}
        <Card>
          <CardHeader>
            <CardTitle>Paramètres d'affichage</CardTitle>
            <CardDescription>Configurez l'affichage des données</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Toggle pour masquer les dimanches */}
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
