import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { 
  insertProductSchema, insertCustomerSchema, insertSaleSchema, 
  insertSaleItemSchema, insertPaymentSchema 
} from "@shared/schema";

function requireAuth(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);


  // Product routes
  app.get("/api/products", requireAuth, async (req: any, res) => {
    try {
      const products = await storage.getProducts(req.user.id);
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.post("/api/products", requireAuth, async (req: any, res) => {
    try {
      const validatedData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(validatedData, req.user.id);
      res.status(201).json(product);
    } catch (error) {
      res.status(400).json({ message: "Invalid product data" });
    }
  });

  app.put("/api/products/:id", requireAuth, async (req: any, res) => {
    try {
      const validatedData = insertProductSchema.partial().parse(req.body);
      const product = await storage.updateProduct(req.params.id, validatedData, req.user.id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(400).json({ message: "Invalid product data" });
    }
  });

  app.delete("/api/products/:id", requireAuth, async (req: any, res) => {
    try {
      const success = await storage.deleteProduct(req.params.id, req.user.id);
      if (!success) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Customer routes
  app.get("/api/customers", requireAuth, async (req: any, res) => {
    try {
      const customers = await storage.getCustomers(req.user.id);
      res.json(customers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  app.get("/api/customers/search", requireAuth, async (req: any, res) => {
    try {
      const { q } = req.query;
      if (!q) {
        return res.status(400).json({ message: "Search query required" });
      }
      const customers = await storage.searchCustomers(q as string, req.user.id);
      res.json(customers);
    } catch (error) {
      res.status(500).json({ message: "Failed to search customers" });
    }
  });

  app.post("/api/customers", requireAuth, async (req: any, res) => {
    try {
      const validatedData = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(validatedData, req.user.id);
      res.status(201).json(customer);
    } catch (error) {
      res.status(400).json({ message: "Invalid customer data" });
    }
  });

  // Sales routes
  app.get("/api/sales", requireAuth, async (req: any, res) => {
    try {
      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;
      
      const sales = await storage.getSales(req.user.id, start, end);
      res.json(sales);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sales" });
    }
  });

  app.get("/api/sales/pending", requireAuth, async (req: any, res) => {
    try {
      const pendingSales = await storage.getPendingSales(req.user.id);
      res.json(pendingSales);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pending sales" });
    }
  });

  app.post("/api/sales", requireAuth, async (req: any, res) => {
    try {
      const { sale, items } = req.body;
      const validatedSale = insertSaleSchema.parse(sale);
      const validatedItems = items.map((item: any) => insertSaleItemSchema.parse(item));
      
      const newSale = await storage.createSale(validatedSale, validatedItems, req.user.id);
      res.status(201).json(newSale);
    } catch (error) {
      res.status(400).json({ message: "Invalid sale data" });
    }
  });

  app.put("/api/sales/:id/status", requireAuth, async (req: any, res) => {
    try {
      const { paymentStatus, isPaid, paymentMethod } = req.body;
      const sale = await storage.updateSaleStatus(req.params.id, paymentStatus, isPaid, req.user.id, paymentMethod);
      if (!sale) {
        return res.status(404).json({ message: "Sale not found" });
      }
      res.json(sale);
    } catch (error) {
      res.status(500).json({ message: "Failed to update sale status" });
    }
  });

  app.delete("/api/sales/:id", requireAuth, async (req: any, res) => {
    try {
      const success = await storage.deleteSale(req.params.id, req.user.id);
      if (!success) {
        return res.status(404).json({ message: "Sale not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete sale" });
    }
  });

  // Payment routes
  app.post("/api/payments", requireAuth, async (req: any, res) => {
    try {
      const validatedPayment = insertPaymentSchema.parse(req.body);
      const payment = await storage.addPayment(validatedPayment);
      
      // Update sale status if needed
      const salePayments = await storage.getSalePayments(validatedPayment.saleId);
      const totalPaid = salePayments.reduce((sum, p) => sum + Number(p.amount), 0);
      
      // Get the sale to check total
      const sale = await storage.getSale(validatedPayment.saleId, req.user.id);
      if (sale) {
        const saleTotal = Number(sale.total);
        if (totalPaid >= saleTotal) {
          await storage.updateSaleStatus(validatedPayment.saleId, "paid", true, req.user.id);
        } else {
          await storage.updateSaleStatus(validatedPayment.saleId, "partial", false, req.user.id);
        }
      }
      
      res.status(201).json(payment);
    } catch (error) {
      res.status(400).json({ message: "Invalid payment data" });
    }
  });

  // Analytics routes
  app.get("/api/analytics/stats", requireAuth, async (req: any, res) => {
    try {
      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;
      
      const stats = await storage.getSalesStats(req.user.id, start, end);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
