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
import { useUserRole } from "@/hooks/useUserRole";
import { Trash2 } from "lucide-react";

type SiteSettings = {
  id: string;
  category: string;
  logo_url: string | null;
  logo_link: string | null;
  tag_cloud_count: number;
  primary_font: string;
  secondary_font: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
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
  const { role, loading: roleLoading } = useUserRole();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<Record<string, SiteSettings>>({});
  const [links, setLinks] = useState<Record<string, SiteLink[]>>({});

  useEffect(() => {
    if (!roleLoading && role !== "admin") {
      toast({
        title: "Access Denied",
        description: "You must be an admin to access this page",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [role, roleLoading, navigate, toast]);

  useEffect(() => {
    if (role === "admin") {
      fetchSettings();
      fetchLinks();
    }
  }, [role]);

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

  const uploadLogo = async (file: File, category: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${category}-logo-${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('post-images')
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      toast({
        title: "Error",
        description: "Failed to upload logo",
        variant: "destructive",
      });
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('post-images')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const updateSettings = async (category: string) => {
    const setting = settings[category];
    const { error } = await supabase
      .from("site_settings")
      .update({
        logo_url: setting.logo_url,
        logo_link: setting.logo_link,
        tag_cloud_count: setting.tag_cloud_count,
        primary_font: setting.primary_font,
        secondary_font: setting.secondary_font,
        primary_color: setting.primary_color,
        secondary_color: setting.secondary_color,
        accent_color: setting.accent_color,
        background_color: setting.background_color,
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

  if (roleLoading || loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  }

  if (role !== "admin") {
    return null;
  }

  const fontOptions = [
    'Inter',
    'Arial',
    'Helvetica',
    'Georgia',
    'Times New Roman',
    'Courier New',
    'Verdana',
    'Trebuchet MS',
    'Comic Sans MS',
    'Impact',
  ];

  const CategorySettings = ({ category }: { category: string }) => {
    const setting = settings[category];
    const categoryLinks = links[category] || [];
    const [uploading, setUploading] = useState(false);
    const [localSetting, setLocalSetting] = useState(setting);

    // Sync local state when parent state changes
    useEffect(() => {
      setLocalSetting(setting);
    }, [setting]);

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setUploading(true);
      const publicUrl = await uploadLogo(file, category);
      if (publicUrl) {
        const updated = { ...localSetting, logo_url: publicUrl };
        setLocalSetting(updated);
        setSettings({
          ...settings,
          [category]: updated,
        });
      }
      setUploading(false);
    };

    const handleBlur = () => {
      setSettings({
        ...settings,
        [category]: localSetting,
      });
    };

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Site Settings</CardTitle>
            <CardDescription>Configure appearance for {category}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor={`logo-url-${category}`}>Logo URL</Label>
              <Input
                id={`logo-url-${category}`}
                value={localSetting?.logo_url || ""}
                onChange={(e) =>
                  setLocalSetting({ ...localSetting, logo_url: e.target.value })
                }
                onBlur={handleBlur}
                placeholder="https://example.com/logo.png"
              />
            </div>

            <div>
              <Label htmlFor={`logo-upload-${category}`}>Upload Logo</Label>
              <Input
                id={`logo-upload-${category}`}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                disabled={uploading}
              />
              {uploading && <p className="text-sm text-muted-foreground mt-1">Uploading...</p>}
            </div>

            <div>
              <Label htmlFor={`logo-link-${category}`}>Logo Link</Label>
              <Input
                id={`logo-link-${category}`}
                value={localSetting?.logo_link || ""}
                onChange={(e) =>
                  setLocalSetting({ ...localSetting, logo_link: e.target.value })
                }
                onBlur={handleBlur}
                placeholder="https://example.com"
              />
            </div>

            <div>
              <Label htmlFor={`tag-cloud-${category}`}>Tag Cloud Count</Label>
              <Input
                id={`tag-cloud-${category}`}
                type="number"
                value={localSetting?.tag_cloud_count || 10}
                onChange={(e) =>
                  setLocalSetting({ ...localSetting, tag_cloud_count: parseInt(e.target.value) })
                }
                onBlur={handleBlur}
                min="1"
                max="20"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`primary-font-${category}`}>Primary Font</Label>
                <select
                  id={`primary-font-${category}`}
                  value={localSetting?.primary_font || 'Inter'}
                  onChange={(e) =>
                    setLocalSetting({ ...localSetting, primary_font: e.target.value })
                  }
                  onBlur={handleBlur}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {fontOptions.map((font) => (
                    <option key={font} value={font}>{font}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor={`secondary-font-${category}`}>Secondary Font</Label>
                <select
                  id={`secondary-font-${category}`}
                  value={localSetting?.secondary_font || 'Inter'}
                  onChange={(e) =>
                    setLocalSetting({ ...localSetting, secondary_font: e.target.value })
                  }
                  onBlur={handleBlur}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {fontOptions.map((font) => (
                    <option key={font} value={font}>{font}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`primary-color-${category}`}>Primary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id={`primary-color-${category}`}
                    type="color"
                    value={localSetting?.primary_color || '#000000'}
                    onChange={(e) =>
                      setLocalSetting({ ...localSetting, primary_color: e.target.value })
                    }
                    onBlur={handleBlur}
                    className="w-20 h-10"
                  />
                  <Input
                    value={localSetting?.primary_color || '#000000'}
                    onChange={(e) =>
                      setLocalSetting({ ...localSetting, primary_color: e.target.value })
                    }
                    onBlur={handleBlur}
                    placeholder="#000000"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor={`secondary-color-${category}`}>Secondary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id={`secondary-color-${category}`}
                    type="color"
                    value={localSetting?.secondary_color || '#666666'}
                    onChange={(e) =>
                      setLocalSetting({ ...localSetting, secondary_color: e.target.value })
                    }
                    onBlur={handleBlur}
                    className="w-20 h-10"
                  />
                  <Input
                    value={localSetting?.secondary_color || '#666666'}
                    onChange={(e) =>
                      setLocalSetting({ ...localSetting, secondary_color: e.target.value })
                    }
                    onBlur={handleBlur}
                    placeholder="#666666"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor={`accent-color-${category}`}>Accent Color</Label>
                <div className="flex gap-2">
                  <Input
                    id={`accent-color-${category}`}
                    type="color"
                    value={localSetting?.accent_color || '#0066cc'}
                    onChange={(e) =>
                      setLocalSetting({ ...localSetting, accent_color: e.target.value })
                    }
                    onBlur={handleBlur}
                    className="w-20 h-10"
                  />
                  <Input
                    value={localSetting?.accent_color || '#0066cc'}
                    onChange={(e) =>
                      setLocalSetting({ ...localSetting, accent_color: e.target.value })
                    }
                    onBlur={handleBlur}
                    placeholder="#0066cc"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor={`background-color-${category}`}>Background Color</Label>
                <div className="flex gap-2">
                  <Input
                    id={`background-color-${category}`}
                    type="color"
                    value={localSetting?.background_color || '#ffffff'}
                    onChange={(e) =>
                      setLocalSetting({ ...localSetting, background_color: e.target.value })
                    }
                    onBlur={handleBlur}
                    className="w-20 h-10"
                  />
                  <Input
                    value={localSetting?.background_color || '#ffffff'}
                    onChange={(e) =>
                      setLocalSetting({ ...localSetting, background_color: e.target.value })
                    }
                    onBlur={handleBlur}
                    placeholder="#ffffff"
                  />
                </div>
              </div>
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
