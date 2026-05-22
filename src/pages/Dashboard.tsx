import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Staff, Meal, Expense } from '../types';
import { format } from 'date-fns';
import { motion } from 'motion/react';
import { Users, Utensils, CreditCard, Activity, ArrowRight } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { Link } from 'react-router-dom';

export function Dashboard() {
  const [stats, setStats] = useState({
    totalStaff: 0,
    todayMeals: 0,
    monthlyExpense: 0,
  });
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const startOfMonthStr = format(new Date().setDate(1), 'yyyy-MM-dd');

    // 1. Total Staff
    const staffRes = await supabase.from('staff').select('id', { count: 'exact' });
    
    // 2. Today's Meals
    const mealsRes = await supabase.from('meals').select('id', { count: 'exact' }).eq('date', todayStr);

    // 3. Monthly Expense
    const expensesRes = await supabase.from('expenses').select('amount').gte('date', startOfMonthStr);
    const expenseTotal = expensesRes.data?.reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0;

    // 4. Recent Expenses
    const recentRes = await supabase.from('expenses').select('*').order('date', { ascending: false }).limit(5);

    setStats({
      totalStaff: staffRes.count || 0,
      todayMeals: mealsRes.count || 0,
      monthlyExpense: expenseTotal
    });
    setRecentExpenses((recentRes.data as Expense[]) || []);
    setLoading(false);
  };

  const statCards = [
    { label: 'Total Staff', value: stats.totalStaff, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', link: '/staff' },
    { label: "Today's Meals", value: stats.todayMeals, icon: Utensils, color: 'text-orange-600', bg: 'bg-orange-50', link: '/meals' },
    { label: "Monthly Expense", value: formatCurrency(stats.monthlyExpense), icon: CreditCard, color: 'text-green-600', bg: 'bg-green-50', link: '/expenses' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <header>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Overview</h1>
        <p className="text-gray-500 font-medium mt-1">Status briefing for {format(new Date(), 'EEEE, MMMM do')}</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all"
          >
            <div className={cn("inline-flex p-4 rounded-2xl mb-6 transition-transform group-hover:scale-110", stat.bg, stat.color)}>
              <stat.icon size={28} />
            </div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mb-2">{stat.label}</p>
            <p className="text-3xl font-black text-gray-900 tracking-tighter">{stat.value}</p>
            <Link to={stat.link} className="absolute bottom-8 right-8 p-2 rounded-full hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100">
               <ArrowRight size={20} className="text-gray-400" />
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
               <div className="p-2 bg-gray-900 rounded-xl text-white">
                 <Activity size={20} />
               </div>
               <h2 className="text-xl font-bold text-gray-900 tracking-tight">Recent Activity</h2>
            </div>
          </div>
          
          <div className="space-y-6">
            {recentExpenses.length > 0 ? recentExpenses.map((ex) => (
              <div key={ex.id} className="flex items-start justify-between group">
                <div className="flex gap-4">
                  <div className="p-3 bg-gray-50 rounded-2xl group-hover:bg-gray-100 transition-colors">
                    <CreditCard size={18} className="text-gray-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{ex.description}</p>
                    <p className="text-xs text-gray-400 font-medium font-mono">{format(new Date(ex.date), 'MMM dd')}</p>
                  </div>
                </div>
                <p className="font-black text-gray-900 text-lg">{formatCurrency(ex.amount)}</p>
              </div>
            )) : (
              <p className="text-center py-12 text-gray-400 italic font-medium">No recent expenses tracked.</p>
            )}
          </div>

          <div className="mt-8 pt-8 border-t border-gray-50">
            <Link to="/expenses" className="text-sm font-bold text-gray-900 flex items-center gap-2 hover:gap-3 transition-all">
              View all expenses <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        <div className="bg-gray-900 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden text-white flex flex-col justify-between min-h-[400px]">
          <div className="relative z-10">
            <h2 className="text-2xl font-bold tracking-tight mb-2">Office Mess Guidelines</h2>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
              Ensure all daily records are updated before 9 PM. Monthly reports are generated automatically.
            </p>
          </div>
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-4 p-4 bg-white/10 rounded-2xl backdrop-blur-md">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <p className="text-xs font-bold uppercase tracking-widest text-gray-300">System Online</p>
            </div>
            <div className="flex items-center gap-4 p-4 bg-white/10 rounded-2xl backdrop-blur-md">
              <Utensils size={18} className="text-orange-400" />
              <p className="text-xs font-bold uppercase tracking-widest text-gray-300">Meals synced to cloud</p>
            </div>
          </div>
          <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        </div>
      </div>
    </motion.div>
  );
}
