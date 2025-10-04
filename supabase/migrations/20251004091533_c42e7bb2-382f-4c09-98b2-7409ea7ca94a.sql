-- Create site_settings table for managing category-specific settings
CREATE TABLE IF NOT EXISTS public.site_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  logo_link TEXT,
  tag_cloud_count INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create site_links table for managing navigation links per category
CREATE TABLE IF NOT EXISTS public.site_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  display_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT max_9_links CHECK (display_order >= 1 AND display_order <= 9)
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_links ENABLE ROW LEVEL SECURITY;

-- RLS policies for site_settings
CREATE POLICY "Site settings are viewable by everyone"
ON public.site_settings
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can update site settings"
ON public.site_settings
FOR UPDATE
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert site settings"
ON public.site_settings
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- RLS policies for site_links
CREATE POLICY "Site links are viewable by everyone"
ON public.site_links
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can manage site links"
ON public.site_links
FOR ALL
USING (auth.role() = 'authenticated');

-- Add trigger for updated_at
CREATE TRIGGER update_site_settings_updated_at
BEFORE UPDATE ON public.site_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings for each category
INSERT INTO public.site_settings (category, tag_cloud_count)
VALUES 
  ('yegge', 10),
  ('angershade', 10),
  ('the-corruptive', 10)
ON CONFLICT (category) DO NOTHING;