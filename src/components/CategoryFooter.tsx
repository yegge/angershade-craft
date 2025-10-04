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
    <footer className="w-full py-6 mt-12 bg-background/80 backdrop-blur-sm sticky bottom-0">
      <div className="container mx-auto px-4">
        <p className="text-center text-xs opacity-70">
          © {year} - <a href="https://hyperfollow.com/brianyegge" target="_blank" rel="noopener noreferrer" className="hover:opacity-100 transition-opacity">Brian Yegge</a> | <a href="https://hyperfollow.com/angershade" target="_blank" rel="noopener noreferrer" className="hover:opacity-100 transition-opacity">Angershade LLC.</a> | <a href="https://hyperfollow.com/thecorruptive" target="_blank" rel="noopener noreferrer" className="hover:opacity-100 transition-opacity">The Corruptive</a> | <a href="https://yegge.com" target="_blank" rel="noopener noreferrer" className="hover:opacity-100 transition-opacity">Yegge</a> | <a href="https://tos.yegge.com" target="_blank" rel="noopener noreferrer" className="hover:opacity-100 transition-opacity">Terms of Service</a> | <a href="https://subscribe.yegge.com" target="_blank" rel="noopener noreferrer" className="hover:opacity-100 transition-opacity">Subscribe</a> | <a href="https://inquiry.yegge.com" target="_blank" rel="noopener noreferrer" className="hover:opacity-100 transition-opacity">Inquiry</a>
        </p>
        <p className="text-center text-xs opacity-70 mt-2">
          Social Media: <a href="https://facebook.com/brian.e.yegge" target="_blank" rel="noopener noreferrer" className="hover:opacity-100 transition-opacity">Facebook</a> - <a href="https://x.com/X_byegge" target="_blank" rel="noopener noreferrer" className="hover:opacity-100 transition-opacity">𝕏</a> - <a href="https://instagram.com/brianyegge" target="_blank" rel="noopener noreferrer" className="hover:opacity-100 transition-opacity">Instagram</a>
        </p>
      </div>
    </footer>
  );
};

export default CategoryFooter;
