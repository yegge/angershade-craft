import { useEffect, useState } from "react";

const Footer = () => {
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const checkAndUpdateYear = () => {
      const now = new Date();
      const currentYear = now.getFullYear();
      
      if (currentYear !== year) {
        setYear(currentYear);
      }
    };

    // Check immediately
    checkAndUpdateYear();

    // Calculate time until next midnight
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const timeUntilMidnight = tomorrow.getTime() - now.getTime();

    // Set initial timeout for midnight
    const midnightTimeout = setTimeout(() => {
      checkAndUpdateYear();
      
      // Then check every day at midnight
      const dailyInterval = setInterval(checkAndUpdateYear, 24 * 60 * 60 * 1000);
      
      return () => clearInterval(dailyInterval);
    }, timeUntilMidnight);

    return () => clearTimeout(midnightTimeout);
  }, [year]);

  return (
    <footer className="w-full py-6 mt-12 border-t border-border bg-background">
      <div className="container mx-auto px-4">
        <p className="text-center text-xs text-muted-foreground">
          © {year} - <a href="https://hyperfollow.com/brianyegge" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Brian Yegge</a> | <a href="https://hyperfollow.com/angershade" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Angershade LLC.</a> | <a href="https://hyperfollow.com/thecorruptive" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">The Corruptive</a> | <a href="https://yegge.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Yegge</a> | <a href="https://tos.yegge.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Terms of Service</a> | <a href="https://subscribe.yegge.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Subscribe</a> | <a href="https://inquiry.yegge.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Inquiry</a>
        </p>
        <p className="text-center text-xs text-muted-foreground mt-2">
          Social Media: <a href="https://facebook.com/brian.e.yegge" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Facebook</a> - <a href="https://x.com/X_byegge" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">𝕏</a> - <a href="https://instagram.com/brianyegge" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Instagram</a>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
