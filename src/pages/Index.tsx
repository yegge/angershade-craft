import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, User } from "lucide-react";
import { format } from "date-fns";

type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  published_at: string;
  profiles: {
    username: string;
  } | null;
  post_tags: {
    tags: {
      name: string;
    };
  }[];
};

const Index = () => {
  const [searchParams] = useSearchParams();
  const category = searchParams.get("category");
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      
      let query = supabase
        .from("posts")
        .select(`
          *,
          profiles (username),
          post_tags (
            tags (name)
          )
        `)
        .eq("status", "published")
        .lte("published_at", new Date().toISOString())
        .order("published_at", { ascending: false });

      if (category) {
        query = query.eq("category", category as any);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching posts:", error);
      } else {
        setPosts(data || []);
      }
      
      setLoading(false);
    };

    fetchPosts();
  }, [category]);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="blog-hero-gradient border-b">
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-5xl md:text-6xl font-serif font-bold mb-4 blog-gradient bg-clip-text text-transparent">
            Chronicle
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Tales from the digital frontier - exploring code, creativity, and curiosity
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {category && (
          <div className="mb-8">
            <h2 className="text-3xl font-serif font-bold">
              Category: {category}
            </h2>
            <Link to="/" className="text-primary hover:underline">
              View all posts
            </Link>
          </div>
        )}

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <Card key={n} className="overflow-hidden">
                <div className="animate-pulse">
                  <div className="h-48 bg-muted" />
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
            <h2 className="text-2xl font-serif font-bold mb-4">No posts yet</h2>
            <p className="text-muted-foreground">
              {category ? `No posts in the "${category}" category.` : "Be the first to write something!"}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Link key={post.id} to={`/post/${post.slug}`}>
                <Card className="h-full overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1" style={{ boxShadow: 'var(--blog-card-shadow)' }}>
                  <CardHeader>
                    <Badge className="w-fit mb-2">{post.category}</Badge>
                    <CardTitle className="text-2xl font-serif line-clamp-2">
                      {post.title}
                    </CardTitle>
                    {post.excerpt && (
                      <CardDescription className="line-clamp-3">
                        {post.excerpt}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>{post.profiles?.username || "Unknown Author"}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <time>{format(new Date(post.published_at), "MMM d, yyyy")}</time>
                      </div>
                    </div>
                    {post.post_tags && post.post_tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {post.post_tags.slice(0, 3).map((pt, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {pt.tags.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Index;
