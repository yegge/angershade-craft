import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Menu, X } from "lucide-react";

type SiteSettings = {
  logo_url: string | null;
  logo_link: string | null;
  tag_cloud_count: number;
};

type SiteLink = {
  id: string;
  title: string;
  url: string;
  display_order: number;
};

type CategoryHeaderProps = {
  category: string;
};

export const CategoryHeader = ({ category }: CategoryHeaderProps) => {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [links, setLinks] = useState<SiteLink[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("*")
        .eq("category", category)
        .single();
      
      if (data) {
        setSettings(data);
      }
    };

    const fetchLinks = async () => {
      const { data } = await supabase
        .from("site_links")
        .select("*")
        .eq("category", category)
        .order("display_order");
      
      if (data) {
        setLinks(data);
      }
    };

    const fetchTags = async () => {
      const { data } = await supabase
        .from("tags")
        .select("name")
        .limit(settings?.tag_cloud_count || 10);
      
      if (data) {
        const shuffled = [...data].sort(() => Math.random() - 0.5);
        setTags(shuffled.map(t => t.name));
      }
    };

    fetchSettings();
    fetchLinks();
    fetchTags();
  }, [category, settings?.tag_cloud_count]);

  return (
    <>
      {/* Desktop Header */}
      <header className="hidden md:block border-b border-foreground/10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between gap-8">
            {/* Logo */}
            <div className="flex-shrink-0">
              {settings?.logo_url ? (
                <a href={settings.logo_link || "#"} target="_blank" rel="noopener noreferrer">
                  <img src={settings.logo_url} alt="Logo" className="h-12 w-auto" />
                </a>
              ) : (
                <Link to={`/${category}`} className="text-2xl font-bold">
                  {category === 'the-corruptive' ? 'The Corruptive' : category.charAt(0).toUpperCase() + category.slice(1)}
                </Link>
              )}
            </div>

            {/* Navigation Links */}
            <nav className="flex items-center gap-6">
              {links.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium hover:underline transition-all"
                  style={{ color: 'var(--link-color)' }}
                >
                  {link.title}
                </a>
              ))}
            </nav>

            {/* Tag Cloud */}
            <div className="flex flex-wrap items-center gap-2 max-w-md">
              {tags.map((tag, idx) => (
                <Link
                  key={idx}
                  to={`/tag?tag=${encodeURIComponent(tag)}`}
                  className="text-xs px-2 py-1 bg-foreground/5 rounded-full hover:bg-foreground/10 transition-colors cursor-pointer"
                  style={{ fontSize: `${0.7 + Math.random() * 0.4}rem` }}
                >
                  {tag}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="md:hidden sticky top-0 z-50 bg-background border-b border-foreground/10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex-shrink-0">
            {settings?.logo_url ? (
              <a href={settings.logo_link || "#"} target="_blank" rel="noopener noreferrer">
                <img src={settings.logo_url} alt="Logo" className="h-8 w-auto" />
              </a>
            ) : (
              <Link to={`/${category}`} className="text-xl font-bold">
                {category === 'the-corruptive' ? 'The Corruptive' : category.charAt(0).toUpperCase() + category.slice(1)}
              </Link>
            )}
          </div>
          
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-background/95 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-8 h-full flex flex-col justify-between">
            {/* Logo */}
            <div className="text-center">
              {settings?.logo_url ? (
                <a href={settings.logo_link || "#"} target="_blank" rel="noopener noreferrer">
                  <img src={settings.logo_url} alt="Logo" className="h-16 w-auto mx-auto" />
                </a>
              ) : (
                <Link to={`/${category}`} className="text-3xl font-bold">
                  {category === 'the-corruptive' ? 'The Corruptive' : category.charAt(0).toUpperCase() + category.slice(1)}
                </Link>
              )}
            </div>

            {/* Tag Cloud */}
            <div className="flex flex-wrap items-center justify-center gap-3 my-8">
              {tags.map((tag, idx) => (
                <Link
                  key={idx}
                  to={`/tag?tag=${encodeURIComponent(tag)}`}
                  className="text-sm px-3 py-2 bg-foreground/5 rounded-full hover:bg-foreground/10 transition-colors cursor-pointer"
                  style={{ fontSize: `${0.8 + Math.random() * 0.5}rem` }}
                >
                  {tag}
                </Link>
              ))}
            </div>

            {/* Navigation Links */}
            <nav className="flex flex-col items-center gap-4">
              {links.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-lg font-medium hover:underline transition-all"
                  style={{ color: 'var(--link-color)' }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.title}
                </a>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  );
};
