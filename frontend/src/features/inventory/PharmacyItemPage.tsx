import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PackageCheck, Camera, CheckCircle2, History } from 'lucide-react';

interface InKindItem {
  id: string;
  category: string;
  quantity: number;
  condition: string;
  loggedAt: string;
  donorLabel?: string;
}

export const PharmacyItemPage: React.FC = () => {
  const [category, setCategory] = useState('Textbooks / Study Materials');
  const [quantity, setQuantity] = useState('5');
  const [condition, setCondition] = useState('Good / Lightly Used');
  const [donorLabel, setDonorLabel] = useState('');
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const [recentItems, setRecentItems] = useState<InKindItem[]>([
    {
      id: 'itm-1',
      category: 'Prescription Antibiotics & First Aid',
      quantity: 20,
      condition: 'New / Sealed',
      donorLabel: 'Hospital Pharmacy Alumni Donation',
      loggedAt: '2026-10-24T12:00:00Z',
    },
    {
      id: 'itm-2',
      category: 'Medical Textbooks (Nursing)',
      quantity: 12,
      condition: 'Good / Lightly Used',
      donorLabel: 'Graduating Class of 2025',
      loggedAt: '2026-10-21T09:30:00Z',
    },
  ]);

  const categories = [
    'Textbooks / Study Materials',
    'Prescription Medication / First Aid',
    'Personal Hygiene Kits',
    'Lab Coats & Protective Gear',
    'Dry Food Rations',
  ];

  const conditions = ['New / Sealed', 'Good / Lightly Used', 'Acceptable'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseInt(quantity, 10);
    if (!qty || qty <= 0) return;

    const newItem: InKindItem = {
      id: `itm-${Date.now()}`,
      category,
      quantity: qty,
      condition,
      donorLabel: donorLabel.trim() || 'Anonymous Walk-in Donor',
      loggedAt: new Date().toISOString(),
    };

    setRecentItems([newItem, ...recentItems]);
    setSubmittedSuccess(true);
    setQuantity('1');
    setDonorLabel('');
    setTimeout(() => setSubmittedSuccess(false), 3000);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="text-center sm:text-left">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center justify-center sm:justify-start gap-2.5">
          <PackageCheck className="w-6 h-6 text-emerald-600" />
          Pharmacy Quick Item Log
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          University Hospital Pharmacy Desk. Fast mobile intake for physical item donations.
        </p>
      </div>

      {submittedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          Item successfully recorded in inventory and queued for blockchain anchoring!
        </div>
      )}

      {/* Quick Entry Form */}
      <Card>
        <form onSubmit={handleSubmit}>
          <CardContent className="p-5 sm:p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Item Category
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`p-3 text-left rounded-lg text-xs font-medium border transition-colors ${
                      category === cat
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200'
                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Item Quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Condition
                </label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="w-full h-11 min-h-[44px] rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm px-3"
                >
                  {conditions.map((cond) => (
                    <option key={cond} value={cond}>
                      {cond}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Input
              label="Donor Name or Label (Optional)"
              placeholder="e.g. Dr. Kamau / Student Drop-off"
              value={donorLabel}
              onChange={(e) => setDonorLabel(e.target.value)}
            />

            <Button type="submit" variant="emerald" size="lg" className="w-full text-base font-bold">
              Record In-Kind Donation (&lt; 30s)
            </Button>
          </CardContent>
        </form>
      </Card>

      {/* Recent Logged Items */}
      <Card>
        <CardHeader className="py-4">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <History className="w-4 h-4 text-zinc-500" />
            Recent Custodian Receipts
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-zinc-200 dark:divide-zinc-800 text-xs">
            {recentItems.map((item) => (
              <div key={item.id} className="p-3.5 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-zinc-800 dark:text-zinc-200">{item.category}</p>
                  <p className="text-zinc-500">
                    {item.donorLabel} • {item.condition}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
                    +{item.quantity} units
                  </span>
                  <span className="block text-[10px] text-zinc-400">
                    {new Date(item.loggedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

