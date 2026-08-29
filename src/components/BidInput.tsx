'use client';

import { formatEuro } from '@/lib/types';

interface Props {
  value: number;
  onChange: (value: number) => void;
  /** Puja actual del deal: en una repuja hay que superarla. */
  min?: number;
  label?: string;
  help?: string;
}

/**
 * Slider 0-100 EUR acompanado de un input libre: el slider cubre el rango
 * habitual y el input permite cualquier importe por encima.
 */
export default function BidInput({ value, onChange, min = 0, label = 'Puja', help }: Props) {
  const sliderValue = Math.min(Math.max(value, 0), 100);

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="label">{label}</span>
        <span className="text-lg font-bold text-success">{formatEuro(value || 0)}</span>
      </div>

      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={sliderValue}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full accent-primary"
        aria-label={`${label} (deslizador 0-100 euros)`}
      />

      <div className="mt-2 flex items-center gap-2">
        <span className="text-sm text-neutral">€</span>
        <input
          type="number"
          inputMode="decimal"
          min={min}
          step="0.5"
          value={Number.isNaN(value) ? '' : value}
          onChange={(event) => onChange(event.target.value === '' ? 0 : Number(event.target.value))}
          className="input w-32"
          aria-label={`${label} (importe libre en euros)`}
        />
        <p className="text-xs text-neutral">
          {help ?? 'Sin puja minima. Mas puja = mas arriba en el ranking.'}
        </p>
      </div>
    </div>
  );
}
