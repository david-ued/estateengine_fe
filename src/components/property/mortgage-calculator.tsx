'use client';

import { useState } from 'react';
import { inputClass } from '@/components/ui/styles';
import type { Dictionary } from '@/i18n/get-dictionary';
import { calcMortgage } from '@/lib/mortgage';

/** 房貸試算：頭期 20% / 貸款 80% / 30 年（PRD 寫死參數） */
export function MortgageCalculator({
  locale,
  initialPrice,
  labels,
}: Readonly<{ locale: string; initialPrice: number; labels: Dictionary['property'] }>) {
  const [price, setPrice] = useState(initialPrice);
  const quote = calcMortgage(price || 0);

  const fmt = (value: number) => `$${Math.round(value).toLocaleString(locale)}`;

  return (
    <section className="card-lift rounded-xl border border-neutral-200 p-5 dark:border-neutral-800">
      <h2 className="font-semibold">{labels.mortgageTitle}</h2>
      <p className="mt-1 text-xs text-neutral-500">{labels.mortgageHint}</p>

      <label className="mt-4 flex flex-col gap-1 text-sm">
        {labels.totalPrice}
        <input
          type="number"
          min="0"
          value={price || ''}
          onChange={(e) => setPrice(Number(e.target.value))}
          className={inputClass}
        />
      </label>

      <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
        <div>
          <dt className="text-xs text-neutral-500">{labels.downPayment}</dt>
          <dd className="mt-0.5 font-mono">{fmt(quote.downPayment)}</dd>
        </div>
        <div>
          <dt className="text-xs text-neutral-500">{labels.loanAmount}</dt>
          <dd className="mt-0.5 font-mono">{fmt(quote.loanAmount)}</dd>
        </div>
        <div>
          <dt className="text-xs text-neutral-500">{labels.monthlyPayment}</dt>
          <dd className="mt-0.5 font-mono font-semibold">{fmt(quote.monthlyPayment)}</dd>
        </div>
      </dl>
    </section>
  );
}
