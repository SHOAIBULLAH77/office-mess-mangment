import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Staff, Meal } from '../types';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { format, addDays, subDays } from 'date-fns';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export function MealPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);

  const dateKey = format(selectedDate, 'yyyy-MM-dd');

  useEffect(() => {
    fetchStaffAndMeals();

    const channel = supabase
      .channel('meal-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meals' }, () => {
        fetchMeals();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [dateKey]);

  const fetchStaffAndMeals = async () => {
     const [staffRes, mealsRes] = await Promise.all([
       supabase.from('staff').select('*').order('name'),
       supabase.from('meals').select('*').eq('date', dateKey)
     ]);

     if (staffRes.data) setStaff(staffRes.data as Staff[]);
     if (mealsRes.data) setMeals(mealsRes.data as Meal[]);
     setLoading(false);
  };

  const fetchMeals = async () => {
    const { data } = await supabase
      .from('meals')
      .select('*')
      .eq('date', dateKey);
    if (data) setMeals(data as Meal[]);
  };

  const toggleMeal = async (staffId: string, mealType: 'breakfast' | 'lunch' | 'dinner') => {
    const existingMeal = meals.find(m => m.staffId === staffId && m.mealType === mealType);

    if (existingMeal) {
      await supabase
        .from('meals')
        .delete()
        .eq('id', existingMeal.id);
    } else {
      await supabase
        .from('meals')
        .insert([{
          staffId,
          date: dateKey,
          mealType
        }]);
    }
  };

  const hasMeal = (staffId: string, mealType: string) => {
    return meals.some(m => m.staffId === staffId && m.mealType === mealType);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Daily Meal Record</h1>
          <p className="text-gray-500 mt-1 font-medium">Mark meals for {format(selectedDate, 'MMMM do, yyyy')}</p>
        </div>
        <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-gray-200">
          <button
            onClick={() => setSelectedDate(subDays(selectedDate, 1))}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="px-4 font-bold text-gray-900 text-sm whitespace-nowrap">
            {format(selectedDate, 'EEE, MMM d')}
          </span>
          <button
            onClick={() => setSelectedDate(addDays(selectedDate, 1))}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Staff Member</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Breakfast</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Lunch</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Dinner</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {staff.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-semibold text-gray-900">{s.name}</span>
                    <span className="block text-xs text-gray-400 font-mono tracking-tighter">{s.staffId}</span>
                  </td>
                  {(['breakfast', 'lunch', 'dinner'] as const).map((type) => (
                    <td key={type} className="px-6 py-4 text-center">
                      <button
                        onClick={() => toggleMeal(s.staffId, type)}
                        className={cn(
                          "w-12 h-12 rounded-xl border-2 flex items-center justify-center mx-auto transition-all transition-colors active:scale-90",
                          hasMeal(s.staffId, type)
                            ? "bg-gray-900 border-gray-900 text-white shadow-md shadow-gray-900/20"
                            : "bg-white border-gray-100 text-transparent hover:border-gray-200"
                        )}
                      >
                        <Check size={20} className={hasMeal(s.staffId, type) ? "opacity-100" : "opacity-0"} />
                      </button>
                    </td>
                  ))}
                </tr>
              ))}
              {staff.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-400 italic">
                    Please add staff members first.
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
