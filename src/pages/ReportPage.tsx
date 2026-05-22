import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Staff, Meal, Expense, MonthlyReport } from '../types';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { motion } from 'motion/react';
import { formatCurrency } from '../lib/utils';
import { Calendar, Download, TrendingUp, Users, Utensils } from 'lucide-react';

export function ReportPage() {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [reportData, setReportData] = useState<MonthlyReport[]>([]);
  const [totalExpense, setTotalExpense] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [selectedMonth]);

  const fetchData = async () => {
    setLoading(true);
    const start = format(startOfMonth(selectedMonth), 'yyyy-MM-dd');
    const end = format(endOfMonth(selectedMonth), 'yyyy-MM-dd');

    // 1. Fetch all staff
    const staffRes = await supabase.from('staff').select('*');
    const staffList = (staffRes.data as Staff[]) || [];

    // 2. Fetch meals for this month
    const mealsRes = await supabase.from('meals').select('*').gte('date', start).lte('date', end);
    const mealsList = (mealsRes.data as Meal[]) || [];

    // 3. Fetch expenses for this month
    const expensesRes = await supabase.from('expenses').select('*').gte('date', start).lte('date', end);
    const expensesList = (expensesRes.data as Expense[]) || [];

    const monthTotalExpense = expensesList.reduce((acc, curr) => acc + curr.amount, 0);
    setTotalExpense(monthTotalExpense);

    // 4. Calculate per person
    const data: MonthlyReport[] = staffList.map(s => {
      const staffMeals = mealsList.filter(m => m.staffId === s.staffId);
      const breakfast = staffMeals.filter(m => m.mealType === 'breakfast').length;
      const lunch = staffMeals.filter(m => m.mealType === 'lunch').length;
      const dinner = staffMeals.filter(m => m.mealType === 'dinner').length;
      const total = breakfast + lunch + dinner;

      return {
        staffId: s.staffId,
        name: s.name,
        breakfastCount: breakfast,
        lunchCount: lunch,
        dinnerCount: dinner,
        totalMeals: total,
        shareOfExpense: staffList.length > 0 ? monthTotalExpense / staffList.length : 0
      };
    });

    setReportData(data);
    setLoading(false);
  };

  const changeMonth = (offset: number) => {
    const newDate = new Date(selectedMonth);
    newDate.setMonth(newDate.getMonth() + offset);
    setSelectedMonth(newDate);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-6xl mx-auto"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Monthly Report</h1>
          <p className="text-gray-500 mt-1 font-medium">Detailed summary for {format(selectedMonth, 'MMMM yyyy')}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs text-sm font-bold">
            <button onClick={() => changeMonth(-1)} className="p-2.5 hover:bg-gray-50 transition-colors border-r border-gray-200">
               <Calendar size={18} className="rotate-180" />
            </button>
            <span className="px-5 py-2.5 text-gray-900 min-w-[120px] text-center">{format(selectedMonth, 'MMM yyyy')}</span>
            <button onClick={() => changeMonth(1)} className="p-2.5 hover:bg-gray-50 transition-colors border-l border-gray-200">
               <Calendar size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Monthly Expense</p>
            <p className="text-2xl font-black text-gray-900">{formatCurrency(totalExpense)}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-2xl text-gray-900">
             <TrendingUp size={24} />
          </div>
        </div>
         <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Per Head Cost</p>
            <p className="text-2xl font-black text-gray-900">
              {formatCurrency(reportData.length > 0 ? totalExpense / reportData.length : 0)}
            </p>
          </div>
          <div className="p-3 bg-gray-50 rounded-2xl text-gray-900">
             <Users size={24} />
          </div>
        </div>
         <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Meals Served</p>
            <p className="text-2xl font-black text-gray-900">
              {reportData.reduce((acc, curr) => acc + curr.totalMeals, 0)}
            </p>
          </div>
          <div className="p-3 bg-gray-50 rounded-2xl text-gray-900">
             <Utensils size={24} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-12">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Staff Member</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Breakfast</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Lunch</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Dinner</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Total Meals</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Per Head Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reportData.map((row) => (
                <tr key={row.staffId} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-5">
                    <span className="font-bold text-gray-900">{row.name}</span>
                    <span className="block text-xs text-gray-400 font-mono italic">{row.staffId}</span>
                  </td>
                  <td className="px-6 py-5 text-center font-medium text-gray-600">{row.breakfastCount}</td>
                  <td className="px-6 py-5 text-center font-medium text-gray-600">{row.lunchCount}</td>
                  <td className="px-6 py-5 text-center font-medium text-gray-600">{row.dinnerCount}</td>
                  <td className="px-6 py-5 text-center">
                    <span className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-bold bg-gray-900 text-white">
                        {row.totalMeals}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right font-black text-gray-900">
                    {formatCurrency(row.shareOfExpense)}
                  </td>
                </tr>
              ))}
              {reportData.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400 italic">
                    No data available for this month.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
