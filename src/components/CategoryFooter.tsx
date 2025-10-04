import { useEffect, useState } from "react";

const CategoryFooter = () => {
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const checkAndUpdateYear = () => {
      const now = new Date();
      const currentYear = now.getFullYear();
      
      if (currentYear !== year) {
        setYear(currentYear);
      }
    };

    checkAndUpdateYear();

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const timeUntilMidnight = tomorrow.getTime() - now.getTime();

    const midnightTimeout = setTimeout(() => {
      checkAndUpdateYear();
      const dailyInterval = setInterval(checkAndUpdateYear, 24 * 60 * 60 * 1000);
      return () => clearInterval(dailyInterval);
    }, timeUntilMidnight);

    return () => clearTimeout(midnightTimeout);
  }, [year]);

  return (
    <footer className="w-full py-6 mt-12 backdrop-blur-sm bg-background/80 sticky bottom-0">
      <div className="container mx-auto px-4">
        <p className="text-center text-xs text-muted-foreground">
          © {year} - <a href="https://hyperfollow.com/brianyegge" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors" style={{ color: 'var(--link-color)' }}>Brian Yegge</a> | <a href="https://hyperfollow.com/angershade" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors" style={{ color: 'var(--link-color)' }}>Angershade LLC.</a> | <a href="https://hyperfollow.com/thecorruptive" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors" style={{ color: 'var(--link-color)' }}>The Corruptive</a> | <a href="https://yegge.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors" style={{ color: 'var(--link-color)' }}>Yegge</a> | <a href="https://tos.yegge.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors" style={{ color: 'var(--link-color)' }}>Terms of Service</a> | <a href="https://subscribe.yegge.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors" style={{ color: 'var(--link-color)' }}>Subscribe</a> | <a href="https://inquiry.yegge.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors" style={{ color: 'var(--link-color)' }}>Inquiry</a>
        </p>
        <p className="text-center text-xs text-muted-foreground mt-2">
          Social Media: <a href="https://facebook.com/brian.e.yegge" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors" style={{ color: 'var(--link-color)' }}>Facebook</a> - <a href="https://x.com/X_byegge" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors" style={{ color: 'var(--link-color)' }}>𝕏</a> - <a href="https://instagram.com/brianyegge" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors" style={{ color: 'var(--link-color)' }}>Instagram</a>
        </p>
      </div>
    </footer>
  );
};

export default CategoryFooter;
