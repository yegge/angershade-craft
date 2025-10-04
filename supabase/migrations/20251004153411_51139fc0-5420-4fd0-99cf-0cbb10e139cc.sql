-- Add font and color customization fields to site_settings
ALTER TABLE public.site_settings
ADD COLUMN IF NOT EXISTS primary_font TEXT DEFAULT 'Inter',
ADD COLUMN IF NOT EXISTS secondary_font TEXT DEFAULT 'Inter',
ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS secondary_color TEXT DEFAULT '#666666',
ADD COLUMN IF NOT EXISTS accent_color TEXT DEFAULT '#0066cc',
ADD COLUMN IF NOT EXISTS background_color TEXT DEFAULT '#ffffff';