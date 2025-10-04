import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Menu, X } from "lucide-react";
import { Button } from "./ui/button";

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

const CategoryHeader = ({ category }: CategoryHeaderProps) => {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [links, setLinks] = useState<SiteLink[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchLinks();
    fetchTags();
  }, [category]);

  const fetchSettings = async () => {
    const { data } = await supabase
      .from("site_settings")
      .select("*")
      .eq("category", category)
      .single();
    
    if (data) setSettings(data);
  };

  const fetchLinks = async () => {
    const { data } = await supabase
      .from("site_links")
      .select("*")
      .eq("category", category)
      .order("display_order");
    
    if (data) setLinks(data);
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

  return (
    <>
      {/* Desktop Header */}
      <header className="hidden lg:block py-6 px-4 border-b border-border/50">
        <div className="container mx-auto flex items-center justify-between gap-8">
          {/* Logo */}
          <div className="flex-shrink-0">
            {settings?.logo_url && (
              <a href={settings.logo_link || "#"} target="_blank" rel="noopener noreferrer">
                <img src={settings.logo_url} alt="Logo" className="h-12 object-contain" />
              </a>
            )}
          </div>

          {/* Tag Cloud */}
          <div className="flex-1 flex flex-wrap gap-2 justify-center">
            {tags.map((tag, idx) => (
              <span
                key={idx}
                className="text-sm px-2 py-1 rounded opacity-70 hover:opacity-100 transition-opacity"
                style={{ fontSize: `${0.75 + Math.random() * 0.5}rem` }}
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Links */}
          <nav className="flex gap-4 flex-shrink-0">
            {links.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-70 transition-opacity whitespace-nowrap"
              >
                {link.title}
              </a>
            ))}
          </nav>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="lg:hidden py-4 px-4 border-b border-border/50 flex justify-between items-center">
        {settings?.logo_url && (
          <a href={settings.logo_link || "#"} target="_blank" rel="noopener noreferrer">
            <img src={settings.logo_url} alt="Logo" className="h-10 object-contain" />
          </a>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMenuOpen(!menuOpen)}
          className="z-50"
        >
          {menuOpen ? <X /> : <Menu />}
        </Button>
      </header>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="lg:hidden fixed inset-0 bg-background/95 backdrop-blur-sm z-40 flex flex-col items-center justify-center gap-8 p-8">
          {/* Logo */}
          {settings?.logo_url && (
            <a href={settings.logo_link || "#"} target="_blank" rel="noopener noreferrer">
              <img src={settings.logo_url} alt="Logo" className="h-16 object-contain" />
            </a>
          )}

          {/* Tag Cloud */}
          <div className="flex flex-wrap gap-2 justify-center max-w-md">
            {tags.map((tag, idx) => (
              <span
                key={idx}
                className="text-sm px-2 py-1 rounded opacity-70"
                style={{ fontSize: `${0.75 + Math.random() * 0.5}rem` }}
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Links */}
          <nav className="flex flex-col gap-4 text-center">
            {links.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-lg hover:opacity-70 transition-opacity"
                onClick={() => setMenuOpen(false)}
              >
                {link.title}
              </a>
            ))}
          </nav>
        </div>
      )}
    </>
  );
};

export default CategoryHeader;
