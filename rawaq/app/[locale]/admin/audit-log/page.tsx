"use client";

import React, { useEffect, useState } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

interface AuditLog {
  id: string;
  admin: { name: string; email: string };
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
  createdAt: string;
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLogs() {
      try {
        const res = await fetch("/api/admin/audit-logs");
        const json = await res.json();
        setLogs(json.data ?? []);
      } catch (err) {
        console.error("Failed to load audit logs:", err);
      } finally {
        setLoading(false);
      }
    }
    loadLogs();
  }, []);

  return (
    <div className="min-h-screen bg-[var(--color-gray-50)] flex">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">
        <header className="bg-white border-b border-[var(--color-border)] sticky top-0 z-10 px-8 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-[var(--color-brand-navy)]">Audit Log</h2>
        </header>

        <div className="p-8">
          <div className="bg-white rounded-xl shadow-sm border border-[var(--color-border)] overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading...</div>
            ) : logs.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No audit logs found.</div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-[var(--color-gray-50)] text-gray-600 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 font-medium">Timestamp</th>
                    <th className="px-6 py-4 font-medium">Admin</th>
                    <th className="px-6 py-4 font-medium">Action</th>
                    <th className="px-6 py-4 font-medium">Resource</th>
                    <th className="px-6 py-4 font-medium">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{log.admin.name}</div>
                        <div className="text-gray-500 text-xs">{log.admin.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{log.resource}</div>
                        <div className="text-gray-500 text-xs font-mono">{log.resourceId}</div>
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        <div className="text-xs text-gray-500 truncate">
                          {log.details ? JSON.stringify(log.details) : "-"}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
