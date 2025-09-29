import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, User } from "lucide-react";
import type { Customer } from "@shared/schema";

interface CustomerSearchProps {
  onCustomerSelect: (customer: Customer | null) => void;
  placeholder?: string;
}

export function CustomerSearch({ onCustomerSelect, placeholder = "Buscar cliente..." }: CustomerSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showResults, setShowResults] = useState(false);

  const { data: searchResults = [], isLoading } = useQuery<Customer[]>({
    queryKey: ["/api/customers/search", { q: searchTerm }],
    enabled: searchTerm.length >= 2,
  });

  useEffect(() => {
    setShowResults(searchTerm.length >= 2);
  }, [searchTerm]);

  const handleCustomerSelect = (customer: Customer) => {
    onCustomerSelect(customer);
    setSearchTerm(customer.name);
    setShowResults(false);
  };

  const handleClear = () => {
    setSearchTerm("");
    onCustomerSelect(null);
    setShowResults(false);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-20"
          data-testid="input-customer-search"
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-1 top-1/2 transform -translate-y-1/2"
            data-testid="button-clear-search"
          >
            Limpar
          </Button>
        )}
      </div>

      {showResults && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 text-center text-muted-foreground">
                Buscando...
              </div>
            ) : searchResults.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                <User className="w-8 h-8 mx-auto mb-2" />
                <p>Nenhum cliente encontrado</p>
                <p className="text-xs mt-1">Tente um termo diferente</p>
              </div>
            ) : (
              <div className="divide-y">
                {searchResults.map((customer) => (
                  <button
                    key={customer.id}
                    onClick={() => handleCustomerSelect(customer)}
                    className="w-full p-4 text-left hover:bg-muted/50 transition-colors"
                    data-testid={`customer-result-${customer.id}`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{customer.name}</p>
                        {customer.email && (
                          <p className="text-sm text-muted-foreground truncate">
                            {customer.email}
                          </p>
                        )}
                        {customer.phone && (
                          <p className="text-sm text-muted-foreground truncate">
                            {customer.phone}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
