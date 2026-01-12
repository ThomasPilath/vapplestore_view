"use client"

import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { storePurchase } from "@/hook/purchase.store";

const fmt = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

type Props = {
  onSubmitted?: () => void;
  onClose?: () => void;
};

export default function PurchaseForm({ onSubmitted, onClose }: Props) {
  const addEntry = storePurchase((s) => s.addEntry);

  const todayISO = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState<string>(todayISO);

  const [priceHT, setPriceHT] = useState<string>("");
  const [tva, setTva] = useState<string>("");
  const [shippingFee, setShippingFee] = useState<string>("");

  const ttc = useMemo(() => Number(priceHT || 0) + Number(tva || 0) + Number(shippingFee || 0), [priceHT, tva, shippingFee]);

  function handleSend() {
    addEntry({ date, priceHT: Number(priceHT || 0), tva: Number(tva || 0), shippingFee: Number(shippingFee || 0), ttc });
    setDate(todayISO);
    setPriceHT("");
    setTva("");
    setShippingFee("");

    if (onSubmitted) onSubmitted();
  }

  return (
    <div className="max-w-xl mx-auto p-6 bg-white dark:bg-slate-700 rounded shadow relative">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          aria-label="Fermer"
        >
          ✕
        </button>
      )}
      <h3 className="text-lg text-slate-700 dark:text-slate-200 font-semibold mb-4">Saisie achat</h3>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="flex flex-col col-span-2">
          <Label htmlFor="date-achat">Date d'achat</Label>
          <Input
            id="date-achat"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-2"
          />
        </div>

        <div className="flex flex-col">
          <Label htmlFor="price-ht">Prix HT</Label>
          <Input
            id="price-ht"
            type="number"
            placeholder="0"
            value={priceHT}
            onChange={(e) => setPriceHT(e.target.value)}
            className="mt-2"
          />
        </div>

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

        <div className="flex flex-col col-span-2">
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

      <div className="flex justify-between items-center mb-4">
        <div>
          <div className="text-sm text-slate-500">Prix TTC</div>
          <div className="text-xl text-slate-700 dark:text-slate-200 font-semibold">{fmt.format(ttc)}</div>
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <Button variant="secondary" onClick={handleSend}>
          Envoyer
        </Button>
      </div>
    </div>
  );
}
