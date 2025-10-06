import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BottomNavigation } from "@/components/bottom-navigation";
import { ProductSelection } from "@/components/product-selection";
import { ShoppingCart } from "@/components/shopping-cart";
import { PartialPaymentModal } from "@/components/partial-payment-modal";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ShoppingCart as CartIcon, Package, Clock, CheckCircle, ArrowLeft, Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import type { Product, SaleWithItems, InsertSale, InsertSaleItem } from "@shared/schema";

interface CartItem extends Product {
  quantity: number;
}

export default function SalesPage() {
  const [, setLocation] = useLocation();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [activeTab, setActiveTab] = useState("new-sale");
  const [partialPaymentModal, setPartialPaymentModal] = useState<{
    isOpen: boolean;
    sale: SaleWithItems | null;
  }>({ isOpen: false, sale: null });
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch sales data
  const { data: sales = [], isLoading: salesLoading } = useQuery<SaleWithItems[]>({
    queryKey: ["/api/sales"],
  });

  const { data: pendingSales = [], isLoading: pendingLoading } = useQuery<SaleWithItems[]>({
    queryKey: ["/api/sales/pending"],
  });

  // Create sale mutation
  const createSaleMutation = useMutation({
    mutationFn: async (data: {
      sale: InsertSale;
      items: InsertSaleItem[];
    }) => {
      await apiRequest("POST", "/api/sales", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sales/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setCartItems([]);
      toast({
        title: "Venda registrada",
        description: "A venda foi registrada com sucesso.",
      });
      setActiveTab("sales");
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao registrar a venda.",
        variant: "destructive",
      });
    },
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
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
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

  // Delete sale mutation
  const deleteSaleMutation = useMutation({
    mutationFn: async (saleId: string) => {
      await apiRequest("DELETE", `/api/sales/${saleId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sales/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/stats"] });
      toast({
        title: "Venda excluída",
        description: "A venda foi excluída com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao excluir a venda.",
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

  const addToCart = (product: Product) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartItems(prev =>
      prev.map(item =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== productId));
  };

  const handleCheckout = (checkoutData: {
    customerName?: string;
    customerId?: string;
    paymentMethod: string;
    cardType?: string;
    isPaid: boolean;
  }) => {
    const total = cartItems.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);
    
    const sale: InsertSale = {
      customerId: checkoutData.customerId,
      customerName: checkoutData.customerName,
      total: total.toString(),
      paymentStatus: checkoutData.isPaid ? "paid" : "pending",
      paymentMethod: checkoutData.paymentMethod,
      isPaid: checkoutData.isPaid,
    };

    const items: InsertSaleItem[] = cartItems.map(item => ({
      saleId: "", // Will be set by the backend
      productId: item.id,
      productName: item.name,
      productPrice: item.price,
      quantity: item.quantity,
      subtotal: (Number(item.price) * item.quantity).toString(),
    }));

    createSaleMutation.mutate({ sale, items });
  };

  // Filter paid sales (exclude pending ones)
  const paidSales = sales.filter(sale => sale.isPaid);

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
            <h1 className="text-lg font-semibold">Vendas</h1>
          </div>
          {activeTab === "new-sale" && cartItems.length > 0 && (
            <Badge variant="default" className="flex items-center space-x-1">
              <CartIcon className="w-4 h-4" />
              <span>{cartItems.length}</span>
            </Badge>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="new-sale" data-testid="tab-new-sale">
              <Package className="w-4 h-4 mr-2" />
              Nova Venda
            </TabsTrigger>
            <TabsTrigger value="pending" data-testid="tab-pending">
              <Clock className="w-4 h-4 mr-2" />
              Pendentes ({pendingSales.length})
            </TabsTrigger>
            <TabsTrigger value="sales" data-testid="tab-sales">
              <CheckCircle className="w-4 h-4 mr-2" />
              Vendas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="new-sale" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Product Selection */}
              <div>
                <h2 className="text-xl font-semibold mb-4">Selecionar Produtos</h2>
                <ProductSelection onAddToCart={addToCart} />
              </div>

              {/* Shopping Cart */}
              <div>
                <h2 className="text-xl font-semibold mb-4">Carrinho</h2>
                <ShoppingCart
                  items={cartItems}
                  onUpdateQuantity={updateQuantity}
                  onRemoveItem={removeFromCart}
                  onCheckout={handleCheckout}
                  isProcessing={createSaleMutation.isPending}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Vendas Pendentes</h2>
              <Badge variant="secondary">
                {pendingSales.length} pendente{pendingSales.length !== 1 ? 's' : ''}
              </Badge>
            </div>

            {pendingLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-24 bg-muted rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : pendingSales.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhuma venda pendente</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Todas as vendas estão em dia!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {pendingSales.map((sale) => {
                  const totalPaid = sale.payments.reduce((sum, p) => sum + Number(p.amount), 0);
                  const remaining = Number(sale.total) - totalPaid;

                  return (
                    <Card key={sale.id} data-testid={`pending-sale-${sale.id}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex-1">
                            <p className="font-medium" data-testid={`customer-name-${sale.id}`}>
                              {sale.customerName || "Cliente Anônimo"}
                            </p>
                            <p className="text-sm text-muted-foreground" data-testid={`sale-date-${sale.id}`}>
                              {new Date(sale.createdAt!).toLocaleDateString('pt-BR')} - {new Date(sale.createdAt!).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            {sale.paymentMethod && (
                              <Badge variant="outline" className="mt-1">
                                {sale.paymentMethod === 'pix' ? 'PIX' : 
                                 sale.paymentMethod === 'credit' ? 'Crédito' :
                                 sale.paymentMethod === 'debit' ? 'Débito' : 'Dinheiro'}
                              </Badge>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-semibold" data-testid={`total-${sale.id}`}>
                              {formatCurrency(Number(sale.total))}
                            </p>
                            {totalPaid > 0 && (
                              <div className="text-sm text-muted-foreground">
                                <p>Pago: {formatCurrency(totalPaid)}</p>
                                <p className="text-accent font-medium">Restante: {formatCurrency(remaining)}</p>
                              </div>
                            )}
                            <Badge variant="secondary" className="mt-1">
                              {sale.paymentStatus === 'partial' ? 'Parcial' : 'Pendente'}
                            </Badge>
                          </div>
                        </div>

                        {/* Sale Items */}
                        <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                          <p className="text-sm font-medium mb-2">Itens:</p>
                          <div className="space-y-1">
                            {sale.items.map((item) => (
                              <div key={item.id} className="flex justify-between text-sm">
                                <span>{item.productName} x{item.quantity}</span>
                                <span>{formatCurrency(Number(item.subtotal))}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                size="sm" 
                                className="flex-1"
                                data-testid={`button-mark-paid-${sale.id}`}
                              >
                                Marcar como Pago
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmar Pagamento</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja marcar esta venda como totalmente paga?
                                  <br />
                                  <strong>Valor total: {formatCurrency(Number(sale.total))}</strong>
                                  {totalPaid > 0 && (
                                    <>
                                      <br />
                                      <span>Já foi pago: {formatCurrency(totalPaid)}</span>
                                    </>
                                  )}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => markAsPaidMutation.mutate(sale.id)}
                                  disabled={markAsPaidMutation.isPending}
                                >
                                  Confirmar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                          
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setPartialPaymentModal({ isOpen: true, sale })}
                            data-testid={`button-partial-payment-${sale.id}`}
                          >
                            Pag. Parcial
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                data-testid={`button-delete-pending-${sale.id}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir Venda</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir esta venda pendente?
                                  Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteSaleMutation.mutate(sale.id)}
                                  disabled={deleteSaleMutation.isPending}
                                  className="bg-destructive hover:bg-destructive/90"
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="sales" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Histórico de Vendas</h2>
              <Badge variant="default">
                {paidSales.length} venda{paidSales.length !== 1 ? 's' : ''}
              </Badge>
            </div>

            {salesLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-24 bg-muted rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : paidSales.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <CheckCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhuma venda registrada</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Comece registrando sua primeira venda
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {paidSales.map((sale) => (
                  <Card key={sale.id} data-testid={`sale-${sale.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex-1">
                          <p className="font-medium" data-testid={`sale-customer-${sale.id}`}>
                            {sale.customerName || "Cliente Anônimo"}
                          </p>
                          <p className="text-sm text-muted-foreground" data-testid={`sale-date-${sale.id}`}>
                            {new Date(sale.createdAt!).toLocaleDateString('pt-BR')} - {new Date(sale.createdAt!).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          {sale.paymentMethod && (
                            <Badge variant="outline" className="mt-1">
                              {sale.paymentMethod === 'pix' ? 'PIX' : 
                               sale.paymentMethod === 'credit' ? 'Crédito' :
                               sale.paymentMethod === 'debit' ? 'Débito' : 'Dinheiro'}
                            </Badge>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold" data-testid={`sale-total-${sale.id}`}>
                            {formatCurrency(Number(sale.total))}
                          </p>
                          <Badge variant="default" className="mt-1">
                            Pago
                          </Badge>
                        </div>
                      </div>

                      {/* Sale Items */}
                      <div className="p-3 bg-muted/50 rounded-lg mb-3">
                        <p className="text-sm font-medium mb-2">Itens vendidos:</p>
                        <div className="space-y-1">
                          {sale.items.map((item) => (
                            <div key={item.id} className="flex justify-between text-sm">
                              <span>{item.productName} x{item.quantity}</span>
                              <span>{formatCurrency(Number(item.subtotal))}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Delete Button */}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="w-full"
                            data-testid={`button-delete-sale-${sale.id}`}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir Venda
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir Venda</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir esta venda?
                              Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteSaleMutation.mutate(sale.id)}
                              disabled={deleteSaleMutation.isPending}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation />

      {/* Partial Payment Modal */}
      <PartialPaymentModal
        isOpen={partialPaymentModal.isOpen}
        onClose={() => setPartialPaymentModal({ isOpen: false, sale: null })}
        sale={partialPaymentModal.sale}
      />
    </div>
  );
}
