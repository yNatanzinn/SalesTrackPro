import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, Plus, Search } from "lucide-react";
import type { Product } from "@shared/schema";

interface ProductSelectionProps {
  onAddToCart: (product: Product) => void;
}

export function ProductSelection({ onAddToCart }: ProductSelectionProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-10 bg-muted rounded-lg mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Buscar produtos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
          data-testid="input-search-products"
        />
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchTerm ? "Nenhum produto encontrado" : "Nenhum produto cadastrado"}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {!searchTerm && "Adicione produtos na seção de produtos"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts.map((product) => (
            <Card
              key={product.id}
              className="cursor-pointer hover:bg-muted/50 transition-colors relative"
              data-testid={`product-card-${product.id}`}
            >
              <CardContent className="p-4 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Package className="w-6 h-6 text-primary" />
                </div>
                
                <h3 className="font-medium text-sm mb-2 line-clamp-2" data-testid={`product-name-${product.id}`}>
                  {product.name}
                </h3>
                
                <p className="text-lg font-bold text-primary mb-3" data-testid={`product-price-${product.id}`}>
                  {formatCurrency(Number(product.price))}
                </p>
                
                <Button
                  size="sm"
                  onClick={() => onAddToCart(product)}
                  className="w-full"
                  data-testid={`button-add-to-cart-${product.id}`}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Adicionar
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
