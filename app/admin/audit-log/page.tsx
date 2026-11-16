'use client'

import React, { useState, useEffect } from 'react'
import { AuditLog } from '@/types'
import { AuditLogRepository } from '@/lib/data/repositories'
import { History, ShieldCheck } from 'lucide-react'

export default function AdminAuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    AuditLogRepository.getLogs().then((res) => {
      setLogs(res)
      setLoading(false)
    })
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl sm:text-4xl text-cocoa">Owner Audit Trail</h1>
        <p className="text-xs sm:text-sm text-taupe mt-1">
          Immutable log of administrative updates, CMS publishing events, and product changes.
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-taupe bg-ivory rounded-3xl border border-sand">
          Loading audit trail from Firestore...
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-16 bg-ivory rounded-3xl border border-sand p-8 text-taupe text-xs">
          No audit logs recorded yet.
        </div>
      ) : (
        <div className="bg-ivory rounded-3xl border border-sand p-6 divide-y divide-sand">
          {logs.map((log) => (
            <div key={log.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-serif text-base font-medium text-cocoa">{log.action}</span>
                  <span className="text-[10px] bg-cream text-burgundy font-bold px-2 py-0.5 rounded-full">
                    {log.actor}
                  </span>
                </div>
                <p className="text-xs text-taupe mt-0.5">{log.details}</p>
              </div>

              <span className="text-xs text-taupe font-mono whitespace-nowrap self-end sm:self-auto">
                {new Date(log.timestamp).toLocaleString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
