import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  PackageCheck,
  CheckCircle2,
  History,
  ArrowRight,
  Send,
  Boxes,
  Tag,
  Loader2,
} from 'lucide-react';

interface InKindItem {
  id: string;
  receiptCode: string;
  category: string;
  quantity: number;
  remainingQuantity: number;
  condition: string;
  loggedAt: string;
  donorLabel: string;
}

export const PharmacyItemPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'INTAKE' | 'INVENTORY'>('INTAKE');

  const [category, setCategory] = useState('Medical Textbooks / Study Materials');
  const [quantity, setQuantity] = useState('10');
  const [condition, setCondition] = useState('GOOD');
  const [donorLabel, setDonorLabel] = useState('');
  const [justLoggedItem, setJustLoggedItem] = useState<InKindItem | null>(null);

  const [issueModalItem, setIssueModalItem] = useState<InKindItem | null>(null);
  const [issueQuantity, setIssueQuantity] = useState('1');
  const [targetCaseRef, setTargetCaseRef] = useState('');

  const { data: inventory = [], isLoading } = useQuery<InKindItem[]>({
    queryKey: ['inventory-items'],
    queryFn: () => api.getInKindItems(),
  });

  const registerMutation = useMutation({
    mutationFn: (data: {
      category: string;
      itemName: string;
      quantity: number;
      condition: 'NEW' | 'GOOD' | 'FAIR' | 'USABLE';
      donorLabel?: string;
    }) => api.registerInKindItem(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      const lot = res?.lot || {};
      const logged: InKindItem = {
        id: lot.id || `itm-${Date.now()}`,
        receiptCode: lot.receiptCode || 'MLK-ITEM-NEW',
        category,
        quantity: parseInt(quantity, 10),
        remainingQuantity: parseInt(quantity, 10),
        condition,
        loggedAt: new Date().toISOString(),
        donorLabel: donorLabel.trim() || 'Hospital Walk-in Donor',
      };
      setJustLoggedItem(logged);
      setQuantity('10');
      setDonorLabel('');
    },
    onError: (err: any) => {
      alert(err?.message || 'Failed to record in-kind item donation.');
    },
  });

  const issueMutation = useMutation({
    mutationFn: (data: { receiptCode: string; caseNumber: string; quantity: number }) =>
      api.issueInKindStock(data.receiptCode, data.caseNumber, data.quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      alert(`Successfully issued stock to ${targetCaseRef}! Recorded on ledger.`);
      setIssueModalItem(null);
      setTargetCaseRef('');
    },
    onError: (err: any) => {
      alert(err?.message || 'Failed to issue item stock.');
    },
  });

  const categories = [
    'Medical Textbooks / Study Materials',
    'Prescription Antibiotics & First Aid',
    'Personal Hygiene & Care Kits',
    'Lab Coats & PPE Gear',
    'Dry Food & Meal Rations',
  ];

  const conditions = [
    { label: 'New / Sealed', value: 'NEW' },
    { label: 'Good / Lightly Used', value: 'GOOD' },
    { label: 'Fair Condition', value: 'FAIR' },
    { label: 'Usable', value: 'USABLE' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseInt(quantity, 10);
    if (!qty || qty <= 0) return;

    registerMutation.mutate({
      category,
      itemName: category,
      quantity: qty,
      condition: condition as any,
      donorLabel: donorLabel.trim() || undefined,
    });
  };

  const handleIssueStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueModalItem) return;
    const qtyToIssue = parseInt(issueQuantity, 10);
    if (!qtyToIssue || qtyToIssue > issueModalItem.remainingQuantity) {
      alert('Issue quantity exceeds available stock!');
      return;
    }
    if (!targetCaseRef.trim()) {
      alert('Please enter a target case reference (e.g. case number or ID).');
      return;
    }

    issueMutation.mutate({
      receiptCode: issueModalItem.receiptCode,
      caseNumber: targetCaseRef.trim(),
      quantity: qtyToIssue,
    });
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2.5">
            <PackageCheck className="w-6 h-6 text-emerald-600" />
            Pharmacy & inventory
          </h1>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-xs font-semibold self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('INTAKE')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'INTAKE'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            Quick Intake (&lt;30s)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('INVENTORY')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'INVENTORY'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            Stock & Case Issuing
          </button>
        </div>
      </div>

      {justLoggedItem && (
        <Card className="border-emerald-500/40 bg-emerald-50/30 dark:bg-emerald-950/20 overflow-hidden shadow-md">
          <div className="p-5 sm:p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                    Item logged
                  </h3>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    {justLoggedItem.quantity} units of {justLoggedItem.category}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setJustLoggedItem(null)}
                className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                Dismiss
              </button>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-xs">
              <div>
                <span className="text-[11px] text-zinc-400 block font-sans">Item Lot Receipt Code (Hand to Donor):</span>
                <span className="text-base font-extrabold text-emerald-700 dark:text-emerald-400">
                  {justLoggedItem.receiptCode}
                </span>
              </div>

              <div className="flex items-center gap-2 font-sans shrink-0">
                <Link to={`/trace?receipt=${justLoggedItem.receiptCode}`}>
                  <Button size="sm" variant="emerald" className="gap-1.5 text-xs">
                    <span>Trace on Public Ledger</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'INTAKE' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Card className="lg:col-span-7">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Tag className="w-4 h-4 text-emerald-600" />
                Log item
              </CardTitle>
            </CardHeader>

            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Item Category
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        className={`p-2.5 text-left rounded-lg text-xs font-medium border transition-colors ${
                          category === cat
                            ? 'bg-emerald-50 border-emerald-600 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200'
                            : 'border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Item Quantity (Units)"
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                  />

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Physical Condition
                    </label>
                    <select
                      value={condition}
                      onChange={(e) => setCondition(e.target.value)}
                      className="w-full h-11 min-h-[44px] rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
                    >
                      {conditions.map((cond) => (
                        <option key={cond.value} value={cond.value}>
                          {cond.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <Input
                  label="Donor Name or Label (Optional)"
                  placeholder="e.g. Dr. Kamau / Student Walk-in Drop"
                  value={donorLabel}
                  onChange={(e) => setDonorLabel(e.target.value)}
                />
              </CardContent>

              <CardFooter className="pt-2">
                <Button
                  type="submit"
                  variant="emerald"
                  size="lg"
                  className="w-full text-sm font-bold gap-2"
                  disabled={registerMutation.isPending}
                >
                  <PackageCheck className="w-5 h-5" />
                  {registerMutation.isPending ? 'Recording on Ledger...' : 'Key In & Anchor Item Lot on Chain'}
                </Button>
              </CardFooter>
            </form>
          </Card>

          <Card className="lg:col-span-5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <History className="w-4 h-4 text-zinc-500" />
                Recent drop-offs
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-8 text-center text-zinc-500 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Loading recent drops...</span>
                </div>
              ) : inventory.length === 0 ? (
                <div className="p-8 text-center text-zinc-500 text-xs">
                  No in-kind items logged yet.
                </div>
              ) : (
                <div className="divide-y divide-zinc-200 dark:divide-zinc-800 text-xs">
                  {inventory.slice(0, 5).map((item) => (
                    <div key={item.id} className="p-4 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                          {item.receiptCode}
                        </span>
                        <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                          {item.quantity} units
                        </span>
                      </div>
                      <p className="font-semibold text-zinc-800 dark:text-zinc-200">{item.category}</p>
                      <div className="flex items-center justify-between text-[11px] text-zinc-500">
                        <span>{item.donorLabel}</span>
                        <span>{new Date(item.loggedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Boxes className="w-4 h-4 text-emerald-600" />
                Stock
              </CardTitle>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 font-semibold text-zinc-500 uppercase">
                      <th className="py-3 px-4 sm:px-6">Lot Receipt Code</th>
                      <th className="py-3 px-4">Item Category</th>
                      <th className="py-3 px-4">Received</th>
                      <th className="py-3 px-4">Available Stock</th>
                      <th className="py-3 px-4">Condition</th>
                      <th className="py-3 px-4 sm:px-6 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {inventory.map((item) => (
                      <tr key={item.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40">
                        <td className="py-3.5 px-4 sm:px-6 font-mono font-bold text-emerald-700 dark:text-emerald-400">
                          {item.receiptCode}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-zinc-800 dark:text-zinc-200">
                          {item.category}
                        </td>
                        <td className="py-3.5 px-4 font-mono">{item.quantity} units</td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`font-mono font-bold px-2 py-0.5 rounded-full ${
                              item.remainingQuantity > 0
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800'
                            }`}
                          >
                            {item.remainingQuantity} units left
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-zinc-500">{item.condition}</td>
                        <td className="py-3.5 px-4 sm:px-6 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={item.remainingQuantity === 0}
                            onClick={() => {
                              setIssueModalItem(item);
                              setIssueQuantity('1');
                            }}
                            className="text-xs gap-1.5"
                          >
                            <Send className="w-3.5 h-3.5" />
                            Issue to Student Case
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {issueModalItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="max-w-md w-full bg-white dark:bg-zinc-900 shadow-2xl border-zinc-200 dark:border-zinc-800">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Send className="w-4 h-4 text-emerald-600" />
                Issue items
              </CardTitle>
              <CardDescription>
                Lot {issueModalItem.receiptCode}
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleIssueStock}>
              <CardContent className="space-y-4 text-xs">
                <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                  <span className="text-zinc-500 block">Item: {issueModalItem.category}</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">
                    Available in stock: {issueModalItem.remainingQuantity} units
                  </span>
                </div>

                <Input
                  label="Target Case Reference"
                  value={targetCaseRef}
                  onChange={(e) => setTargetCaseRef(e.target.value)}
                  placeholder="e.g. C-ITEM-1234 or Case Number"
                  required
                />

                <Input
                  label="Quantity to Issue"
                  type="number"
                  min="1"
                  max={issueModalItem.remainingQuantity}
                  value={issueQuantity}
                  onChange={(e) => setIssueQuantity(e.target.value)}
                  required
                />
              </CardContent>

              <CardFooter className="flex justify-end gap-2 border-t border-zinc-200 dark:border-zinc-800 p-4">
                <Button type="button" variant="outline" size="sm" onClick={() => setIssueModalItem(null)}>
                  Cancel
                </Button>
                <Button type="submit" variant="emerald" size="sm" disabled={issueMutation.isPending}>
                  {issueMutation.isPending ? 'Recording...' : 'Record Distribution'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};
