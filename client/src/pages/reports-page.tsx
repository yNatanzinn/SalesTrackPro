import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BottomNavigation } from "@/components/bottom-navigation";
import { ChartsSection } from "@/components/charts-section";
import { ArrowLeft, Calendar, TrendingUp, DollarSign, ShoppingCart, Package } from "lucide-react";
import { useLocation } from "wouter";

export default function ReportsPage() {
  const [, setLocation] = useLocation();
  const [period, setPeriod] = useState("month");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Get date range based on period
  const getDateRange = (period: string) => {
    const now = new Date();
    let start: Date;
    
    switch (period) {
      case "today":
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "week":
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        break;
      case "month":
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "year":
        start = new Date(now.getFullYear(), 0, 1);
        break;
      case "custom":
        if (startDate && endDate) {
          return {
            startDate: new Date(startDate).toISOString(),
            endDate: new Date(endDate).toISOString(),
          };
        }
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        start = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    
    return { startDate: start.toISOString(), endDate: now.toISOString() };
  };

  const dateRange = getDateRange(period);

  // Fetch analytics data
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/analytics/stats", dateRange.startDate, dateRange.endDate],
    queryFn: async () => {
      const res = await fetch(`/api/analytics/stats?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`, {
        credentials: "include",
      });
      return await res.json();
    },
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getPeriodLabel = () => {
    switch (period) {
      case "today": return "Hoje";
      case "week": return "Esta Semana";
      case "month": return "Este Mês";
      case "year": return "Este Ano";
      case "custom": return "Período Personalizado";
      default: return "Este Mês";
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/")}
              data-testid="button-back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-semibold">Relatórios</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6 space-y-6">
        {/* Period Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>Período de Análise</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger data-testid="select-period">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="week">Esta Semana</SelectItem>
                  <SelectItem value="month">Este Mês</SelectItem>
                  <SelectItem value="year">Este Ano</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {period === "custom" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start-date">Data Inicial</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    data-testid="input-start-date"
                  />
                </div>
                <div>
                  <Label htmlFor="end-date">Data Final</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    data-testid="input-end-date"
                  />
                </div>
              </div>
            )}

            <div className="text-center">
              <p className="text-lg font-medium">Relatório de {getPeriodLabel()}</p>
              <p className="text-sm text-muted-foreground">
                {new Date(dateRange.startDate).toLocaleDateString('pt-BR')} até {new Date(dateRange.endDate).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-32 bg-muted rounded-lg"></div>
              </div>
            ))}
          </div>
        )}

        {/* Stats Overview */}
        {stats && (
          <>
            {/* Financial Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <DollarSign className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-xl font-bold" data-testid="text-total-revenue">
                    {formatCurrency(stats.totalSales)}
                  </p>
                  <p className="text-sm text-muted-foreground">Faturamento Total</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-xl font-bold" data-testid="text-paid-revenue">
                    {formatCurrency(stats.paidSales)}
                  </p>
                  <p className="text-sm text-muted-foreground">Recebido</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <DollarSign className="w-4 h-4 text-accent" />
                  </div>
                  <p className="text-xl font-bold" data-testid="text-pending-revenue">
                    {formatCurrency(stats.pendingSales)}
                  </p>
                  <p className="text-sm text-muted-foreground">A Receber</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <div className="w-8 h-8 bg-secondary/50 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <ShoppingCart className="w-4 h-4 text-foreground" />
                  </div>
                  <p className="text-xl font-bold" data-testid="text-sales-count">
                    {stats.salesCount}
                  </p>
                  <p className="text-sm text-muted-foreground">Total de Vendas</p>
                </CardContent>
              </Card>
            </div>

            {/* Average Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-lg font-bold" data-testid="text-average-sale">
                    {stats.salesCount > 0 ? formatCurrency(stats.totalSales / stats.salesCount) : formatCurrency(0)}
                  </p>
                  <p className="text-sm text-muted-foreground">Ticket Médio</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-lg font-bold text-primary" data-testid="text-payment-rate">
                    {stats.totalSales > 0 ? Math.round((stats.paidSales / stats.totalSales) * 100) : 0}%
                  </p>
                  <p className="text-sm text-muted-foreground">Taxa de Pagamento</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-lg font-bold" data-testid="text-daily-average">
                    {stats.dailySales && stats.dailySales.length > 0 
                      ? formatCurrency(stats.dailySales.reduce((sum, day) => sum + day.total, 0) / stats.dailySales.length)
                      : formatCurrency(0)
                    }
                  </p>
                  <p className="text-sm text-muted-foreground">Média Diária</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <ChartsSection 
              dailySales={stats.dailySales || []}
              paymentMethods={stats.paymentMethods || []}
              productSales={stats.productSales || []}
            />

            {/* Top Products Detail */}
            {stats.productSales && stats.productSales.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Package className="w-5 h-5" />
                    <span>Detalhamento dos Produtos</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Produto</th>
                          <th className="text-center py-2">Qtd Vendida</th>
                          <th className="text-right py-2">Total</th>
                          <th className="text-right py-2">% do Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.productSales.map((product, index) => (
                          <tr key={product.productName} className="border-b" data-testid={`product-row-${index}`}>
                            <td className="py-2">
                              <div className="flex items-center space-x-2">
                                <div className="w-6 h-6 bg-primary/10 rounded flex items-center justify-center text-xs">
                                  {index + 1}
                                </div>
                                <span className="font-medium">{product.productName}</span>
                              </div>
                            </td>
                            <td className="text-center py-2" data-testid={`product-quantity-${index}`}>
                              {product.quantity}
                            </td>
                            <td className="text-right py-2 font-medium" data-testid={`product-total-${index}`}>
                              {formatCurrency(Number(product.total))}
                            </td>
                            <td className="text-right py-2" data-testid={`product-percentage-${index}`}>
                              {stats.totalSales > 0 ? Math.round((Number(product.total) / stats.totalSales) * 100) : 0}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Payment Methods Detail */}
            {stats.paymentMethods && stats.paymentMethods.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Detalhamento dos Métodos de Pagamento</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats.paymentMethods.map((method, index) => (
                      <div key={method.method} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg" data-testid={`payment-method-${index}`}>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                            <DollarSign className="w-4 h-4 text-primary" />
                          </div>
                          <span className="font-medium">
                            {method.method === 'pix' ? 'PIX' : 
                             method.method === 'credit' ? 'Cartão Crédito' :
                             method.method === 'debit' ? 'Cartão Débito' : 'Dinheiro'}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatCurrency(method.total)}</p>
                          <p className="text-sm text-muted-foreground">
                            {stats.paidSales > 0 ? Math.round((method.total / stats.paidSales) * 100) : 0}% das vendas pagas
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}
