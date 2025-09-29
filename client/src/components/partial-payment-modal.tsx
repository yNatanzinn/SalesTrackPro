import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { SaleWithItems } from "@shared/schema";

interface PartialPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: SaleWithItems | null;
}

export function PartialPaymentModal({ isOpen, onClose, sale }: PartialPaymentModalProps) {
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const paymentMutation = useMutation({
    mutationFn: async (data: { saleId: string; amount: number; paymentMethod: string }) => {
      await apiRequest("POST", "/api/payments", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sales/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/stats"] });
      toast({
        title: "Pagamento registrado",
        description: "O pagamento parcial foi registrado com sucesso.",
      });
      onClose();
      setAmount("");
      setPaymentMethod("");
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao registrar o pagamento.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sale || !amount || !paymentMethod) return;

    const numAmount = parseFloat(amount.replace(",", "."));
    if (isNaN(numAmount) || numAmount <= 0) {
      toast({
        title: "Valor inválido",
        description: "Digite um valor válido para o pagamento.",
        variant: "destructive",
      });
      return;
    }

    const totalPaid = sale.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const remaining = Number(sale.total) - totalPaid;

    if (numAmount > remaining) {
      toast({
        title: "Valor excede o restante",
        description: `O valor não pode ser maior que R$ ${remaining.toFixed(2)}`,
        variant: "destructive",
      });
      return;
    }

    paymentMutation.mutate({
      saleId: sale.id,
      amount: numAmount,
      paymentMethod,
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (!sale) return null;

  const totalPaid = sale.payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const remaining = Number(sale.total) - totalPaid;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Pagamento Parcial</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Cliente</Label>
            <Input 
              value={sale.customerName || "Cliente Anônimo"} 
              readOnly 
              className="bg-muted"
            />
          </div>
          
          <div>
            <Label>Total da Venda</Label>
            <Input 
              value={formatCurrency(Number(sale.total))} 
              readOnly 
              className="bg-muted"
            />
          </div>

          <div>
            <Label>Valor Já Pago</Label>
            <Input 
              value={formatCurrency(totalPaid)} 
              readOnly 
              className="bg-muted"
            />
          </div>

          <div>
            <Label>Valor Restante</Label>
            <Input 
              value={formatCurrency(remaining)} 
              readOnly 
              className="bg-muted"
            />
          </div>
          
          <div>
            <Label htmlFor="payment-amount">Valor do Pagamento</Label>
            <Input
              id="payment-amount"
              type="text"
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              data-testid="input-payment-amount"
            />
          </div>

          <div>
            <Label htmlFor="payment-method">Método de Pagamento</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod} required>
              <SelectTrigger data-testid="select-payment-method">
                <SelectValue placeholder="Selecione o método" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pix">PIX</SelectItem>
                <SelectItem value="credit">Cartão Crédito</SelectItem>
                <SelectItem value="debit">Cartão Débito</SelectItem>
                <SelectItem value="cash">Dinheiro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex space-x-3">
            <Button 
              type="submit" 
              className="flex-1" 
              disabled={paymentMutation.isPending}
              data-testid="button-submit-payment"
            >
              {paymentMutation.isPending ? "Registrando..." : "Registrar"}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1" 
              onClick={onClose}
              data-testid="button-cancel-payment"
            >
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
