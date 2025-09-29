import { useLocation } from "wouter";
import { Home, ShoppingBag, Package, BarChart3 } from "lucide-react";

export function BottomNavigation() {
  const [location, setLocation] = useLocation();

  const navItems = [
    { path: "/", icon: Home, label: "Dashboard" },
    { path: "/sales", icon: ShoppingBag, label: "Vendas" },
    { path: "/products", icon: Package, label: "Produtos" },
    { path: "/reports", icon: BarChart3, label: "Relatórios" },
  ];

  return (
    <nav className="sticky bottom-0 bg-card border-t border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-around py-3">
          {navItems.map((item) => {
            const isActive = location === item.path;
            const Icon = item.icon;
            
            return (
              <button
                key={item.path}
                onClick={() => setLocation(item.path)}
                className={`flex flex-col items-center space-y-1 p-2 transition-colors ${
                  isActive 
                    ? "text-primary" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
                data-testid={`nav-${item.label.toLowerCase()}`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
