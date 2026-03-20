"use client"

import { useState } from "react"

function BureauCard({ b, colors }: { b: any; colors: any }) {
  const [open, setOpen] = useState(false)

  const voteRate  = b.registered > 0 ? ((b.voters    / b.registered) * 100).toFixed(2) : "0"
  const exprRate  = b.voters     > 0 ? ((b.expressed / b.voters)     * 100).toFixed(2) : "0"

  const winnerKey = b.winner?.split(" ").pop()
  const badgeCls  = colors[winnerKey] || "bg-gray-100 text-gray-600"

  return (
    <div
      className="bg-white rounded-xl p-4 overflow-hidden transition-all duration-200"
      style={{
        border: open ? "2px solid #2563eb" : "2px solid transparent",
        boxShadow: open
          ? "0 8px 30px rgba(37,99,235,.12)"
          : "0 1px 4px rgba(0,0,0,.07)"
      }}
    >

      {/* ── HEADER ── */}
      <div onClick={() => setOpen(o => !o)} className=" cursor-pointer">

        {/* Titre + chevron */}
        <div className="flex justify-between items-center mb-3">
          <div className="font-bold text-sm text-gray-900">🏫 {b.bureaux?.name}</div>
          <div
            className="text-gray-300 text-sm transition-transform duration-200"
            style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
          >
            ▼ 
          </div>
        </div>

        {/* Badge gagnant + participation */}
        <div className="flex items-center justify-between mb-3">
          <span className={`px-3 py-1 rounded-lg text-xs font-bold ${badgeCls}`}>
            🏆 {b.winner}
          </span>
          <span className="text-xs font-semibold text-gray-500">
            Participation : <span className="font-bold text-blue-600">{voteRate} %</span>
          </span>
        </div>

        {/* Barre participation */}
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-700"
            style={{ width: `${voteRate}%` }}
          />
        </div>

      </div>

      {/* ── DETAIL ── */}
      {open && (
        <div className="pb-5 pt-4">

          {/* STATS GRID */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {[
              { icon: "👥", label: "Inscrits",  val: b.registered },
              { icon: "🗳️", label: "Votants",   val: b.voters     },
              { icon: "✅", label: "Exprimés",  val: b.expressed  },
              { icon: "⚪", label: "Blancs",    val: b.blank      },
              { icon: "🔴", label: "Nuls",      val: b.null_votes },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-1 text-sm text-gray-600">
                <span>{s.icon}</span>
                <span>{s.label} :</span>
                <span className="font-bold text-gray-900">
                  {s.val?.toLocaleString("fr-FR") ?? "—"}
                </span>
              </div>
            ))}
          </div>

          {/* TAUX DE VOTE */}
          <div className="mb-3">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-500">Taux de vote</span>
              <span className="font-bold text-gray-800">{voteRate} %</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-700"
                style={{ width: `${voteRate}%` }}
              />
            </div>
          </div>

          {/* TAUX EXPRIMÉS */}
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-500">Taux exprimés</span>
              <span className="font-bold text-gray-800">{exprRate} %</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all duration-700"
                style={{ width: `${exprRate}%` }}
              />
            </div>
          </div>

          {/* TOP CANDIDATS */}
          <div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              🥇 Top candidats
            </div>
            <div className="flex flex-col gap-2">
              {b.top3?.map((c: any, i: number) => {
                const percent = b.expressed > 0
                  ? ((c[1] / b.expressed) * 100).toFixed(1)
                  : "0"
                const barW     = b.expressed > 0 ? (c[1] / b.expressed) * 100 : 0
                const barColor = i === 0 ? "#2563eb" : i === 1 ? "#94a3b8" : "#d1d5db"
                return (
                  <div key={`${b.bureau_id}-${c[0]}`}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">{i + 1}. {c[0]}</span>
                      <span className="font-semibold text-gray-900">
                        {c[1].toLocaleString("fr-FR")} — {percent} %
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${barW}%`, background: barColor }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

        </div>
      )}
    </div>
  )
}

export default function BureauCards({ bureaux, colors }: any) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {bureaux.map((b: any) => (
        <BureauCard
          key={`bureau-${b.bureau_id}-${b.round}`}
          b={b}
          colors={colors}
        />
      ))}
    </div>
  )
}
