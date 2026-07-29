import React from "react";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { getSession } from "@/lib/utils/session";
import { prisma } from "@/lib/db/prisma";
import { Link } from "@/lib/i18n/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin Dashboard | Rawaq" };

export default async function AdminDashboard() {
  const locale = await getLocale();
  const session = await getSession();

  if (!session || session.role !== "ADMIN") redirect(`/${locale}/login`);

  const [totalOrders, totalProducts, totalRevenue, recentOrders, totalUsers, lowStockProducts, channelBreakdown] = await Promise.all([
    prisma.order.count(),
    prisma.product.count({ where: { isActive: true } }),
    prisma.order.aggregate({ _sum: { total: true }, where: { status: { in: ["PAID", "SHIPPED", "DELIVERED"] } } }),
    prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
        _count: { select: { items: true } },
      },
    }),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.product.findMany({
      where: { inventoryCount: { lte: 5 } },
      take: 5,
      orderBy: { inventoryCount: "asc" },
      select: { id: true, title: true, sku: true, inventoryCount: true, slug: true }
    }),
    prisma.order.groupBy({
      by: ["channel"],
      _count: { id: true },
      _sum: { total: true },
      where: { status: { in: ["PAID", "SHIPPED", "DELIVERED"] } }
    })
  ]);

  const revenue = parseFloat((totalRevenue._sum.total ?? 0).toString());

  const statusColors: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-800",
    PAID: "bg-blue-100 text-blue-800",
    SHIPPED: "bg-purple-100 text-purple-800",
    DELIVERED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
  };



  return (
    <div className="min-h-screen bg-[var(--color-gray-50)] flex">
      <AdminSidebar />

      {/* Main content */}
      <main className="flex-1 p-8 overflow-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-[var(--color-brand-navy)]">Dashboard</h2>
          <p className="text-[var(--color-muted)] text-sm mt-1">Welcome back, {session.email}</p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Revenue", value: `${revenue.toFixed(0)} SAR`, icon: "💰", color: "from-green-500 to-emerald-600" },
            { label: "Total Orders", value: totalOrders.toString(), icon: "📦", color: "from-blue-500 to-blue-700" },
            { label: "Active Products", value: totalProducts.toString(), icon: "🛍️", color: "from-purple-500 to-purple-700" },
            { label: "Customers", value: totalUsers.toString(), icon: "👥", color: "from-orange-500 to-orange-700" },
          ].map((stat) => (
            <div key={stat.label} className={`bg-gradient-to-br ${stat.color} rounded-[var(--radius-xl)] p-6 text-white`}>
              <p className="text-3xl mb-1">{stat.icon}</p>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-sm text-white/80 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Channel Breakdown */}
        <div className="bg-white rounded-[var(--radius-xl)] border border-[var(--color-border)] p-6 mb-8">
          <h3 className="font-bold text-[var(--color-brand-navy)] mb-4">Revenue by Sales Channel</h3>
          {channelBreakdown.length === 0 ? (
            <p className="text-sm text-[var(--color-muted)]">No revenue data yet.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {channelBreakdown.map((cb) => (
                <div key={cb.channel} className="bg-[var(--color-gray-50)] border border-[var(--color-border)] rounded-lg p-4 flex flex-col items-center justify-center text-center">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider mb-2 ${cb.channel === 'WEBSITE' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-pink-50 text-pink-600 border border-pink-100'}`}>
                    {cb.channel}
                  </span>
                  <span className="text-lg font-bold text-[var(--color-brand-navy)]">
                    {parseFloat((cb._sum.total ?? 0).toString()).toFixed(0)} SAR
                  </span>
                  <span className="text-xs text-[var(--color-muted)] mt-1">{cb._count.id} orders</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { href: "/admin/products", label: "Manage Products", desc: "Add, edit, delete products" },
            { href: "/admin/orders", label: "View Orders", desc: "Process and update orders" },
            { href: "/admin/categories", label: "Categories", desc: "Manage category tree" },
            { href: "/admin/coupons", label: "Coupons", desc: "Create discount codes" },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href as Parameters<typeof Link>[0]["href"]}
              className="bg-white rounded-[var(--radius-xl)] border border-[var(--color-border)] p-5 hover:shadow-[var(--shadow-md)] hover:border-[var(--color-brand-navy)]/30 transition-all group"
            >
              <p className="font-semibold text-[var(--color-brand-navy)] group-hover:text-[var(--color-brand-gold)] transition-colors">{action.label}</p>
              <p className="text-xs text-[var(--color-muted)] mt-1">{action.desc}</p>
            </Link>
          ))}
        </div>

        {/* Recent orders */}
        <div className="bg-white rounded-[var(--radius-xl)] border border-[var(--color-border)]">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
            <h3 className="font-bold text-[var(--color-brand-navy)]">Recent Orders</h3>
            <Link href="/admin/orders" className="text-xs text-[var(--color-brand-navy)] hover:underline">
              View All →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  {["Order ID", "Customer", "Items", "Total", "Status", "Date", "Action"].map((h) => (
                    <th key={h} className="px-6 py-3 text-start text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-[var(--color-border)] hover:bg-[var(--color-gray-50)] transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-[var(--color-muted)]">#{order.id.slice(-8).toUpperCase()}</td>
                    <td className="px-6 py-4">
                      <p className="font-medium">{order.user?.name ?? "Guest"}</p>
                      <p className="text-xs text-[var(--color-muted)]">{order.user?.email ?? order.guestEmail}</p>
                    </td>
                    <td className="px-6 py-4 text-[var(--color-muted)]">{order._count.items} items</td>
                    <td className="px-6 py-4 font-semibold">{parseFloat(order.total.toString()).toFixed(2)} SAR</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusColors[order.status] ?? "bg-gray-100 text-gray-700"}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[var(--color-muted)]">
                      {new Date(order.createdAt).toLocaleDateString("en-SA")}
                    </td>
                    <td className="px-6 py-4">
                      <Link href={`/admin/orders/${order.id}` as Parameters<typeof Link>[0]["href"]} className="text-xs text-[var(--color-brand-navy)] hover:underline font-medium">
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {recentOrders.length === 0 && (
              <p className="text-center py-8 text-[var(--color-muted)] text-sm">No orders yet.</p>
            )}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="mt-8 bg-white rounded-[var(--radius-xl)] border border-[var(--color-border)] p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[var(--color-brand-navy)] flex items-center gap-2">
              <span className="text-red-500">⚠️</span> Low Stock Alerts
            </h3>
            <Link href="/admin/products" className="text-xs text-[var(--color-brand-navy)] hover:underline">
              Manage Products →
            </Link>
          </div>
          {lowStockProducts.length === 0 ? (
            <p className="text-sm text-[var(--color-muted)] text-center py-4">All products are well stocked.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)]">
                    <th className="px-4 py-2 text-start text-xs font-semibold text-[var(--color-muted)] uppercase">Product</th>
                    <th className="px-4 py-2 text-start text-xs font-semibold text-[var(--color-muted)] uppercase">SKU</th>
                    <th className="px-4 py-2 text-start text-xs font-semibold text-[var(--color-muted)] uppercase">Stock</th>
                    <th className="px-4 py-2 text-start text-xs font-semibold text-[var(--color-muted)] uppercase">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockProducts.map(p => (
                    <tr key={p.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-gray-50)]">
                      <td className="px-4 py-3 font-medium">{p.title}</td>
                      <td className="px-4 py-3 text-xs font-mono">{p.sku}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${p.inventoryCount === 0 ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"}`}>
                          {p.inventoryCount}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/product/${p.slug}`} target="_blank" className="text-xs text-[var(--color-brand-navy)] hover:underline">View</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
