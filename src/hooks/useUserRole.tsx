import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type UserRole = "admin" | "author" | "reader" | null;

export const useUserRole = () => {
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setRole(null);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .order("role", { ascending: true });

      if (error) {
        console.error("Error fetching user role:", error);
        setRole(null);
      } else if (data && data.length > 0) {
        // Priority: admin > author > reader
        const roles = data.map(r => r.role);
        if (roles.includes("admin")) {
          setRole("admin");
        } else if (roles.includes("author")) {
          setRole("author");
        } else {
          setRole("reader");
        }
      } else {
        setRole("reader");
      }
      
      setLoading(false);
    };

    fetchUserRole();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchUserRole();
    });

    return () => subscription.unsubscribe();
  }, []);

  return { role, loading, isAdmin: role === "admin", isAuthor: role === "author" || role === "admin" };
};
