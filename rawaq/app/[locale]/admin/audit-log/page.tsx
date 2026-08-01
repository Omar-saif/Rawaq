"use client";

import React, { useEffect, useState } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Button } from "@/components/ui/Button";

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
  const [pruning, setPruning] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const fetchLogs = async (pageNum: number, append = false) => {
    try {
      const res = await fetch(`/api/admin/audit-logs?page=${pageNum}`);
      const json = await res.json();
      setLogs(prev => append ? [...prev, ...(json.data ?? [])] : (json.data ?? []));
      setHasMore((json.meta?.page || 1) < (json.meta?.totalPages || 1));
      setTotalCount(json.meta?.total || 0);
    } catch (err) {
      console.error("Failed to load audit logs:", err);
    }
  };

  useEffect(() => {
    async function loadLogs() {
      await fetchLogs(1, false);
      setLoading(false);
    }
    loadLogs();
  }, []);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchLogs(nextPage, true);
  };

  const handlePrune = async () => {
    if (!confirm("Are you sure you want to delete all audit logs older than 90 days?")) return;
    setPruning(true);
    try {
      const res = await fetch("/api/admin/audit-logs/prune", { method: "POST" });
      const json = await res.json();
      if (res.ok) {
        alert(`Successfully deleted ${json.data.deletedCount} old logs.`);
        setPage(1);
        await fetchLogs(1, false);
      } else {
        alert("Failed to prune logs: " + (json.error?.message || "Unknown error"));
      }
    } catch (err) {
      alert("Network error while pruning logs.");
    } finally {
      setPruning(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-gray-50)] flex">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">
        <header className="bg-white border-b border-[var(--color-border)] sticky top-0 z-10 px-8 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-[var(--color-brand-navy)]">Audit Log ({totalCount})</h2>
          <Button variant="secondary" onClick={handlePrune} loading={pruning}>
            Clean up old logs (&gt;90 days)
          </Button>
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
            {hasMore && (
              <div className="p-4 flex justify-center border-t border-gray-100 bg-gray-50/30">
                <Button variant="secondary" onClick={handleLoadMore}>
                  Load More
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
