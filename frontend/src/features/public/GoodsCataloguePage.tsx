import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Boxes, BookOpen, Stethoscope, Heart, Shield, CheckCircle2 } from 'lucide-react';

interface ReliefCategory {
  id: string;
  name: string;
  description: string;
  acceptedConditions: string[];
  unit: string;
  icon: React.ComponentType<{ className?: string }>;
}

const CATEGORIES: ReliefCategory[] = [
  {
    id: 'med-textbooks',
    name: 'Medical & STEM Textbooks',
    description: 'Core curriculum textbooks, laboratory workbooks, and clinical reference materials.',
    acceptedConditions: ['New / Sealed', 'Lightly Used (Clean)'],
    unit: 'Books / Volumes',
    icon: BookOpen,
  },
  {
    id: 'first-aid',
    name: 'First Aid & Pharmacy Kits',
    description: 'Prescription antibiotics, antiseptics, sterile gauze, bandages, and PPE supplies.',
    acceptedConditions: ['New / Sealed Only', 'Unexpired > 6 Months'],
    unit: 'Sealed Kits',
    icon: Stethoscope,
  },
  {
    id: 'hygiene',
    name: 'Personal Hygiene & Care Kits',
    description: 'Sanitary pads, antiseptic soap, dental care products, and personal care necessities.',
    acceptedConditions: ['Factory Sealed Packs'],
    unit: 'Packs',
    icon: Heart,
  },
  {
    id: 'lab-ppe',
    name: 'Lab Coats & Safety Gear',
    description: 'Clinical laboratory coats, protective eyewear, nitrile gloves, and face shields.',
    acceptedConditions: ['New', 'Clean / Sanitized'],
    unit: 'Pieces',
    icon: Shield,
  },
];

export const GoodsCataloguePage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2.5">
          <Boxes className="w-7 h-7 text-emerald-600" />
          In-kind relief catalogue
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          CharityChain tracks both monetary donations and physical relief supplies on the same append-only ledger. Here is the public directory of accepted supplies and standards.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          return (
            <Card key={cat.id} className="p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">{cat.name}</h3>
                  <p className="text-xs text-zinc-500 mt-1">{cat.description}</p>
                </div>
              </div>

              <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3 space-y-1.5 text-xs">
                <div className="flex justify-between text-zinc-500">
                  <span>Inventory Unit:</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">{cat.unit}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block mb-1">Accepted Conditions:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {cat.acceptedConditions.map((cond) => (
                      <span
                        key={cond}
                        className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[11px] font-medium text-zinc-700 dark:text-zinc-300"
                      >
                        ✓ {cond}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="bg-zinc-50 dark:bg-zinc-900/50 p-6 space-y-3 border-zinc-200 dark:border-zinc-800">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          How In-Kind Donations are Tracked
        </h3>
        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
          When dropped off at a participating hospital or campus relief desk, each physical item is checked in by a verified staff member and issued a permanent tracking receipt code (e.g. <code>MLK-ITEM-XXXX</code>). Items are depleted FIFO against approved student need cases and recorded on the immutable ledger.
        </p>
      </Card>
    </div>
  );
};
