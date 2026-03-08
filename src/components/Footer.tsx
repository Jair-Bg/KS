export function Footer() {
  return (
    <footer className="border-t border-border bg-secondary/30 mt-12">
      <div className="container py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <span className="text-xl font-bold text-primary">Kastia</span>
            <span className="text-sm text-muted-foreground">
              © 2025 Kastia. All rights reserved.
            </span>
          </div>
          <nav className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Disclosures</a>
            <a href="#" className="hover:text-foreground transition-colors">Help</a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
