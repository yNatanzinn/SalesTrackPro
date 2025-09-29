import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, EyeOff, TrendingUp, Clock, DollarSign } from "lucide-react";

interface FinancialOverviewProps {
  stats: {
    totalSales: number;
    paidSales: number;
    pendingSales: number;
    salesCount: number;
  };
  period: string;
  onPeriodChange: (period: string) => void;
}

export function FinancialOverview({ stats, period, onPeriodChange }: FinancialOverviewProps) {
  const [valuesVisible, setValuesVisible] = useState(true);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const ValueDisplay = ({ children }: { children: React.ReactNode }) => (
    <span className={valuesVisible ? "" : "blur-value"}>
      {children}
    </span>
  );

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Resumo Financeiro</h2>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setValuesVisible(!valuesVisible)}
            data-testid="button-toggle-visibility"
          >
            {valuesVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </Button>
          <Select value={period} onValueChange={onPeriodChange}>
            <SelectTrigger className="w-[140px]" data-testid="select-period">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="week">Esta Semana</SelectItem>
              <SelectItem value="month">Este Mês</SelectItem>
              <SelectItem value="custom">Personalizado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-muted-foreground text-sm">Vendas Pagas</p>
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-primary" />
              </div>
            </div>
            <p className="text-2xl font-bold" data-testid="text-paid-sales">
              <ValueDisplay>{formatCurrency(stats.paidSales)}</ValueDisplay>
            </p>
            <p className="text-xs text-primary mt-1">
              {Math.round((stats.paidSales / stats.totalSales) * 100) || 0}% do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-muted-foreground text-sm">Pendentes</p>
              <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center">
                <Clock className="w-4 h-4 text-accent" />
              </div>
            </div>
            <p className="text-2xl font-bold" data-testid="text-pending-sales">
              <ValueDisplay>{formatCurrency(stats.pendingSales)}</ValueDisplay>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {Math.round((stats.pendingSales / stats.totalSales) * 100) || 0}% do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-muted-foreground text-sm">Total do Período</p>
              <div className="w-8 h-8 bg-secondary/50 rounded-lg flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-foreground" />
              </div>
            </div>
            <p className="text-2xl font-bold" data-testid="text-total-sales">
              <ValueDisplay>{formatCurrency(stats.totalSales)}</ValueDisplay>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.salesCount} vendas realizadas
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
