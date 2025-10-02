import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { RichTextEditor } from "@/components/RichTextEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Save, Send } from "lucide-react";

const categories = ["Angershade", "The Corruptive", "Yegge"] as const;

const Editor = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const postId = searchParams.get("id");
  
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<typeof categories[number]>("Angershade");
  const [tags, setTags] = useState("");
  const [publishedAt, setPublishedAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      setUser(user);
    };

    checkAuth();
  }, [navigate]);

  useEffect(() => {
    if (postId && user) {
      loadPost();
    }
  }, [postId, user]);

  const loadPost = async () => {
    const { data, error } = await supabase
      .from("posts")
      .select(`
        *,
        post_tags (
          tags (name)
        )
      `)
      .eq("id", postId)
      .single();

    if (error) {
      toast.error("Error loading post");
      return;
    }

    setTitle(data.title);
    setExcerpt(data.excerpt || "");
    setContent(data.content_html);
    setCategory(data.category);
    setPublishedAt(data.published_at ? new Date(data.published_at).toISOString().slice(0, 16) : "");
    setTags(data.post_tags.map((pt: any) => pt.tags.name).join(", "));
  };

  const createSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleSave = async (status: "draft" | "published") => {
    if (!title || !content || !user) {
      toast.error("Please fill in title and content");
      return;
    }

    setLoading(true);

    try {
      const slug = createSlug(title);
      const postData = {
        title,
        slug,
        excerpt: excerpt || null,
        content: { html: content },
        content_html: content,
        category,
        status,
        author_id: user.id,
        published_at: status === "published" && !publishedAt 
          ? new Date().toISOString() 
          : publishedAt 
            ? new Date(publishedAt).toISOString() 
            : null,
      };

      let postIdResult = postId;

      if (postId) {
        const { error } = await supabase
          .from("posts")
          .update(postData)
          .eq("id", postId);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("posts")
          .insert(postData)
          .select()
          .single();

        if (error) throw error;
        postIdResult = data.id;
      }

      // Handle tags
      if (tags.trim() && postIdResult) {
        const tagNames = tags.split(",").map(t => t.trim()).filter(Boolean);
        
        // Delete existing tags
        await supabase
          .from("post_tags")
          .delete()
          .eq("post_id", postIdResult);

        // Create or get tags
        for (const tagName of tagNames) {
          const tagSlug = createSlug(tagName);
          
          const { data: existingTag } = await supabase
            .from("tags")
            .select()
            .eq("slug", tagSlug)
            .single();

          let tagId = existingTag?.id;

          if (!existingTag) {
            const { data: newTag } = await supabase
              .from("tags")
              .insert({ name: tagName, slug: tagSlug })
              .select()
              .single();
            
            tagId = newTag?.id;
          }

          if (tagId) {
            await supabase
              .from("post_tags")
              .insert({ post_id: postIdResult, tag_id: tagId });
          }
        }
      }

      toast.success(status === "draft" ? "Draft saved!" : "Post published!");
      navigate("/");
    } catch (error: any) {
      console.error("Error saving post:", error);
      toast.error(error.message || "Error saving post");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-serif font-bold">
              {postId ? "Edit Post" : "Create New Post"}
            </h1>
            <div className="flex gap-2">
              <Button
                onClick={() => handleSave("draft")}
                disabled={loading}
                variant="outline"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </Button>
              <Button
                onClick={() => handleSave("published")}
                disabled={loading}
              >
                <Send className="h-4 w-4 mr-2" />
                Publish
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Enter your post title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-2xl font-serif"
              />
            </div>

            <div>
              <Label htmlFor="excerpt">Excerpt (optional)</Label>
              <Textarea
                id="excerpt"
                placeholder="Brief summary of your post..."
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={(value: any) => setCategory(value)}>
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="publishedAt">Publish Date (optional)</Label>
                <Input
                  id="publishedAt"
                  type="datetime-local"
                  value={publishedAt}
                  onChange={(e) => setPublishedAt(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                placeholder="technology, tutorial, thoughts"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div>

            <div>
              <Label>Content</Label>
              <RichTextEditor content={content} onChange={setContent} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Editor;
