import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CategoryHeader } from "@/components/CategoryHeader";
import CategoryFooter from "@/components/CategoryFooter";
import { Calendar, User } from "lucide-react";
import { format } from "date-fns";

type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content_html: string;
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

const Yegge = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const category = "Yegge" as const;

  useEffect(() => {
    const fetchPosts = async () => {
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
        .eq("status", "published")
        .eq("category", category)
        .lte("published_at", new Date().toISOString())
        .order("published_at", { ascending: false });

      if (error) {
        console.error("Error fetching posts:", error);
      } else {
        setPosts(data || []);
      }
      
      setLoading(false);
    };

    fetchPosts();
  }, []);

  return (
    <div className="min-h-screen category-yegge">
      <CategoryHeader category={category} />
      
      <div className="border-t border-foreground/10" />

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        {loading ? (
          <div className="space-y-8">
            {[1, 2, 3].map((n) => (
              <div key={n} className="animate-pulse space-y-4">
                <div className="h-8 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-full" />
                <div className="h-4 bg-muted rounded w-full" />
                <div className="h-4 bg-muted rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold mb-4">No posts yet</h2>
            <p className="text-muted-foreground">Check back soon for updates!</p>
          </div>
        ) : (
          <div className="space-y-12">
            {posts.map((post) => (
              <article key={post.id} className="space-y-4">
                <Link to={`/post/${post.slug}`}>
                  <h2 className="text-3xl font-bold hover:underline transition-all">
                    {post.title}
                  </h2>
                </Link>
                
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

                {post.excerpt && (
                  <p className="text-lg leading-relaxed">{post.excerpt}</p>
                )}

                {post.post_tags && post.post_tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {post.post_tags.map((pt, idx) => (
                      <span key={idx} className="text-sm px-3 py-1 bg-foreground/5 rounded-full">
                        {pt.tags.name}
                      </span>
                    ))}
                  </div>
                )}

                <Link 
                  to={`/post/${post.slug}`}
                  className="inline-block text-sm font-medium hover:underline"
                  style={{ color: 'var(--link-color)' }}
                >
                  Read more →
                </Link>

                <hr className="border-foreground/10 mt-8" />
              </article>
            ))}
          </div>
        )}
      </main>

      <div className="border-t border-foreground/10" />
      <CategoryFooter />
    </div>
  );
};

export default Yegge;
