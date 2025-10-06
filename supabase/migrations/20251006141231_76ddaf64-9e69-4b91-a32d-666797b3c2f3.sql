-- Create a security definer function to check if users have appointments together
CREATE OR REPLACE FUNCTION public.has_appointment_with(_user_id uuid, _profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.appointments
    WHERE (
      (buyer_id = _user_id AND supplier_id = _profile_id)
      OR (supplier_id = _user_id AND buyer_id = _profile_id)
    )
  )
$$;

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create a new restricted policy
CREATE POLICY "Users can view own profile and appointment contacts"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = id  -- Can view own profile
  OR public.has_appointment_with(auth.uid(), id)  -- Can view profiles of people they have appointments with
  OR public.has_role(auth.uid(), 'admin'::app_role)  -- Admins can view all
);