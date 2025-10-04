import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, User, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  created_at: string;
  profiles: {
    username: string;
  } | null;
  post_tags: {
    tags: {
      name: string;
    };
  }[];
};

const Drafts = () => {
  const navigate = useNavigate();
  const { isAuthor, loading: roleLoading } = useUserRole();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      fetchDrafts();
    };

    checkAuth();
  }, [navigate]);

  useEffect(() => {
    if (!roleLoading && !isAuthor) {
      toast.error("You don't have permission to view drafts");
      navigate("/");
    }
  }, [isAuthor, roleLoading, navigate]);

  const fetchDrafts = async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from("posts")
      .select(`
        *,
        profiles (username),
        post_tags (
          tags (name)
        )
      `)
      .eq("status", "draft")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching drafts:", error);
      toast.error("Error loading drafts");
    } else {
      setPosts(data || []);
    }
    
    setLoading(false);
  };

  const handleDelete = async (postId: string) => {
    const { error } = await supabase
      .from("posts")
      .delete()
      .eq("id", postId);

    if (error) {
      toast.error("Error deleting draft");
    } else {
      toast.success("Draft deleted");
      fetchDrafts();
    }
  };

  if (roleLoading) return null;
  if (!isAuthor) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="blog-hero-gradient border-b">
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-5xl md:text-6xl font-serif font-bold mb-4 blog-gradient bg-clip-text text-transparent">
            My Drafts
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Work in progress - finish and publish your draft posts
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <Card key={n} className="overflow-hidden">
                <div className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-muted rounded w-16 mb-2" />
                    <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-4 bg-muted rounded w-full" />
                  </CardHeader>
                </div>
              </Card>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <h2 className="text-2xl font-serif font-bold mb-4">No drafts yet</h2>
            <p className="text-muted-foreground mb-6">
              Start writing your first draft post!
            </p>
            <Button asChild>
              <Link to="/editor">Create New Post</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Card key={post.id} className="h-full overflow-hidden" style={{ boxShadow: 'var(--blog-card-shadow)' }}>
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge className="w-fit">{post.category}</Badge>
                    <Badge variant="secondary">Draft</Badge>
                  </div>
                  <CardTitle className="text-2xl font-serif line-clamp-2">
                    {post.title}
                  </CardTitle>
                  {post.excerpt && (
                    <CardDescription className="line-clamp-3">
                      {post.excerpt}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span>{post.profiles?.username || "Unknown Author"}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <time>{format(new Date(post.created_at), "MMM d, yyyy")}</time>
                    </div>
                  </div>
                  {post.post_tags && post.post_tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {post.post_tags.slice(0, 3).map((pt, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {pt.tags.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button asChild className="flex-1" size="sm">
                      <Link to={`/editor?id=${post.id}`}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Link>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete draft?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your draft post.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(post.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Drafts;
