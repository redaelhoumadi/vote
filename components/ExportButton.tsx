"use client"

import { useState } from "react"
import { FileSpreadsheet, FileText, Download, Loader2 } from "lucide-react"

interface Bureau {
  bureau_id: number
  bureaux?: { name: string }
  registered: number
  voters: number
  blank: number
  null_votes: number
  expressed: number
  winner: string
  top3: [string, number][]
}

interface ExportButtonProps {
  bureaux: Bureau[]
  round: number
}

/* ══════════════════════════════════════
   EXPORT EXCEL (CSV encodé UTF-8 BOM)
══════════════════════════════════════ */
function exportToExcel(bureaux: Bureau[], round: number) {
  const BOM = "\uFEFF"

  // ── En-têtes ──
  const headers = [
    "Bureau",
    "Inscrits",
    "Votants",
    "Blancs",
    "Nuls",
    "Exprimés",
    "Taux participation (%)",
    "Taux exprimés (%)",
    "1er candidat",
    "Voix 1er",
    "% 1er",
    "2ème candidat",
    "Voix 2ème",
    "% 2ème",
    "3ème candidat",
    "Voix 3ème",
    "% 3ème",
    "Gagnant",
  ]

  // ── Lignes ──
  const rows = bureaux.map(b => {
    const participation = b.registered > 0
      ? ((b.voters / b.registered) * 100).toFixed(2)
      : "0"
    const tauxExpr = b.voters > 0
      ? ((b.expressed / b.voters) * 100).toFixed(2)
      : "0"

    const getCand = (i: number) => b.top3?.[i]
    const pct = (votes: number) =>
      b.expressed > 0 ? ((votes / b.expressed) * 100).toFixed(1) : "0"

    return [
      b.bureaux?.name ?? `Bureau ${b.bureau_id}`,
      b.registered,
      b.voters,
      b.blank,
      b.null_votes,
      b.expressed,
      participation,
      tauxExpr,
      getCand(0)?.[0] ?? "",
      getCand(0)?.[1] ?? "",
      getCand(0) ? pct(getCand(0)![1]) : "",
      getCand(1)?.[0] ?? "",
      getCand(1)?.[1] ?? "",
      getCand(1) ? pct(getCand(1)![1]) : "",
      getCand(2)?.[0] ?? "",
      getCand(2)?.[1] ?? "",
      getCand(2) ? pct(getCand(2)![1]) : "",
      b.winner,
    ]
  })

  // ── Ligne totaux ──
  const totals = bureaux.reduce(
    (acc, b) => ({
      registered: acc.registered + b.registered,
      voters:     acc.voters + b.voters,
      blank:      acc.blank + b.blank,
      null_votes: acc.null_votes + b.null_votes,
      expressed:  acc.expressed + b.expressed,
    }),
    { registered: 0, voters: 0, blank: 0, null_votes: 0, expressed: 0 }
  )
  const totalParticipation = totals.registered > 0
    ? ((totals.voters / totals.registered) * 100).toFixed(2)
    : "0"
  const totalExpr = totals.voters > 0
    ? ((totals.expressed / totals.voters) * 100).toFixed(2)
    : "0"

  const totalRow = [
    "TOTAL",
    totals.registered,
    totals.voters,
    totals.blank,
    totals.null_votes,
    totals.expressed,
    totalParticipation,
    totalExpr,
    "", "", "", "", "", "", "", "", "", "",
  ]

  // ── Assemblage CSV ──
  const escape = (v: any) => {
    const s = String(v)
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s
  }

  const csv = [
    [`Résultats élections Évreux — ${round === 1 ? "1er" : "2ème"} tour`],
    [`Exporté le ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR")}`],
    [],
    headers,
    ...rows,
    [],
    totalRow,
  ]
    .map(row => row.map(escape).join(","))
    .join("\n")

  const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" })
  const url  = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href     = url
  link.download = `elections-evreux-tour${round}-${new Date().toISOString().split("T")[0]}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

/* ══════════════════════════════════════
   EXPORT PDF (HTML → window.print)
══════════════════════════════════════ */
function exportToPDF(bureaux: Bureau[], round: number) {
  const date = new Date().toLocaleDateString("fr-FR", {
    day: "2-digit", month: "long", year: "numeric",
  })

  const totals = bureaux.reduce(
    (acc, b) => ({
      registered: acc.registered + b.registered,
      voters:     acc.voters + b.voters,
      blank:      acc.blank + b.blank,
      null_votes: acc.null_votes + b.null_votes,
      expressed:  acc.expressed + b.expressed,
    }),
    { registered: 0, voters: 0, blank: 0, null_votes: 0, expressed: 0 }
  )

  const globalParticipation = totals.registered > 0
    ? ((totals.voters / totals.registered) * 100).toFixed(2)
    : "0"
  const globalExpr = totals.voters > 0
    ? ((totals.expressed / totals.voters) * 100).toFixed(2)
    : "0"

  // Agrégation des votes par candidat (tous bureaux confondus)
  const candidateMap: Record<string, number> = {}
  bureaux.forEach(b => {
    b.top3?.forEach(([name, votes]) => {
      candidateMap[name] = (candidateMap[name] ?? 0) + votes
    })
  })
  const sortedCandidates = Object.entries(candidateMap)
    .sort((a, b) => b[1] - a[1])

  const rows = bureaux.map(b => {
    const participation = b.registered > 0
      ? ((b.voters / b.registered) * 100).toFixed(1)
      : "0"
    const top = b.top3?.map(([name, votes]) => {
      const pct = b.expressed > 0
        ? ((votes / b.expressed) * 100).toFixed(1)
        : "0"
      return `${name} : ${votes} (${pct}%)`
    }).join("<br/>") ?? "—"

    return `
      <tr>
        <td>${b.bureaux?.name ?? `Bureau ${b.bureau_id}`}</td>
        <td>${b.registered}</td>
        <td>${b.voters}</td>
        <td>${b.expressed}</td>
        <td>${participation}%</td>
        <td class="candidates">${top}</td>
        <td class="winner">${b.winner}</td>
      </tr>`
  }).join("")

  const globalRows = sortedCandidates.map(([name, votes]) => {
    const pct = totals.expressed > 0
      ? ((votes / totals.expressed) * 100).toFixed(2)
      : "0"
    return `
      <tr>
        <td>${name}</td>
        <td>${votes}</td>
        <td>${pct}%</td>
      </tr>`
  }).join("")

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8"/>
<title>Résultats — ${round === 1 ? "1er" : "2ème"} tour</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #1a1a2e; background: #fff; }
  
  .header { background: linear-gradient(135deg, #1d3a6e 0%, #2563eb 100%); color: white; padding: 28px 32px; }
  .header h1 { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
  .header .subtitle { font-size: 13px; opacity: 0.85; margin-top: 4px; }
  .header .meta { font-size: 11px; opacity: 0.65; margin-top: 8px; }
  .badge { display: inline-block; background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.4); border-radius: 20px; padding: 4px 14px; font-size: 12px; font-weight: 700; margin-top: 10px; }

  .stats-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; padding: 20px 32px; background: #f8faff; border-bottom: 1px solid #e2e8f0; }
  .stat-box { background: white; border-radius: 10px; padding: 14px 16px; border: 1px solid #e2e8f0; }
  .stat-box .label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; font-weight: 600; }
  .stat-box .value { font-size: 22px; font-weight: 800; color: #1d3a6e; margin-top: 4px; }
  .stat-box .sub { font-size: 10px; color: #94a3b8; margin-top: 2px; }

  .section { padding: 20px 32px; }
  .section h2 { font-size: 14px; font-weight: 700; color: #1d3a6e; margin-bottom: 14px; padding-bottom: 8px; border-bottom: 2px solid #e2e8f0; }

  table { width: 100%; border-collapse: collapse; font-size: 10.5px; }
  th { background: #1d3a6e; color: white; padding: 9px 10px; text-align: left; font-weight: 600; font-size: 10px; text-transform: uppercase; letter-spacing: 0.3px; }
  td { padding: 8px 10px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
  tr:nth-child(even) td { background: #f8faff; }
  tr:hover td { background: #eff6ff; }
  .candidates { color: #374151; line-height: 1.6; }
  .winner { font-weight: 700; color: #1d4ed8; }
  tfoot td { background: #1d3a6e !important; color: white; font-weight: 700; }

  .global-table { max-width: 480px; }
  .global-table th:last-child,
  .global-table td:last-child { text-align: right; }
  
  .footer { padding: 16px 32px; background: #f8faff; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; color: #94a3b8; font-size: 9px; margin-top: 8px; }

  @media print {
    body { font-size: 10px; }
    .header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .stat-box, th, tfoot td { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    table { page-break-inside: auto; }
    tr { page-break-inside: avoid; }
  }
</style>
</head>
<body>

<!-- EN-TÊTE -->
<div class="header">
  <h1>🗳️ Élections municipales — Évreux</h1>
  <div class="subtitle">Résultats officiels par bureau de vote</div>
  <div class="meta">Document généré le ${date}</div>
  <div class="badge">${round === 1 ? "1er Tour" : "2ème Tour"}</div>
</div>

<!-- STATS GLOBALES -->
<div class="stats-grid">
  <div class="stat-box">
    <div class="label">Inscrits</div>
    <div class="value">${totals.registered.toLocaleString("fr-FR")}</div>
    <div class="sub">électeurs au total</div>
  </div>
  <div class="stat-box">
    <div class="label">Votants</div>
    <div class="value">${totals.voters.toLocaleString("fr-FR")}</div>
    <div class="sub">se sont déplacés</div>
  </div>
  <div class="stat-box">
    <div class="label">Participation</div>
    <div class="value">${globalParticipation}%</div>
    <div class="sub">taux de vote</div>
  </div>
  <div class="stat-box">
    <div class="label">Exprimés</div>
    <div class="value">${totals.expressed.toLocaleString("fr-FR")}</div>
    <div class="sub">votes valides</div>
  </div>
  <div class="stat-box">
    <div class="label">Taux exprimés</div>
    <div class="value">${globalExpr}%</div>
    <div class="sub">des votants</div>
  </div>
</div>

<!-- RÉSULTATS GLOBAUX PAR CANDIDAT -->
<div class="section">
  <h2>📊 Résultats globaux par candidat</h2>
  <table class="global-table">
    <thead>
      <tr>
        <th>Candidat</th>
        <th>Voix</th>
        <th style="text-align:right">% exprimés</th>
      </tr>
    </thead>
    <tbody>${globalRows}</tbody>
  </table>
</div>

<!-- RÉSULTATS PAR BUREAU -->
<div class="section">
  <h2>🏫 Détail par bureau de vote (${bureaux.length} bureaux)</h2>
  <table>
    <thead>
      <tr>
        <th>Bureau</th>
        <th>Inscrits</th>
        <th>Votants</th>
        <th>Exprimés</th>
        <th>Participation</th>
        <th>Candidats (top 3)</th>
        <th>Gagnant</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
    <tfoot>
      <tr>
        <td>TOTAL — ${bureaux.length} bureaux</td>
        <td>${totals.registered}</td>
        <td>${totals.voters}</td>
        <td>${totals.expressed}</td>
        <td>${globalParticipation}%</td>
        <td></td>
        <td></td>
      </tr>
    </tfoot>
  </table>
</div>

<div class="footer">
  <span>Généré automatiquement • ${new Date().toLocaleString("fr-FR")}</span>
</div>

<script>window.onload = () => window.print()</script>
</body>
</html>`

  const win = window.open("", "_blank")
  if (win) {
    win.document.write(html)
    win.document.close()
  }
}

/* ══════════════════════════════════════
   COMPOSANT
══════════════════════════════════════ */
export default function ExportButton({ bureaux, round }: ExportButtonProps) {
  const [open,       setOpen]       = useState(false)
  const [loadingXls, setLoadingXls] = useState(false)
  const [loadingPdf, setLoadingPdf] = useState(false)

  const handleExcel = async () => {
    setLoadingXls(true)
    await new Promise(r => setTimeout(r, 300))
    exportToExcel(bureaux, round)
    setLoadingXls(false)
    setOpen(false)
  }

  const handlePDF = async () => {
    setLoadingPdf(true)
    await new Promise(r => setTimeout(r, 300))
    exportToPDF(bureaux, round)
    setLoadingPdf(false)
    setOpen(false)
  }

  return (
    <div className="relative">

      {/* ── Bouton principal ── */}
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-4 py-2.5 rounded-lg text-sm font-semibold shadow-sm transition-all duration-150 cursor-pointer border-none"
      >
        <Download size={16} />
        Exporter
        <span className="text-blue-300 text-xs ml-0.5">▼</span>
      </button>

      {/* ── Dropdown ── */}
      {open && (
        <>
          {/* Overlay pour fermer */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />

          <div className="absolute right-0 top-full mt-2 z-20 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden min-w-[200px]">

            <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {round === 1 ? "1er tour" : "2ème tour"}
              </p>
            </div>

            {/* Excel */}
            <button
              onClick={handleExcel}
              disabled={loadingXls}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors duration-100 cursor-pointer border-none bg-transparent text-left"
            >
              {loadingXls
                ? <Loader2 size={16} className="animate-spin text-green-600" />
                : <FileSpreadsheet size={16} className="text-green-600" />
              }
              <div>
                <div className="font-semibold">Exporter en Excel</div>
                <div className="text-xs text-gray-600">Format .CSV (compatible Excel)</div>
              </div>
            </button>

            {/* PDF */}
            <button
              onClick={handlePDF}
              disabled={loadingPdf}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors duration-100 cursor-pointer border-none bg-transparent text-left"
            >
              {loadingPdf
                ? <Loader2 size={16} className="animate-spin text-red-600" />
                : <FileText size={16} className="text-red-600" />
              }
              <div>
                <div className="font-semibold">Exporter en PDF</div>
                <div className="text-xs text-gray-600">Rapport officiel imprimable</div>
              </div>
            </button>

          </div>
        </>
      )}
    </div>
  )
}
