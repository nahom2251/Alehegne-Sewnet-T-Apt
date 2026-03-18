-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
  uid UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  role TEXT DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  hidden_modules JSONB DEFAULT '[]'::jsonb
);

-- Create apartments table
CREATE TABLE IF NOT EXISTS public.apartments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number TEXT NOT NULL,
  floor TEXT NOT NULL,
  position TEXT NOT NULL CHECK (position IN ('front', 'back', 'single')),
  tenant_name TEXT,
  tenant_phone TEXT,
  move_in_date DATE,
  monthly_rent NUMERIC DEFAULT 0,
  payment_duration INTEGER DEFAULT 1,
  last_payment_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create bills table
CREATE TABLE IF NOT EXISTS public.bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apartment_id UUID REFERENCES public.apartments(id) ON DELETE CASCADE,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('rent', 'electricity', 'water')),
  amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  kwh NUMERIC,
  rate NUMERIC
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apartments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;

-- Policies for users table
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = uid);

CREATE POLICY "Super admins can view all users" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users WHERE uid = auth.uid() AND role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can update users" ON public.users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users WHERE uid = auth.uid() AND role = 'super_admin'
    )
  );

-- Policies for apartments table
CREATE POLICY "Approved users can view apartments" ON public.apartments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users WHERE uid = auth.uid() AND status = 'approved'
    )
  );

CREATE POLICY "Admins can manage apartments" ON public.apartments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users WHERE uid = auth.uid() AND status = 'approved' AND role IN ('admin', 'super_admin')
    )
  );

-- Policies for bills table
CREATE POLICY "Approved users can view bills" ON public.bills
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users WHERE uid = auth.uid() AND status = 'approved'
    )
  );

CREATE POLICY "Admins can manage bills" ON public.bills
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users WHERE uid = auth.uid() AND status = 'approved' AND role IN ('admin', 'super_admin')
    )
  );

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (uid, email, display_name, role, status)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    CASE WHEN (SELECT COUNT(*) FROM public.users) = 0 THEN 'super_admin' ELSE 'admin' END,
    CASE WHEN (SELECT COUNT(*) FROM public.users) = 0 THEN 'approved' ELSE 'pending' END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user registration
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
