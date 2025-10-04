import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import CategoryHeader from "./CategoryHeader";
import CategoryFooter from "./CategoryFooter";
import { format } from "date-fns";
import { Calendar, User } from "lucide-react";

type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  published_at: string;
  profiles: {
    username: string;
  };
};

type CategoryBlogProps = {
  category: string;
};

const CategoryBlog = ({ category }: CategoryBlogProps) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, [category]);

  const fetchPosts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("posts")
      .select(`
        *,
        profiles (username)
      `)
      .eq("status", "published")
      .eq("category", category as any)
      .lte("published_at", new Date().toISOString())
      .order("published_at", { ascending: false });

    if (error) {
      console.error("Error fetching posts:", error);
    } else {
      setPosts(data || []);
    }
    setLoading(false);
  };

  return (
    <div className={`min-h-screen category-${category}`}>
      <CategoryHeader category={category} />
      
      <div className="border-t border-border/50" />

      <main className="container mx-auto px-4 py-12 max-w-4xl">
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
            <h2 className="text-2xl font-bold mb-4">No posts yet</h2>
            <p className="text-muted-foreground">Check back soon for new content!</p>
          </div>
        ) : (
          <div className="space-y-12">
            {posts.map((post) => (
              <article key={post.id} className="border-b border-border/30 pb-8 last:border-0">
                <Link to={`/post/${post.slug}`}>
                  <h2 className="text-3xl font-bold mb-4 hover:opacity-80 transition-opacity">
                    {post.title}
                  </h2>
                </Link>
                <div className="flex items-center gap-4 text-sm opacity-70 mb-4">
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    <span>{post.profiles.username}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <time>{format(new Date(post.published_at), "MMMM d, yyyy")}</time>
                  </div>
                </div>
                {post.excerpt && (
                  <p className="text-lg leading-relaxed">{post.excerpt}</p>
                )}
                <Link 
                  to={`/post/${post.slug}`}
                  className="inline-block mt-4 font-medium hover:underline"
                >
                  Read more →
                </Link>
              </article>
            ))}
          </div>
        )}
      </main>

      <div className="border-t border-border/50" />

      <CategoryFooter />
    </div>
  );
};

export default CategoryBlog;
