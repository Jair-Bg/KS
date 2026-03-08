import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Search, X } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { WalletButton } from "./WalletButton";
import { searchMarkets, type Market } from "@/lib/api";

const categories = [
  { id: "trending", label: "Trending" },
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

const navLinks = [
  { href: "/markets", label: "MARKETS" },
  { href: "/create", label: "CREATE" },
  { href: "/creators", label: "CREATORS" },
  { href: "/dashboard", label: "DASHBOARD" },
  { href: "/embeds", label: "EMBEDS" },
];

interface HeaderProps {
  activeCategory?: string;
  onCategoryChange?: (category: string) => void;
}

export function Header({ activeCategory, onCategoryChange }: HeaderProps) {
  const [localCategory, setLocalCategory] = useState("trending");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Market[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const currentCategory = activeCategory ?? localCategory;
  const handleCategoryClick = (id: string) => {
    if (onCategoryChange) {
      onCategoryChange(id);
    } else {
      setLocalCategory(id);
    }
    if (location.pathname !== "/markets") {
      navigate("/markets");
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length > 1) {
      const results = await searchMarkets(query);
      setSearchResults(results);
      setShowSearch(true);
    } else {
      setSearchResults([]);
      setShowSearch(false);
    }
  };

  const handleSearchSelect = (market: Market) => {
    setShowSearch(false);
    setSearchQuery("");
    // Navigate to markets with the relevant category
    if (onCategoryChange) {
      onCategoryChange(market.category);
    }
    if (location.pathname !== "/markets") {
      navigate("/markets");
    }
  };

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
            <a href="/" className="text-2xl font-bold text-primary" onClick={(e) => { e.preventDefault(); navigate("/"); }}>
              Kastia
            </a>
            
            {/* Main Links */}
            <nav className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.href;
                return (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(link.href);
                    }}
                    className={`text-sm font-medium transition-colors duration-200 ${
                      isActive
                        ? "text-foreground font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {link.label}
                  </a>
                );
              })}
            </nav>
          </div>

          {/* Search & Auth */}
          <div className="flex items-center gap-4">
            <div className="relative hidden lg:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search markets..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => searchResults.length > 0 && setShowSearch(true)}
                className="w-64 pl-10 bg-secondary border-0 rounded-full focus-visible:ring-1"
              />
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(""); setShowSearch(false); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              
              {/* Search dropdown */}
              {showSearch && searchResults.length > 0 && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setShowSearch(false)} />
                  <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-xl z-40 overflow-hidden">
                    {searchResults.slice(0, 5).map((m) => (
                      <button
                        key={m.id}
                        onClick={() => handleSearchSelect(m)}
                        className="w-full text-left px-4 py-3 hover:bg-secondary transition-colors border-b border-border last:border-b-0"
                      >
                        <p className="text-sm font-medium text-foreground truncate">{m.question}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="capitalize">{m.category}</span>
                          <span>{m.volume} vol</span>
                          <span>{m.options[0]?.name}: {m.options[0]?.odds}%</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
              {showSearch && searchResults.length === 0 && searchQuery.length > 1 && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setShowSearch(false)} />
                  <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-xl z-40 p-4 text-center">
                    <p className="text-sm text-muted-foreground">No markets found for "{searchQuery}"</p>
                  </div>
                </>
              )}
            </div>
            <WalletButton />
          </div>
        </div>

        {/* Category Pills */}
        <nav className="flex items-center gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat.id)}
              className={`category-pill whitespace-nowrap ${currentCategory === cat.id ? 'category-pill-active' : ''}`}
            >
              {cat.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
