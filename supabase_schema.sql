-- Create staff table
CREATE TABLE staff (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  staffId text NOT NULL UNIQUE,
  role text,
  created_at timestamptz DEFAULT now()
);

-- Create meals table
CREATE TABLE meals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  staffId text NOT NULL,
  date date NOT NULL,
  mealType text NOT NULL CHECK (mealType IN ('breakfast', 'lunch', 'dinner')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(staffId, date, mealType)
);

-- Create expenses table
CREATE TABLE expenses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  date date NOT NULL,
  description text NOT NULL,
  amount decimal(10,2) NOT NULL,
  category text NOT NULL CHECK (category IN ('groceries', 'cooking', 'other')),
  created_at timestamptz DEFAULT now()
);

-- Basic RLS for simple dashboard (Enable RLS and add policies as needed)
-- ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
