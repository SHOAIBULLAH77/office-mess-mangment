import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Expense } from '../types';
import { Plus, Trash2, IndianRupee, Search, X, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { formatCurrency } from '../lib/utils';

export function ExpensePage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form state
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<'groceries' | 'cooking' | 'other'>('groceries');

  useEffect(() => {
    fetchExpenses();

    const channel = supabase
      .channel('expense-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, () => {
        fetchExpenses();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchExpenses = async () => {
    const { data } = await supabase
      .from('expenses')
      .select('*')
      .order('date', { ascending: false });
    if (data) setExpenses(data as Expense[]);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('expenses')
        .insert([{
          date,
          description,
          amount: parseFloat(amount),
          category
        }]);
      if (error) throw error;
      setIsModalOpen(false);
      setDescription('');
      setAmount('');
    } catch (error: any) {
      console.error("Error saving expense:", error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Delete this expense record?")) {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);
      if (error) console.error("Error deleting expense:", error.message);
    }
  };

  const filteredExpenses = expenses.filter(ex =>
    ex.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="max-w-4xl mx-auto"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Expense Records</h1>
          <p className="text-gray-500 mt-1 font-medium">Track groceries and mess running costs</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-gray-800 transition-all shadow-sm"
        >
          <Plus size={20} />
          Add Expense
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-bottom border-gray-100 bg-gray-50/50 flex items-center gap-3">
          <Search className="text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search expenses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-none focus:ring-0 text-sm w-full placeholder-gray-400"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredExpenses.map((ex) => (
                <tr key={ex.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4 text-sm font-medium text-gray-600 font-mono">{ex.date}</td>
                  <td className="px-6 py-4 font-semibold text-gray-900">{ex.description}</td>
                  <td className="px-6 py-4 capitalize">
                     <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200">
                        {ex.category}
                     </span>
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-gray-900">{formatCurrency(ex.amount)}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDelete(ex.id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredExpenses.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400 italic">
                    No records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h3 className="text-xl font-bold text-gray-900 tracking-tight">Add Expense</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Date</label>
                  <input
                    required
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-gray-900 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Description</label>
                  <input
                    required
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-gray-900 outline-none transition-all"
                    placeholder="E.g. Weekly Groceries"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Amount</label>
                    <input
                      required
                      type="number"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-gray-900 outline-none transition-all"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as any)}
                      className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-gray-900 outline-none transition-all appearance-none"
                    >
                      <option value="groceries">Groceries</option>
                      <option value="cooking">Cooking</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold shadow-lg shadow-gray-900/20 hover:bg-gray-800 transition-all active:scale-[0.98]"
                  >
                    Save Expense
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
