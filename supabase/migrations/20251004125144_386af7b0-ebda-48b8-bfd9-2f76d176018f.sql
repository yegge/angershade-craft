-- Phase 2: Fix database function security by adding search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Phase 3: Fix profiles RLS policy - restrict to authenticated users only
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

CREATE POLICY "Authenticated users can view profiles"
ON public.profiles
FOR SELECT
USING (auth.role() = 'authenticated');

-- Phase 1: Add server-side HTML sanitization trigger for defense in depth
-- This prevents malicious content from entering the database
CREATE OR REPLACE FUNCTION public.sanitize_post_html()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  -- Basic sanitization: strip script tags and dangerous attributes
  -- This is a defense-in-depth measure; client-side DOMPurify is the primary protection
  NEW.content_html := regexp_replace(NEW.content_html, '<script[^>]*>.*?</script>', '', 'gi');
  NEW.content_html := regexp_replace(NEW.content_html, 'on\w+\s*=\s*"[^"]*"', '', 'gi');
  NEW.content_html := regexp_replace(NEW.content_html, 'on\w+\s*=\s*''[^'']*''', '', 'gi');
  NEW.content_html := regexp_replace(NEW.content_html, 'javascript:', '', 'gi');
  RETURN NEW;
END;
$function$;

-- Create trigger for posts table
DROP TRIGGER IF EXISTS sanitize_post_html_trigger ON public.posts;

CREATE TRIGGER sanitize_post_html_trigger
BEFORE INSERT OR UPDATE OF content_html ON public.posts
FOR EACH ROW
EXECUTE FUNCTION public.sanitize_post_html();