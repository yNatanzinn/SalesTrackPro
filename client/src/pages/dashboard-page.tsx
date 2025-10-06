import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { FinancialOverview } from "@/components/financial-overview";
import { ChartsSection } from "@/components/charts-section";
import { BottomNavigation } from "@/components/bottom-navigation";
import { PartialPaymentModal } from "@/components/partial-payment-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme } from "@/components/theme-provider";
import { 
  Store, Bell, User, ShoppingCart, Package, TrendingUp, Clock, Plus,
  Moon, Sun, Eye, CircleAlert, X,
  Info, MessageCircleWarning, TriangleAlert,
  MessageSquareWarning, OctagonAlert, BellRing
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { SaleWithItems } from "@shared/schema";

export default function DashboardPage() {
  const { user, logoutMutation } = useAuth();
  const { theme, setTheme } = useTheme();
  const [, setLocation] = useLocation();
  const [period, setPeriod] = useState("week");
  const [partialPaymentModal, setPartialPaymentModal] = useState<{
    isOpen: boolean;
    sale: SaleWithItems | null;
  }>({ isOpen: false, sale: null });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get date range based on period
  const getDateRange = (period: string) => {
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case "today":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "week":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
    }
    
    return { startDate: startDate.toISOString(), endDate: now.toISOString() };
  };

  const dateRange = useMemo(() => getDateRange(period), [period]);

  // Fetch analytics data
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/analytics/stats", dateRange.startDate, dateRange.endDate],
    queryFn: async () => {
      const res = await fetch(`/api/analytics/stats?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`, {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }
      return await res.json();
    },
    enabled: !!user,
  });

  // Fetch pending sales
  const { data: pendingSales, isLoading: pendingLoading } = useQuery({
    queryKey: ["/api/sales/pending"],
    enabled: !!user,
  });

  // Fetch products
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ["/api/products"],
    enabled: !!user,
  });

  // Mark sale as paid mutation
  const markAsPaidMutation = useMutation({
    mutationFn: async (saleId: string) => {
      await apiRequest("PUT", `/api/sales/${saleId}/status`, {
        paymentStatus: "paid",
        isPaid: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/stats"] });
      toast({
        title: "Venda marcada como paga",
        description: "A venda foi marcada como paga com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao marcar venda como paga.",
        variant: "destructive",
      });
    },
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (statsLoading || pendingLoading || productsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Store className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Neitansh Vendas</h1>
              <p className="text-xs text-muted-foreground" data-testid="text-user-name">
                {user?.displayName}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              data-testid="button-theme-toggle"
            >
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => logoutMutation.mutate()}
              data-testid="button-logout"
            >
              <User className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6 space-y-6">
        {/* Financial Overview */}
        {stats && (
          <FinancialOverview 
            stats={stats} 
            period={period} 
            onPeriodChange={setPeriod} 
          />
        )}

        {/* Charts */}
        {stats && (
          <ChartsSection 
            dailySales={stats.dailySales || []}
            paymentMethods={stats.paymentMethods || []}
            productSales={stats.productSales || []}
          />
        )}

        {/* Quick Actions */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Ações Rápidas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              className="h-auto p-6 justify-start"
              onClick={() => setLocation("/sales")}
              data-testid="button-new-sale"
            >
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-primary-foreground/10 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold">Nova Venda</h3>
                  <p className="text-sm text-primary-foreground/80">Registrar nova venda</p>
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-auto p-6 justify-start"
              onClick={() => setLocation("/products")}
              data-testid="button-manage-products"
            >
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-accent" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold">Gerenciar Produtos</h3>
                  <p className="text-sm text-muted-foreground">Adicionar e editar produtos</p>
                </div>
              </div>
            </Button>
          </div>
        </section>

        {/* Pending Sales */}
        {pendingSales && pendingSales.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Vendas Pendentes</h2>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setLocation("/sales?tab=pending")}
                data-testid="button-view-all-pending"
              >
                Ver todas
              </Button>
            </div>
            
            <div className="space-y-3">
              {pendingSales.slice(0, 3).map((sale: SaleWithItems) => (
                <Card key={sale.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-medium" data-testid={`text-customer-${sale.id}`}>
                          {sale.customerName || "Cliente Anônimo"}
                        </p>
                        <p className="text-sm text-muted-foreground" data-testid={`text-date-${sale.id}`}>
                          {new Date(sale.createdAt!).toLocaleDateString('pt-BR')} - {new Date(sale.createdAt!).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold" data-testid={`text-total-${sale.id}`}>
                          {formatCurrency(Number(sale.total))}
                        </p>
                        <p className="text-xs text-accent">Pendente</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CircleAlert>
                        <BellRing asChild>
                          <Button 
                            size="sm" 
                            className="flex-1"
                            data-testid={`button-mark-paid-${sale.id}`}
                          >
                            Marcar como Pago
                          </Button>
                        </BellRing>
                        <Info>
                          <MessageSquareWarning>
                            <OctagonAlert>Confirmar Pagamento</OctagonAlert>
                            <MessageCircleWarning>
                              Tem certeza que deseja marcar esta venda como paga? 
                              Valor: {formatCurrency(Number(sale.total))}
                            </MessageCircleWarning>
                          </MessageSquareWarning>
                          <TriangleAlert>
                            <X>Cancelar</X>
                            <Button
                              onClick={() => markAsPaidMutation.mutate(sale.id)}
                              disabled={markAsPaidMutation.isPending}
                              variant="default"
                              size="sm"
                            >
                              {markAsPaidMutation.isPending ? "Confirmando..." : "Confirmar"}
                            </Button>
                          </TriangleAlert>
                        </Info>
                      </CircleAlert>
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setPartialPaymentModal({ isOpen: true, sale })}
                        data-testid={`button-partial-payment-${sale.id}`}
                      >
                        Pag. Parcial
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Featured Products */}
        {products && products.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Produtos em Destaque</h2>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setLocation("/products")}
                data-testid="button-view-all-products"
              >
                Ver todos
              </Button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {products.slice(0, 4).map((product: any) => (
                <Card 
                  key={product.id} 
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setLocation("/sales")}
                  data-testid={`card-product-${product.id}`}
                >
                  <CardContent className="p-4 text-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <Package className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-medium text-sm mb-1" data-testid={`text-product-name-${product.id}`}>
                      {product.name}
                    </h3>
                    <p className="text-lg font-bold text-primary" data-testid={`text-product-price-${product.id}`}>
                      {formatCurrency(Number(product.price))}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation />

      {/* Floating Action Button */}
      <Button
        className="fixed bottom-20 right-4 w-14 h-14 rounded-full shadow-lg z-40"
        onClick={() => setLocation("/sales")}
        data-testid="button-floating-new-sale"
      >
        <Plus className="w-6 h-6" />
      </Button>

      {/* Partial Payment Modal */}
      <PartialPaymentModal
        isOpen={partialPaymentModal.isOpen}
        onClose={() => setPartialPaymentModal({ isOpen: false, sale: null })}
        sale={partialPaymentModal.sale}
      />
    </div>
  );
}
