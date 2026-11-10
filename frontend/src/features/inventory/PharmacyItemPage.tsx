import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  PackageCheck,
  CheckCircle2,
  History,
  ShieldCheck,
  ExternalLink,
  Layers,
  ArrowRight,
  Send,
  Boxes,
  QrCode,
  Tag,
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
  txHash: string;
  blockNumber: number;
}

export const PharmacyItemPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'INTAKE' | 'INVENTORY'>('INTAKE');

  // Intake Form State
  const [category, setCategory] = useState('Medical Textbooks / Study Materials');
  const [quantity, setQuantity] = useState('10');
  const [condition, setCondition] = useState('Good / Lightly Used');
  const [donorLabel, setDonorLabel] = useState('');
  const [justLoggedItem, setJustLoggedItem] = useState<InKindItem | null>(null);

  // Issue Stock Modal State
  const [issueModalItem, setIssueModalItem] = useState<InKindItem | null>(null);
  const [issueQuantity, setIssueQuantity] = useState('2');
  const [targetCaseRef, setTargetCaseRef] = useState('CASE-2026-0143');

  const [inventory, setInventory] = useState<InKindItem[]>([
    {
      id: 'itm-1',
      receiptCode: 'MLK-ITEM-9201',
      category: 'Medical Textbooks / Study Materials',
      quantity: 15,
      remainingQuantity: 12,
      condition: 'Good / Lightly Used',
      donorLabel: 'Graduating Class of 2025',
      loggedAt: '2026-10-24T12:00:00Z',
      txHash: '0x99aa88bb77cc66dd55ee44ff33aa22bb11cc00dd99887766554433221100ffaa',
      blockNumber: 4221500,
    },
    {
      id: 'itm-2',
      receiptCode: 'MLK-ITEM-8812',
      category: 'Prescription Antibiotics & First Aid',
      quantity: 20,
      remainingQuantity: 15,
      condition: 'New / Sealed',
      donorLabel: 'University Hospital Staff Donation',
      loggedAt: '2026-10-22T09:30:00Z',
      txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      blockNumber: 4219400,
    },
    {
      id: 'itm-3',
      receiptCode: 'MLK-ITEM-4401',
      category: 'Personal Hygiene & Care Kits',
      quantity: 8,
      remainingQuantity: 8,
      condition: 'New / Sealed',
      donorLabel: 'Campus Red Cross Chapter',
      loggedAt: '2026-10-26T14:15:00Z',
      txHash: '0x556677889900aabbccddeeff00112233445566778899aabbccddeeff00112233',
      blockNumber: 4222100,
    },
  ]);

  const categories = [
    'Medical Textbooks / Study Materials',
    'Prescription Antibiotics & First Aid',
    'Personal Hygiene & Care Kits',
    'Lab Coats & PPE Gear',
    'Dry Food & Meal Rations',
  ];

  const conditions = ['New / Sealed', 'Good / Lightly Used', 'Acceptable'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseInt(quantity, 10);
    if (!qty || qty <= 0) return;

    const receiptSuffix = Math.floor(1000 + Math.random() * 9000);
    const fakeTx = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
    const generatedReceipt = `MLK-ITEM-${receiptSuffix}`;

    const newItem: InKindItem = {
      id: `itm-${Date.now()}`,
      receiptCode: generatedReceipt,
      category,
      quantity: qty,
      remainingQuantity: qty,
      condition,
      donorLabel: donorLabel.trim() || 'Anonymous Hospital Walk-in',
      loggedAt: new Date().toISOString(),
      txHash: fakeTx,
      blockNumber: 4222300 + Math.floor(Math.random() * 50),
    };

    api.registerInKindItem({
      receiptCode: newItem.receiptCode,
      category: newItem.category,
      quantity: newItem.quantity,
      donorLabel: newItem.donorLabel,
      txHash: newItem.txHash,
      blockNumber: newItem.blockNumber,
    });

    setInventory([newItem, ...inventory]);
    setJustLoggedItem(newItem);
    setQuantity('5');
    setDonorLabel('');
  };

  const handleIssueStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueModalItem) return;
    const qtyToIssue = parseInt(issueQuantity, 10);
    if (!qtyToIssue || qtyToIssue > issueModalItem.remainingQuantity) {
      alert('Issue quantity exceeds available stock!');
      return;
    }

    api.issueInKindStock(issueModalItem.receiptCode, targetCaseRef, qtyToIssue);

    setInventory((prev) =>
      prev.map((item) => {
        if (item.id === issueModalItem.id) {
          return {
            ...item,
            remainingQuantity: item.remainingQuantity - qtyToIssue,
          };
        }
        return item;
      })
    );

    alert(`Successfully issued ${qtyToIssue} items from Lot ${issueModalItem.receiptCode} to ${targetCaseRef}! Recorded on inventory ledger.`);
    setIssueModalItem(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title & Desk Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2.5">
            <PackageCheck className="w-6 h-6 text-emerald-600" />
            University Hospital Pharmacy Custodian Desk
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Malkia Hospital Drop-off Hub. Physical items are logged, anchored on Polygon Amoy (`Channel.IN_KIND`), and tracked to student distributions.
          </p>
        </div>

        {/* Tab Switcher */}
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

      {/* Just Logged Success Certificate Card */}
      {justLoggedItem && (
        <Card className="border-emerald-500/40 bg-emerald-50/30 dark:bg-emerald-950/20 overflow-hidden shadow-md animate-in fade-in slide-in-from-top-2">
          <div className="p-5 sm:p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                    Physical Item Notarized on Polygon Amoy!
                  </h3>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    {justLoggedItem.quantity} units of {justLoggedItem.category} logged into Malkia inventory.
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

            {/* Generated Receipt Code & Blockchain Tracking Link */}
            <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-xs">
              <div>
                <span className="text-[11px] text-zinc-400 block font-sans">Item Lot Receipt Code (Hand to Donor):</span>
                <span className="text-base font-extrabold text-emerald-700 dark:text-emerald-400">
                  {justLoggedItem.receiptCode}
                </span>
                <span className="block text-[11px] text-zinc-500 font-sans mt-0.5">
                  Tx Hash: {justLoggedItem.txHash.slice(0, 16)}... (Block #{justLoggedItem.blockNumber})
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
          {/* Quick Intake Form */}
          <Card className="lg:col-span-7">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Tag className="w-4 h-4 text-emerald-600" />
                Key In New Tangible Item Drop-off
              </CardTitle>
              <CardDescription>
                Designed for speed on a custodian's phone or tablet. Complete in under 30 seconds.
              </CardDescription>
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
                        <option key={cond} value={cond}>
                          {cond}
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
                <Button type="submit" variant="emerald" size="lg" className="w-full text-sm font-bold gap-2">
                  <PackageCheck className="w-5 h-5" />
                  Key In & Anchor Item Lot on Chain
                </Button>
              </CardFooter>
            </form>
          </Card>

          {/* Recent Pharmacy Receipts */}
          <Card className="lg:col-span-5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <History className="w-4 h-4 text-zinc-500" />
                Recent Hospital Drop-offs
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-zinc-200 dark:divide-zinc-800 text-xs">
                {inventory.map((item) => (
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
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Inventory Stock & Case Issuing Tab */
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Boxes className="w-4 h-4 text-emerald-600" />
                Current Hospital Pharmacy In-Kind Stock
              </CardTitle>
              <CardDescription>
                Physical goods in stock ready to be issued to verified student cases (FR-FLOW-05).
              </CardDescription>
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

      {/* Issue to Student Case Modal */}
      {issueModalItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="max-w-md w-full bg-white dark:bg-zinc-900 shadow-2xl border-zinc-200 dark:border-zinc-800">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Send className="w-4 h-4 text-emerald-600" />
                Issue Items to Student Need Case
              </CardTitle>
              <CardDescription>
                Transfer physical inventory from Lot {issueModalItem.receiptCode} to an approved case.
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
                  placeholder="e.g. CASE-2026-0143"
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
                <Button type="submit" variant="emerald" size="sm">
                  Record Distribution
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};
