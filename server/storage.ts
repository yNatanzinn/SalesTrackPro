import { 
  users, products, customers, sales, saleItems, payments,
  type User, type InsertUser, type Product, type InsertProduct,
  type Customer, type InsertCustomer, type Sale, type InsertSale,
  type SaleItem, type InsertSaleItem, type Payment, type InsertPayment,
  type SaleWithItems
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql, desc, gte, lte } from "drizzle-orm";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  
  // Product operations
  getProducts(vendorId: string): Promise<Product[]>;
  getProduct(id: string, vendorId: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct, vendorId: string): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>, vendorId: string): Promise<Product | undefined>;
  deleteProduct(id: string, vendorId: string): Promise<boolean>;
  
  // Customer operations
  getCustomers(vendorId: string): Promise<Customer[]>;
  getCustomer(id: string, vendorId: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer, vendorId: string): Promise<Customer>;
  searchCustomers(query: string, vendorId: string): Promise<Customer[]>;
  
  // Sale operations
  getSales(vendorId: string, startDate?: Date, endDate?: Date): Promise<SaleWithItems[]>;
  getSale(id: string, vendorId: string): Promise<SaleWithItems | undefined>;
  createSale(sale: InsertSale, items: InsertSaleItem[], vendorId: string): Promise<SaleWithItems>;
  updateSaleStatus(id: string, paymentStatus: string, isPaid: boolean, vendorId: string, paymentMethod?: string): Promise<Sale | undefined>;
  getPendingSales(vendorId: string): Promise<SaleWithItems[]>;
  deleteSale(id: string, vendorId: string): Promise<boolean>;
  
  // Payment operations
  addPayment(payment: InsertPayment): Promise<Payment>;
  getSalePayments(saleId: string): Promise<Payment[]>;
  
  // Analytics
  getSalesStats(vendorId: string, startDate?: Date, endDate?: Date): Promise<{
    totalSales: number;
    paidSales: number;
    pendingSales: number;
    salesCount: number;
    paymentMethods: { method: string; total: number }[];
    dailySales: { date: string; total: number }[];
    productSales: { productName: string; quantity: number; total: number }[];
  }>;
  
  sessionStore: any;
}

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Product operations
  async getProducts(vendorId: string): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.vendorId, vendorId));
  }

  async getProduct(id: string, vendorId: string): Promise<Product | undefined> {
    const [product] = await db
      .select()
      .from(products)
      .where(and(eq(products.id, id), eq(products.vendorId, vendorId)));
    return product || undefined;
  }

  async createProduct(product: InsertProduct, vendorId: string): Promise<Product> {
    const [newProduct] = await db
      .insert(products)
      .values({ ...product, vendorId })
      .returning();
    return newProduct;
  }

  async updateProduct(id: string, product: Partial<InsertProduct>, vendorId: string): Promise<Product | undefined> {
    const [updatedProduct] = await db
      .update(products)
      .set({ ...product, updatedAt: new Date() })
      .where(and(eq(products.id, id), eq(products.vendorId, vendorId)))
      .returning();
    return updatedProduct || undefined;
  }

  async deleteProduct(id: string, vendorId: string): Promise<boolean> {
    const result = await db
      .delete(products)
      .where(and(eq(products.id, id), eq(products.vendorId, vendorId)));
    return (result.rowCount ?? 0) > 0;
  }

  // Customer operations
  async getCustomers(vendorId: string): Promise<Customer[]> {
    return await db.select().from(customers).where(eq(customers.vendorId, vendorId));
  }

  async getCustomer(id: string, vendorId: string): Promise<Customer | undefined> {
    const [customer] = await db
      .select()
      .from(customers)
      .where(and(eq(customers.id, id), eq(customers.vendorId, vendorId)));
    return customer || undefined;
  }

  async createCustomer(customer: InsertCustomer, vendorId: string): Promise<Customer> {
    const [newCustomer] = await db
      .insert(customers)
      .values({ ...customer, vendorId })
      .returning();
    return newCustomer;
  }

  async searchCustomers(query: string, vendorId: string): Promise<Customer[]> {
    return await db
      .select()
      .from(customers)
      .where(
        and(
          eq(customers.vendorId, vendorId),
          sql`${customers.name} LIKE ${`%${query}%`}`
        )
      );
  }

  // Sale operations
  async getSales(vendorId: string, startDate?: Date, endDate?: Date): Promise<SaleWithItems[]> {
    let whereCondition = startDate && endDate 
      ? and(
          eq(sales.vendorId, vendorId),
          gte(sales.createdAt, startDate),
          lte(sales.createdAt, endDate)
        )!
      : eq(sales.vendorId, vendorId);

    const salesData = await db
      .select()
      .from(sales)
      .leftJoin(customers, eq(sales.customerId, customers.id))
      .where(whereCondition)
      .orderBy(desc(sales.createdAt));

    const salesWithItems: SaleWithItems[] = [];

    for (const saleData of salesData) {
      const items = await db
        .select()
        .from(saleItems)
        .leftJoin(products, eq(saleItems.productId, products.id))
        .where(eq(saleItems.saleId, saleData.sales.id));

      const salePayments = await db
        .select()
        .from(payments)
        .where(eq(payments.saleId, saleData.sales.id));

      salesWithItems.push({
        ...saleData.sales,
        items: items.map(item => ({
          ...item.sale_items,
          product: item.products!
        })),
        payments: salePayments,
        customer: saleData.customers || undefined
      });
    }

    return salesWithItems;
  }

  async getSale(id: string, vendorId: string): Promise<SaleWithItems | undefined> {
    const [saleData] = await db
      .select()
      .from(sales)
      .leftJoin(customers, eq(sales.customerId, customers.id))
      .where(and(eq(sales.id, id), eq(sales.vendorId, vendorId)));

    if (!saleData) return undefined;

    const items = await db
      .select()
      .from(saleItems)
      .leftJoin(products, eq(saleItems.productId, products.id))
      .where(eq(saleItems.saleId, id));

    const salePayments = await db
      .select()
      .from(payments)
      .where(eq(payments.saleId, id));

    return {
      ...saleData.sales,
      items: items.map(item => ({
        ...item.sale_items,
        product: item.products!
      })),
      payments: salePayments,
      customer: saleData.customers || undefined
    };
  }

  async createSale(sale: InsertSale, items: InsertSaleItem[], vendorId: string): Promise<SaleWithItems> {
    const [newSale] = await db
      .insert(sales)
      .values({ ...sale, vendorId })
      .returning();

    const saleItemsData = await db
      .insert(saleItems)
      .values(items.map(item => ({ ...item, saleId: newSale.id })))
      .returning();

    const itemsWithProducts = [];
    for (const item of saleItemsData) {
      const [product] = await db
        .select()
        .from(products)
        .where(eq(products.id, item.productId));
      
      itemsWithProducts.push({
        ...item,
        product: product!
      });
    }

    return {
      ...newSale,
      items: itemsWithProducts,
      payments: []
    };
  }

  async updateSaleStatus(id: string, paymentStatus: string, isPaid: boolean, vendorId: string, paymentMethod?: string): Promise<Sale | undefined> {
    const updateData: any = { paymentStatus, isPaid, updatedAt: new Date() };
    if (paymentMethod !== undefined) {
      updateData.paymentMethod = paymentMethod;
    }
    const [updatedSale] = await db
      .update(sales)
      .set(updateData)
      .where(and(eq(sales.id, id), eq(sales.vendorId, vendorId)))
      .returning();
    return updatedSale || undefined;
  }

  async deleteSale(id: string, vendorId: string): Promise<boolean> {
    await db.delete(payments).where(eq(payments.saleId, id));
    await db.delete(saleItems).where(eq(saleItems.saleId, id));
    const result = await db
      .delete(sales)
      .where(and(eq(sales.id, id), eq(sales.vendorId, vendorId)));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getPendingSales(vendorId: string): Promise<SaleWithItems[]> {
    const pendingSales = await db
      .select()
      .from(sales)
      .leftJoin(customers, eq(sales.customerId, customers.id))
      .where(
        and(
          eq(sales.vendorId, vendorId),
          eq(sales.isPaid, false)
        )
      )
      .orderBy(desc(sales.createdAt));

    const salesWithItems: SaleWithItems[] = [];

    for (const saleData of pendingSales) {
      const items = await db
        .select()
        .from(saleItems)
        .leftJoin(products, eq(saleItems.productId, products.id))
        .where(eq(saleItems.saleId, saleData.sales.id));

      const salePayments = await db
        .select()
        .from(payments)
        .where(eq(payments.saleId, saleData.sales.id));

      salesWithItems.push({
        ...saleData.sales,
        items: items.map(item => ({
          ...item.sale_items,
          product: item.products!
        })),
        payments: salePayments,
        customer: saleData.customers || undefined
      });
    }

    return salesWithItems;
  }

  // Payment operations
  async addPayment(payment: InsertPayment): Promise<Payment> {
    const [newPayment] = await db
      .insert(payments)
      .values(payment)
      .returning();
    return newPayment;
  }

  async getSalePayments(saleId: string): Promise<Payment[]> {
    return await db
      .select()
      .from(payments)
      .where(eq(payments.saleId, saleId));
  }

  // Analytics
  async getSalesStats(vendorId: string, startDate?: Date, endDate?: Date): Promise<{
    totalSales: number;
    paidSales: number;
    pendingSales: number;
    salesCount: number;
    paymentMethods: { method: string; total: number }[];
    dailySales: { date: string; total: number }[];
    productSales: { productName: string; quantity: number; total: number }[];
  }> {
    let whereCondition = startDate && endDate 
      ? and(
          eq(sales.vendorId, vendorId),
          gte(sales.createdAt, startDate),
          lte(sales.createdAt, endDate)
        )!
      : eq(sales.vendorId, vendorId);

    // Get basic stats
    const [totalStats] = await db
      .select({
        totalSales: sql<number>`COALESCE(SUM(${sales.total}), 0)`,
        paidSales: sql<number>`COALESCE(SUM(CASE WHEN ${sales.isPaid} = true THEN ${sales.total} ELSE 0 END), 0)`,
        pendingSales: sql<number>`COALESCE(SUM(CASE WHEN ${sales.isPaid} = false THEN ${sales.total} ELSE 0 END), 0)`,
        salesCount: sql<number>`COUNT(*)`,
      })
      .from(sales)
      .where(whereCondition);

    // Get payment methods
    const paymentMethodStats = await db
      .select({
        method: sales.paymentMethod,
        total: sql<number>`COALESCE(SUM(${sales.total}), 0)`,
      })
      .from(sales)
      .where(and(whereCondition, eq(sales.isPaid, true)))
      .groupBy(sales.paymentMethod);

    // Get daily sales
    const dailySalesStats = await db
      .select({
        date: sql<string>`DATE(${sales.createdAt})`,
        total: sql<number>`COALESCE(SUM(${sales.total}), 0)`,
      })
      .from(sales)
      .where(whereCondition)
      .groupBy(sql`DATE(${sales.createdAt})`)
      .orderBy(sql`DATE(${sales.createdAt})`);

    // Get product sales
    const productSalesStats = await db
      .select({
        productName: saleItems.productName,
        quantity: sql<number>`COALESCE(SUM(${saleItems.quantity}), 0)`,
        total: sql<number>`COALESCE(SUM(${saleItems.subtotal}), 0)`,
      })
      .from(saleItems)
      .leftJoin(sales, eq(saleItems.saleId, sales.id))
      .where(whereCondition)
      .groupBy(saleItems.productName)
      .orderBy(sql`SUM(${saleItems.quantity}) DESC`);

    return {
      totalSales: Number(totalStats.totalSales),
      paidSales: Number(totalStats.paidSales),
      pendingSales: Number(totalStats.pendingSales),
      salesCount: Number(totalStats.salesCount),
      paymentMethods: paymentMethodStats.map(pm => ({
        method: pm.method || 'unknown',
        total: Number(pm.total)
      })),
      dailySales: dailySalesStats.map(ds => ({
        date: ds.date,
        total: Number(ds.total)
      })),
      productSales: productSalesStats.map(ps => ({
        productName: ps.productName,
        quantity: Number(ps.quantity),
        total: Number(ps.total)
      }))
    };
  }
}

export const storage = new DatabaseStorage();
