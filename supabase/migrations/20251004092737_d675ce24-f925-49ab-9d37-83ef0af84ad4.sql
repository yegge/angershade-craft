-- Phase 1: Create Role-Based Access Control System

-- 1. Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'author', 'reader');

-- 2. Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
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

-- 4. Now create RLS policies for user_roles (after function exists)
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 5. Update handle_new_user function with proper search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))
  );
  
  -- Assign 'reader' role by default to new users
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'reader'::public.app_role);
  
  RETURN new;
END;
$$;

-- 6. Update site_settings RLS policies to require admin role
DROP POLICY IF EXISTS "Authenticated users can update site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Authenticated users can insert site settings" ON public.site_settings;

CREATE POLICY "Only admins can update site settings"
ON public.site_settings
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can insert site settings"
ON public.site_settings
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete site settings"
ON public.site_settings
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 7. Update site_links RLS policies to require admin role
DROP POLICY IF EXISTS "Authenticated users can manage site links" ON public.site_links;

CREATE POLICY "Only admins can insert site links"
ON public.site_links
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update site links"
ON public.site_links
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete site links"
ON public.site_links
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 8. Update posts RLS policies to use roles
DROP POLICY IF EXISTS "Authors can insert their own posts" ON public.posts;
DROP POLICY IF EXISTS "Authors can update their own posts" ON public.posts;
DROP POLICY IF EXISTS "Authors can delete their own posts" ON public.posts;

CREATE POLICY "Authors and admins can insert posts"
ON public.posts
FOR INSERT
WITH CHECK (
  auth.uid() = author_id 
  AND (public.has_role(auth.uid(), 'author'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role))
);

CREATE POLICY "Authors can update their own posts, admins can update all"
ON public.posts
FOR UPDATE
USING (
  auth.uid() = author_id 
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Authors can delete their own posts, admins can delete all"
ON public.posts
FOR DELETE
USING (
  auth.uid() = author_id 
  OR public.has_role(auth.uid(), 'admin'::app_role)
);