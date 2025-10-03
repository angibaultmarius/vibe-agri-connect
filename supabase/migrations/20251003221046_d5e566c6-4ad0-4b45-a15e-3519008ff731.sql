-- Create user roles enum
CREATE TYPE public.user_type AS ENUM ('buyer', 'supplier');
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  company TEXT NOT NULL,
  user_type user_type NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- User roles policies
CREATE POLICY "Users can view all roles"
  ON public.user_roles FOR SELECT
  USING (true);

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create meeting tables
CREATE TABLE public.meeting_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_number INTEGER UNIQUE NOT NULL CHECK (table_number >= 1 AND table_number <= 40),
  location TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.meeting_tables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view tables"
  ON public.meeting_tables FOR SELECT
  USING (true);

-- Create time slots
CREATE TABLE public.time_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.time_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view time slots"
  ON public.time_slots FOR SELECT
  USING (true);

-- Create appointments table
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  supplier_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  time_slot_id UUID REFERENCES public.time_slots(id) ON DELETE CASCADE NOT NULL,
  table_id UUID REFERENCES public.meeting_tables(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Appointments policies
CREATE POLICY "Users can view their own appointments"
  ON public.appointments FOR SELECT
  USING (auth.uid() = buyer_id OR auth.uid() = supplier_id);

CREATE POLICY "Admins can view all appointments"
  ON public.appointments FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create appointments"
  ON public.appointments FOR INSERT
  WITH CHECK (auth.uid() = buyer_id OR auth.uid() = supplier_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update their own appointments"
  ON public.appointments FOR UPDATE
  USING (auth.uid() = buyer_id OR auth.uid() = supplier_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can delete their own appointments"
  ON public.appointments FOR DELETE
  USING (auth.uid() = buyer_id OR auth.uid() = supplier_id OR public.has_role(auth.uid(), 'admin'));

-- Insert 40 meeting tables
INSERT INTO public.meeting_tables (table_number, location)
SELECT generate_series, 'Salle principale'
FROM generate_series(1, 40);

-- Generate time slots for both days (30-minute intervals)
-- Tuesday January 14, 2025: 14h-18h (8 slots)
-- Wednesday January 15, 2025: 9h-13h (8 slots)

INSERT INTO public.time_slots (slot_date, start_time, end_time)
SELECT 
  '2025-01-14'::DATE,
  (time '14:00' + (interval '30 minutes' * generate_series))::TIME,
  (time '14:30' + (interval '30 minutes' * generate_series))::TIME
FROM generate_series(0, 7)
UNION ALL
SELECT 
  '2025-01-15'::DATE,
  (time '09:00' + (interval '30 minutes' * generate_series))::TIME,
  (time '09:30' + (interval '30 minutes' * generate_series))::TIME
FROM generate_series(0, 7);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, company, user_type)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'company', 'Company'),
    COALESCE((NEW.raw_user_meta_data->>'user_type')::user_type, 'buyer')
  );
  
  -- Assign user role by default
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();