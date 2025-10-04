import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Trash2 } from "lucide-react";

type SiteSettings = {
  id: string;
  category: string;
  logo_url: string | null;
  logo_link: string | null;
  tag_cloud_count: number;
};

type SiteLink = {
  id: string;
  category: string;
  title: string;
  url: string;
  display_order: number;
};

const AdminSettings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<Record<string, SiteSettings>>({});
  const [links, setLinks] = useState<Record<string, SiteLink[]>>({});

  useEffect(() => {
    checkAuth();
    fetchSettings();
    fetchLinks();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from("site_settings")
      .select("*");

    if (error) {
      console.error("Error fetching settings:", error);
    } else if (data) {
      const settingsMap = data.reduce((acc, setting) => {
        acc[setting.category] = setting;
        return acc;
      }, {} as Record<string, SiteSettings>);
      setSettings(settingsMap);
    }
    setLoading(false);
  };

  const fetchLinks = async () => {
    const { data, error } = await supabase
      .from("site_links")
      .select("*")
      .order("display_order");

    if (error) {
      console.error("Error fetching links:", error);
    } else if (data) {
      const linksMap = data.reduce((acc, link) => {
        if (!acc[link.category]) acc[link.category] = [];
        acc[link.category].push(link);
        return acc;
      }, {} as Record<string, SiteLink[]>);
      setLinks(linksMap);
    }
  };

  const updateSettings = async (category: string) => {
    const setting = settings[category];
    const { error } = await supabase
      .from("site_settings")
      .update({
        logo_url: setting.logo_url,
        logo_link: setting.logo_link,
        tag_cloud_count: setting.tag_cloud_count,
      })
      .eq("category", category);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Settings updated successfully",
      });
    }
  };

  const addLink = async (category: string) => {
    const categoryLinks = links[category] || [];
    if (categoryLinks.length >= 9) {
      toast({
        title: "Limit Reached",
        description: "Maximum 9 links allowed per category",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from("site_links")
      .insert({
        category,
        title: "New Link",
        url: "https://",
        display_order: categoryLinks.length + 1,
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add link",
        variant: "destructive",
      });
    } else {
      fetchLinks();
    }
  };

  const updateLink = async (link: SiteLink) => {
    const { error } = await supabase
      .from("site_links")
      .update({
        title: link.title,
        url: link.url,
      })
      .eq("id", link.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update link",
        variant: "destructive",
      });
    }
  };

  const deleteLink = async (linkId: string, category: string) => {
    const { error } = await supabase
      .from("site_links")
      .delete()
      .eq("id", linkId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete link",
        variant: "destructive",
      });
    } else {
      fetchLinks();
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  }

  const CategorySettings = ({ category }: { category: string }) => {
    const setting = settings[category];
    const categoryLinks = links[category] || [];

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Logo Settings</CardTitle>
            <CardDescription>Configure the logo and link for {category}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor={`logo-url-${category}`}>Logo URL</Label>
              <Input
                id={`logo-url-${category}`}
                value={setting?.logo_url || ""}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    [category]: { ...setting, logo_url: e.target.value },
                  })
                }
                placeholder="https://example.com/logo.png"
              />
            </div>
            <div>
              <Label htmlFor={`logo-link-${category}`}>Logo Link</Label>
              <Input
                id={`logo-link-${category}`}
                value={setting?.logo_link || ""}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    [category]: { ...setting, logo_link: e.target.value },
                  })
                }
                placeholder="https://example.com"
              />
            </div>
            <div>
              <Label htmlFor={`tag-cloud-${category}`}>Tag Cloud Count</Label>
              <Input
                id={`tag-cloud-${category}`}
                type="number"
                value={setting?.tag_cloud_count || 10}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    [category]: { ...setting, tag_cloud_count: parseInt(e.target.value) },
                  })
                }
                min="1"
                max="20"
              />
            </div>
            <Button onClick={() => updateSettings(category)}>Save Settings</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Navigation Links</CardTitle>
            <CardDescription>Manage navigation links (max 9)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {categoryLinks.map((link) => (
              <div key={link.id} className="flex gap-2 items-end">
                <div className="flex-1">
                  <Label htmlFor={`link-title-${link.id}`}>Title</Label>
                  <Input
                    id={`link-title-${link.id}`}
                    value={link.title}
                    onChange={(e) => {
                      const updated = categoryLinks.map((l) =>
                        l.id === link.id ? { ...l, title: e.target.value } : l
                      );
                      setLinks({ ...links, [category]: updated });
                    }}
                    onBlur={() => updateLink(link)}
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor={`link-url-${link.id}`}>URL</Label>
                  <Input
                    id={`link-url-${link.id}`}
                    value={link.url}
                    onChange={(e) => {
                      const updated = categoryLinks.map((l) =>
                        l.id === link.id ? { ...l, url: e.target.value } : l
                      );
                      setLinks({ ...links, [category]: updated });
                    }}
                    onBlur={() => updateLink(link)}
                  />
                </div>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => deleteLink(link.id, category)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {categoryLinks.length < 9 && (
              <Button onClick={() => addLink(category)} variant="outline">
                Add Link
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">Site Settings</h1>
        <Tabs defaultValue="yegge">
          <TabsList>
            <TabsTrigger value="yegge">Yegge</TabsTrigger>
            <TabsTrigger value="angershade">Angershade</TabsTrigger>
            <TabsTrigger value="the-corruptive">The Corruptive</TabsTrigger>
          </TabsList>
          <TabsContent value="yegge">
            <CategorySettings category="yegge" />
          </TabsContent>
          <TabsContent value="angershade">
            <CategorySettings category="angershade" />
          </TabsContent>
          <TabsContent value="the-corruptive">
            <CategorySettings category="the-corruptive" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminSettings;
