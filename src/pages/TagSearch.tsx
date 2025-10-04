import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
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

const TagSearch = () => {
  const [searchParams] = useSearchParams();
  const tagName = searchParams.get("tag");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPostsByTag = async () => {
      if (!tagName) return;
      
      setLoading(true);
      
      // First get the tag ID
      const { data: tagData } = await supabase
        .from("tags")
        .select("id")
        .eq("name", tagName)
        .single();

      if (!tagData) {
        setLoading(false);
        return;
      }

      // Then get posts with that tag
      const { data: postTagsData } = await supabase
        .from("post_tags")
        .select("post_id")
        .eq("tag_id", tagData.id);

      if (!postTagsData || postTagsData.length === 0) {
        setLoading(false);
        return;
      }

      const postIds = postTagsData.map(pt => pt.post_id);

      // Finally fetch the full posts
      const { data, error } = await supabase
        .from("posts")
        .select(`
          *,
          profiles (username),
          post_tags (
            tags (name)
          )
        `)
        .in("id", postIds)
        .eq("status", "published")
        .lte("published_at", new Date().toISOString())
        .order("published_at", { ascending: false });

      if (error) {
        console.error("Error fetching posts:", error);
      } else {
        setPosts(data || []);
      }
      setLoading(false);
    };

    fetchPostsByTag();
  }, [tagName]);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-8">
          <Button variant="ghost" size="sm" asChild className="mb-4">
            <Link to="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </Button>
          <h1 className="text-4xl font-serif font-bold mb-2">
            Posts tagged with "{tagName}"
          </h1>
        </div>

        {loading ? (
          <div className="space-y-8">
            {[1, 2, 3].map((n) => (
              <div key={n} className="animate-pulse">
                <div className="h-8 bg-muted rounded w-3/4 mb-4" />
                <div className="h-4 bg-muted rounded w-full mb-2" />
                <div className="h-4 bg-muted rounded w-full mb-2" />
                <div className="h-4 bg-muted rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold mb-4">No posts found</h2>
            <p className="text-muted-foreground">
              No posts are tagged with "{tagName}"
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {posts.map((post) => (
              <article key={post.id} className="border-b border-border/30 pb-8 last:border-0">
                <div className="mb-2">
                  <Badge>{post.category}</Badge>
                </div>
                <Link to={`/post/${post.slug}`}>
                  <h2 className="text-3xl font-bold mb-4 hover:opacity-80 transition-opacity">
                    {post.title}
                  </h2>
                </Link>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    <span>{post.profiles?.username || "Unknown"}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <time>{format(new Date(post.published_at), "MMMM d, yyyy")}</time>
                  </div>
                </div>
                {post.post_tags && post.post_tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {post.post_tags.map((pt, idx) => (
                      <Link key={idx} to={`/tag?tag=${encodeURIComponent(pt.tags.name)}`}>
                        <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                          {pt.tags.name}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                )}
                {post.excerpt && (
                  <p className="text-lg leading-relaxed mb-4">{post.excerpt}</p>
                )}
                <Link 
                  to={`/post/${post.slug}`}
                  className="inline-block font-medium hover:underline"
                >
                  Read more →
                </Link>
              </article>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default TagSearch;
