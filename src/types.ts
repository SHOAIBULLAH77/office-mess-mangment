export interface Staff {
  id: string;
  name: string;
  staffId: string;
  role?: string;
  createdAt: number;
}

export interface Meal {
  id: string;
  staffId: string;
  date: string; // YYYY-MM-DD
  mealType: 'breakfast' | 'lunch' | 'dinner';
  createdAt: number;
}

export interface Expense {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  amount: number;
  category: 'groceries' | 'cooking' | 'other';
  createdAt: number;
}

export interface MonthlyReport {
  staffId: string;
  name: string;
  breakfastCount: number;
  lunchCount: number;
  dinnerCount: number;
  totalMeals: number;
  shareOfExpense: number;
}
