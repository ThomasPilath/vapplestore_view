"use client"

import { storeSettings } from "@/hook/settings.store";
import { Label } from "@/components/ui/label";

export default function Settings() {
  const hideSundays = storeSettings((s) => s.hideSundays);
  const setHideSundays = storeSettings((s) => s.setHideSundays);

  return (
    <div className="flex flex-col h-screen">
      <div className="flex p-4 justify-between items-center">
        <h2 className="h-auto w-min mx-auto text-2xl font-bold m-2 p-2 border-2 rounded-2xl border-slate-500">SETTINGS</h2>
      </div>

      <main className="flex-1 overflow-auto p-6 bg-slate-50 dark:bg-slate-950">
        {/* Paramètres d'affichage */}
        <div className="bg-white dark:bg-slate-900 rounded-lg p-6 shadow max-w-2xl">
          <h3 className="text-lg font-semibold mb-6">Paramètres d'affichage</h3>

          {/* Toggle pour masquer les dimanches */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex flex-col">
              <Label className="text-base font-medium">Masquer les dimanches</Label>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Exclure les dimanches des graphiques et statistiques</p>
            </div>
            <button
              onClick={() => setHideSundays(!hideSundays)}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                hideSundays ? "bg-emerald-600" : "bg-slate-300"
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  hideSundays ? "translate-x-7" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
