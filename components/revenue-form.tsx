"use client"

import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { storeRevenue } from "@/hook/revenue.store";

// Format pour afficher les montants en EUR
const currencyFormatter = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

type RevenueFormProps = {
  /** Callback appelé après la soumission du formulaire */
  onSubmitted?: () => void;
  /** Callback appelé pour fermer le formulaire */
  onClose?: () => void;
};

/**
 * Formulaire de saisie du chiffre d'affaires
 * Permet d'ajouter les revenus avec supports pour TVA 20% et 5.5%
 */
export default function RevenueForm({ onSubmitted, onClose }: RevenueFormProps) {
  // Extraire seulement addEntry pour éviter les re-renders sur tout changement du store
  const addEntry = storeRevenue.getState().addEntry;

  // Initialiser avec la date du jour
  const todayISO = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState<string>(todayISO);

  // Champs de saisie pour TVA 20%
  const [base20, setBase20] = useState<string>("");
  const [tva20, setTva20] = useState<string>("");

  // Champs de saisie pour TVA 5.5%
  const [base5_5, setBase5_5] = useState<string>("");
  const [tva5_5, setTva5_5] = useState<string>("");

  // État de soumission
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Calculs automatiques
  const ht = Number(base20 || 0) + Number(base5_5 || 0)
  const tvaTotal = Number(tva20 || 0) + Number(tva5_5 || 0)
  const ttc = ht + tvaTotal

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await addEntry({
        date,
        base20: Number(base20 || 0),
        tva20: Number(tva20 || 0),
        base5_5: Number(base5_5 || 0),
        tva5_5: Number(tva5_5 || 0),
        ht,
        ttc,
      });

      // Réinitialiser le formulaire
      setDate(todayISO);
      setBase20("");
      setTva20("");
      setBase5_5("");
      setTva5_5("");

      onSubmitted?.();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Erreur lors de l'enregistrement");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-xl rounded border bg-white p-6 shadow dark:bg-slate-700">
      {/* Bouton de fermeture */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute right-3 top-3 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          aria-label="Fermer le formulaire"
        >
          ✕
        </button>
      )}

      <h3 className="mb-6 text-lg font-semibold text-slate-700 dark:text-slate-200">Saisie chiffre d'affaires</h3>

      <div className="mb-6 grid grid-cols-2 gap-4">
        {/* Champ date */}
        <div className="col-span-2 flex flex-col">
          <Label htmlFor="date-saisie">Date de saisie</Label>
          <Input
            id="date-saisie"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-2"
          />
        </div>

        {/* TVA 20% */}
        <div className="flex flex-col">
          <Label htmlFor="base20">Base 20%</Label>
          <Input
            id="base20"
            type="number"
            placeholder="0"
            value={base20}
            onChange={(e) => setBase20(e.target.value)}
            className="mt-2"
          />
        </div>

        <div className="flex flex-col">
          <Label htmlFor="tva20">TVA 20%</Label>
          <Input
            id="tva20"
            type="number"
            placeholder="0"
            value={tva20}
            onChange={(e) => setTva20(e.target.value)}
            className="mt-2"
          />
        </div>

        {/* TVA 5.5% */}
        <div className="flex flex-col">
          <Label htmlFor="base55">Base 5,5%</Label>
          <Input
            id="base55"
            type="number"
            placeholder="0"
            value={base5_5}
            onChange={(e) => setBase5_5(e.target.value)}
            className="mt-2"
          />
        </div>

        <div className="flex flex-col">
          <Label htmlFor="tva55">TVA 5,5%</Label>
          <Input
            id="tva55"
            type="number"
            placeholder="0"
            value={tva5_5}
            onChange={(e) => setTva5_5(e.target.value)}
            className="mt-2"
          />
        </div>
      </div>

      {/* Résumé des totaux */}
      <div className="mb-4 flex justify-between items-center">
        <div>
          <div className="text-sm text-slate-500">Chiffre d'affaires HT</div>
          <div className="text-xl font-semibold text-slate-700 dark:text-slate-200">{currencyFormatter.format(ht)}</div>
        </div>

        <div>
          <div className="text-sm text-slate-500">Chiffre d'affaires TTC</div>
          <div className="text-xl font-semibold text-slate-700 dark:text-slate-200">{currencyFormatter.format(ttc)}</div>
        </div>
      </div>

      {/* Message d'erreur */}
      {submitError && <p className="mb-3 text-sm text-red-500">{submitError}</p>}

      {/* Boutons d'action */}
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Envoi..." : "Envoyer"}
        </Button>
      </div>
    </div>
  );
}
