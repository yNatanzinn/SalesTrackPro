import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { CustomerSearch } from "@/components/customer-search";
import { Minus, Plus, Trash2, ShoppingCart as CartIcon } from "lucide-react";
import type { Product, Customer } from "@shared/schema";

interface CartItem extends Product {
  quantity: number;
}

interface ShoppingCartProps {
  items: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onCheckout: (data: {
    customerName?: string;
    customerId?: string;
    paymentMethod: string;
    cardType?: string;
    isPaid: boolean;
  }) => void;
  isProcessing?: boolean;
}

export function ShoppingCart({ 
  items, 
  onUpdateQuantity, 
  onRemoveItem, 
  onCheckout, 
  isProcessing = false 
}: ShoppingCartProps) {
  const [customerName, setCustomerName] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [cardType, setCardType] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("paid");

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const total = items.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);

  const handleCheckout = () => {
    onCheckout({
      customerName: selectedCustomer ? selectedCustomer.name : customerName,
      customerId: selectedCustomer?.id,
      paymentMethod: paymentMethod ? (paymentMethod === "credit" || paymentMethod === "debit" ? cardType : paymentMethod) : undefined,
      isPaid: paymentStatus === "paid",
    });
  };

  const canCheckout = items.length > 0 && 
    (paymentStatus === "pending" || (paymentStatus === "paid" && paymentMethod)) &&
    (!paymentMethod || (paymentMethod !== "credit" && paymentMethod !== "debit" || cardType)) &&
    (paymentStatus === "paid" || (paymentStatus === "pending" && (customerName || selectedCustomer)));

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <CartIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Carrinho vazio</p>
          <p className="text-sm text-muted-foreground mt-2">
            Adicione produtos para começar uma venda
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cart Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CartIcon className="w-5 h-5" />
            <span>Carrinho ({items.length} itens)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex-1">
                <h4 className="font-medium" data-testid={`cart-item-name-${item.id}`}>
                  {item.name}
                </h4>
                <p className="text-sm text-muted-foreground" data-testid={`cart-item-price-${item.id}`}>
                  {formatCurrency(Number(item.price))} cada
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onUpdateQuantity(item.id, Math.max(0, item.quantity - 1))}
                  disabled={item.quantity <= 1}
                  data-testid={`button-decrease-${item.id}`}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                
                <span className="w-8 text-center font-medium" data-testid={`cart-item-quantity-${item.id}`}>
                  {item.quantity}
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                  data-testid={`button-increase-${item.id}`}
                >
                  <Plus className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onRemoveItem(item.id)}
                  data-testid={`button-remove-${item.id}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="text-right ml-4">
                <p className="font-bold" data-testid={`cart-item-subtotal-${item.id}`}>
                  {formatCurrency(Number(item.price) * item.quantity)}
                </p>
              </div>
            </div>
          ))}
          
          <Separator />
          
          <div className="flex justify-between items-center text-lg font-bold">
            <span>Total:</span>
            <span data-testid="cart-total">{formatCurrency(total)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Checkout Form */}
      <Card>
        <CardHeader>
          <CardTitle>Finalizar Venda</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Payment Status */}
          <div>
            <Label>Status do Pagamento</Label>
            <Select value={paymentStatus} onValueChange={setPaymentStatus}>
              <SelectTrigger data-testid="select-payment-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="paid">Pago</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Customer Information */}
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <Label>
              Informações do Cliente
              {paymentStatus === "paid" && <span className="text-muted-foreground text-sm ml-2">(Opcional)</span>}
              {paymentStatus === "pending" && <span className="text-destructive text-sm ml-2">*</span>}
            </Label>
            
            <CustomerSearch
              onCustomerSelect={setSelectedCustomer}
              placeholder="Buscar cliente existente..."
            />
            
            {!selectedCustomer && (
              <div>
                <Label htmlFor="customer-name">
                  Nome do Cliente
                  {paymentStatus === "paid" && <span className="text-muted-foreground text-sm ml-2">(Opcional)</span>}
                </Label>
                <Input
                  id="customer-name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Digite o nome do cliente"
                  data-testid="input-customer-name"
                />
              </div>
            )}
            
            {selectedCustomer && (
              <div className="p-3 bg-primary/10 rounded-lg">
                <p className="font-medium">{selectedCustomer.name}</p>
                {selectedCustomer.email && (
                  <p className="text-sm text-muted-foreground">{selectedCustomer.email}</p>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedCustomer(null)}
                  className="mt-2"
                  data-testid="button-clear-customer"
                >
                  Limpar seleção
                </Button>
              </div>
            )}
          </div>

          {/* Payment Method */}
          <div>
            <Label>
              Método de Pagamento
              {paymentStatus === "pending" && <span className="text-muted-foreground text-sm ml-2">(Opcional)</span>}
              {paymentStatus === "paid" && <span className="text-destructive text-sm ml-2">*</span>}
            </Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger data-testid="select-payment-method">
                <SelectValue placeholder="Selecione o método" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pix">PIX</SelectItem>
                <SelectItem value="credit">Cartão</SelectItem>
                <SelectItem value="cash">Dinheiro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Card Type (only for card payments) */}
          {paymentMethod === "credit" && (
            <div>
              <Label>Tipo de Cartão</Label>
              <Select value={cardType} onValueChange={setCardType}>
                <SelectTrigger data-testid="select-card-type">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="credit">Crédito</SelectItem>
                  <SelectItem value="debit">Débito</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Checkout Button */}
          <Button
            onClick={handleCheckout}
            disabled={!canCheckout || isProcessing}
            className="w-full"
            size="lg"
            data-testid="button-checkout"
          >
            {isProcessing ? "Processando..." : "Registrar Venda"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
