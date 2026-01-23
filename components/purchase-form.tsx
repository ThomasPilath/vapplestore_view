"use client"

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { storePurchase } from "@/hook/purchase.store";

// Format pour afficher les montants en EUR
const currencyFormatter = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

type PurchaseFormProps = {
  /** Callback appelé après la soumission du formulaire */
  onSubmitted?: () => void;
  /** Callback appelé pour fermer le formulaire */
  onClose?: () => void;
};

/**
 * Formulaire de saisie des achats
 * Permet d'ajouter les dépenses avec calculs automatiques de TVA et frais
 */
export default function PurchaseForm({ onSubmitted, onClose }: PurchaseFormProps) {
  // Extraire seulement addEntry pour éviter les re-renders sur tout changement du store
  const addEntry = storePurchase.getState().addEntry;

  // Initialiser avec la date du jour
  const todayISO = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState<string>(todayISO);

  // Champs de saisie
  const [totalHT, setTotalHT] = useState<string>("");
  const [tva, setTva] = useState<string>("");
  const [shippingFee, setShippingFee] = useState<string>("");

  // État de soumission
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Calcul automatique du total TTC
  const totalTTC = Number(totalHT || 0) + Number(tva || 0) + Number(shippingFee || 0);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await addEntry({
        date,
        totalHT: Number(totalHT || 0),
        tva: Number(tva || 0),
        shippingFee: Number(shippingFee || 0),
        totalTTC,
      });

      // Réinitialiser le formulaire
      setDate(todayISO);
      setTotalHT("");
      setTva("");
      setShippingFee("");

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

      <h3 className="mb-6 text-lg font-semibold text-slate-700 dark:text-slate-200">Saisie achat</h3>

      <div className="mb-6 grid grid-cols-2 gap-4">
        {/* Champ date */}
        <div className="col-span-2 flex flex-col">
          <Label htmlFor="date-achat">Date d'achat</Label>
          <Input
            id="date-achat"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-2"
          />
        </div>

        {/* Total HT */}
        <div className="flex flex-col">
          <Label htmlFor="price-ht">Total HT</Label>
          <Input
            id="price-ht"
            type="number"
            placeholder="0"
            value={totalHT}
            onChange={(e) => setTotalHT(e.target.value)}
            className="mt-2"
          />
        </div>

        {/* TVA */}
        <div className="flex flex-col">
          <Label htmlFor="tva-input">TVA 20%</Label>
          <Input
            id="tva-input"
            type="number"
            placeholder="0"
            value={tva}
            onChange={(e) => setTva(e.target.value)}
            className="mt-2"
          />
        </div>

        {/* Frais de port */}
        <div className="col-span-2 flex flex-col">
          <Label htmlFor="shipping-fee">Frais de port</Label>
          <Input
            id="shipping-fee"
            type="number"
            placeholder="0"
            value={shippingFee}
            onChange={(e) => setShippingFee(e.target.value)}
            className="mt-2"
          />
        </div>
      </div>

      {/* Résumé du total */}
      <div className="mb-4 flex justify-between items-center">
        <div>
          <div className="text-sm text-slate-500">Prix TTC</div>
          <div className="text-xl font-semibold text-slate-700 dark:text-slate-200">{currencyFormatter.format(totalTTC)}</div>
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
