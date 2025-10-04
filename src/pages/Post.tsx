import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, ArrowLeft, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useUserRole } from "@/hooks/useUserRole";
import DOMPurify from "dompurify";

type Post = {
  id: string;
  title: string;
  excerpt: string;
  content_html: string;
  category: string;
  published_at: string;
  author_id: string;
  profiles: {
    username: string;
  } | null;
  post_tags: {
    tags: {
      name: string;
    };
  }[];
};

const Post = () => {
  const { slug } = useParams();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { role } = useUserRole();

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getCurrentUser();
  }, []);

  useEffect(() => {
    const fetchPost = async () => {
      const { data, error } = await supabase
        .from("posts")
        .select(`
          *,
          profiles (username),
          post_tags (
            tags (name)
          )
        `)
        .eq("slug", slug)
        .eq("status", "published")
        .single();

      if (error) {
        console.error("Error fetching post:", error);
      } else {
        setPost(data);
      }
      setLoading(false);
    };

    fetchPost();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse space-y-4">
              <div className="h-12 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
              <div className="h-64 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl font-serif font-bold mb-4">Post Not Found</h1>
            <Button asChild>
              <Link to="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const getCategoryClass = (category: string) => {
    switch (category) {
      case "Yegge":
        return "category-yegge";
      case "Angershade":
        return "category-angershade";
      case "The Corruptive":
        return "category-the-corruptive";
      default:
        return "";
    }
  };

  const canEdit = currentUserId && (
    role === "admin" || 
    (role === "author" && post.author_id === currentUserId)
  );

  return (
    <div className={`min-h-screen ${getCategoryClass(post.category)}`}>
      <Navigation />
      <article className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Posts
              </Link>
            </Button>
            {canEdit && (
              <Button size="sm" asChild>
                <Link to={`/editor?id=${post.id}`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Post
                </Link>
              </Button>
            )}
          </div>

          <header className="mb-8">
            <Badge className="mb-4">{post.category}</Badge>
            <h1 className="text-5xl font-serif font-bold mb-4">{post.title}</h1>
            {post.excerpt && (
              <p className="text-xl text-muted-foreground mb-6">{post.excerpt}</p>
            )}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                <span>{post.profiles?.username || "Unknown Author"}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <time>{format(new Date(post.published_at), "MMMM d, yyyy")}</time>
              </div>
            </div>
            {post.post_tags && post.post_tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {post.post_tags.map((pt, idx) => (
                  <Link key={idx} to={`/tag?tag=${encodeURIComponent(pt.tags.name)}`}>
                    <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                      {pt.tags.name}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </header>

          <div 
            className="prose-blog"
            dangerouslySetInnerHTML={{ 
              __html: DOMPurify.sanitize(post.content_html, {
                ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td'],
                ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'target', 'rel']
              })
            }}
          />
        </div>
      </article>
      <Footer />
    </div>
  );
};

export default Post;
