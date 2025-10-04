import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Post from "./pages/Post";
import Editor from "./pages/Editor";
import Drafts from "./pages/Drafts";
import NotFound from "./pages/NotFound";
import Yegge from "./pages/Yegge";
import Angershade from "./pages/Angershade";
import TheCorruptive from "./pages/TheCorruptive";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/yegge" element={<Yegge />} />
            <Route path="/angershade" element={<Angershade />} />
            <Route path="/the-corruptive" element={<TheCorruptive />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/post/:slug" element={<Post />} />
            <Route path="/editor" element={<Editor />} />
            <Route path="/drafts" element={<Drafts />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
