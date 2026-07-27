import React from "react";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { getSession } from "@/lib/utils/session";
import { prisma } from "@/lib/db/prisma";
import { Link } from "@/lib/i18n/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin Dashboard | Rawaq" };

export default async function AdminDashboard() {
  const locale = await getLocale();
  const session = await getSession();

  if (!session || session.role !== "ADMIN") redirect(`/${locale}/login`);

  const [totalOrders, totalProducts, totalRevenue, recentOrders, totalUsers] = await Promise.all([
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
  ]);

  const revenue = parseFloat((totalRevenue._sum.total ?? 0).toString());

  const statusColors: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-800",
    PAID: "bg-blue-100 text-blue-800",
    SHIPPED: "bg-purple-100 text-purple-800",
    DELIVERED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
  };

  const navItems = [
    { href: "/admin", label: "Dashboard", icon: "📊" },
    { href: "/admin/products", label: "Products", icon: "🛍️" },
    { href: "/admin/categories", label: "Categories", icon: "📂" },
    { href: "/admin/orders", label: "Orders", icon: "📦" },
    { href: "/admin/coupons", label: "Coupons", icon: "🏷️" },
    { href: "/account", label: "My Account", icon: "👤" },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-gray-50)] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[var(--color-brand-navy)] text-white flex flex-col">
        <div className="p-6 border-b border-white/10">
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-brand-gold)] mb-1">RAWAQ</p>
          <h1 className="text-lg font-bold">Admin Panel</h1>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href as Parameters<typeof Link>[0]["href"]}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all"
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

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
      </main>
    </div>
  );
}
