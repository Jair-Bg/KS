import { Link } from "react-router-dom";

const footerLinks = {
  Product: [
    { label: "Markets", href: "/markets" },
    { label: "Creators", href: "/creators" },
    { label: "Embeds", href: "/embeds" },
    { label: "Dashboard", href: "/dashboard" },
  ],
  Resources: [
    { label: "Documentation", href: "#" },
    { label: "API Reference", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Help Center", href: "#" },
  ],
  Legal: [
    { label: "Terms of Service", href: "#" },
    { label: "Privacy Policy", href: "#" },
    { label: "Disclosures", href: "#" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="container py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <span
              className="text-2xl font-bold gradient-text block mb-3"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Kastia
            </span>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              Prediction markets embedded into the fabric of online conversation.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-sm font-semibold text-foreground mb-4">{title}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-border">
          <span className="text-sm text-muted-foreground">
            © 2026 Kastia. All rights reserved.
          </span>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">X / Twitter</a>
            <a href="https://discord.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Discord</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
