import { Search } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

const categories = [
  { id: "trending", label: "Trending", active: true },
  { id: "politics", label: "Politics" },
  { id: "sports", label: "Sports" },
  { id: "culture", label: "Culture" },
  { id: "crypto", label: "Crypto" },
  { id: "climate", label: "Climate" },
  { id: "economics", label: "Economics" },
  { id: "companies", label: "Companies" },
  { id: "financials", label: "Financials" },
  { id: "tech", label: "Tech & Science" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border">
      {/* Announcement Bar */}
      <div className="bg-secondary/80 py-2 px-4 text-center text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <span className="w-4 h-4 rounded-full bg-muted-foreground/20 flex items-center justify-center text-xs">ℹ</span>
          Reminder: Weekly scheduled exchange maintenance will occur from 3AM ET - 5AM ET
        </span>
      </div>

      {/* Main Nav */}
      <div className="container py-3">
        <div className="flex items-center justify-between gap-8">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <a href="/" className="text-2xl font-bold text-primary">
              Kastia
            </a>
            
            {/* Main Links */}
            <nav className="hidden md:flex items-center gap-6">
              <a href="#" className="nav-link nav-link-active font-semibold">MARKETS</a>
              <a href="#" className="text-sm font-medium text-primary">LIVE</a>
              <a href="#" className="nav-link">SOCIAL</a>
            </nav>
          </div>

          {/* Search & Auth */}
          <div className="flex items-center gap-4">
            <div className="relative hidden lg:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Trade on anything"
                className="w-64 pl-10 bg-secondary border-0 rounded-full focus-visible:ring-1"
              />
            </div>
            <Button variant="login" size="pill">Log in</Button>
            <Button variant="signup" size="pill">Sign up</Button>
          </div>
        </div>

        {/* Category Pills */}
        <nav className="flex items-center gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`category-pill whitespace-nowrap ${cat.active ? 'category-pill-active' : ''}`}
            >
              {cat.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
