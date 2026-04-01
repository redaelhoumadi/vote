"use client"

import { useState } from "react"
import { FileSpreadsheet, FileText, Download, Loader2 } from "lucide-react"

/* ══════════════════════════════════════
   TYPES
══════════════════════════════════════ */

interface BureauComparison {
  id: number
  name: string
  registered1: number; voters1: number; blank1: number; null1: number; expressed1: number; participation1: number
  registered2: number; voters2: number; blank2: number; null2: number; expressed2: number; participation2: number
  winner1: string; winner2: string; winnerChanged: boolean
}

interface ExportAnalyseButtonProps {
  bureaux: BureauComparison[]
}

/* ══════════════════════════════════════
   EXPORT EXCEL (.CSV)
══════════════════════════════════════ */

function exportToExcel(bureaux: BureauComparison[]) {
  const BOM = "\uFEFF"

  const headers = [
    "Bureau",
    // Tour 1
    "T1 — Inscrits", "T1 — Votants", "T1 — Exprimés", "T1 — Blancs", "T1 — Nuls", "T1 — Participation (%)",
    // Tour 2
    "T2 — Inscrits", "T2 — Votants", "T2 — Exprimés", "T2 — Blancs", "T2 — Nuls", "T2 — Participation (%)",
    // Évolutions
    "Δ Votants", "Δ Exprimés", "Δ Blancs", "Δ Nuls", "Δ Participation (pts)",
    // Gagnants
    "Gagnant T1", "Gagnant T2", "Changement de gagnant",
  ]

  const rows = bureaux.map(b => {
    const partDiff = (b.participation2 - b.participation1).toFixed(2)
    return [
      b.name,
      // Tour 1
      b.registered1, b.voters1, b.expressed1, b.blank1, b.null1, b.participation1.toFixed(2),
      // Tour 2
      b.registered2, b.voters2, b.expressed2, b.blank2, b.null2, b.participation2.toFixed(2),
      // Évolutions
      b.voters2 - b.voters1,
      b.expressed2 - b.expressed1,
      b.blank2 - b.blank1,
      b.null2 - b.null1,
      partDiff,
      // Gagnants
      b.winner1, b.winner2,
      b.winnerChanged ? "OUI" : "NON",
    ]
  })

  // Totaux
  const totals = bureaux.reduce(
    (acc, b) => ({
      registered1: acc.registered1 + b.registered1, voters1: acc.voters1 + b.voters1,
      expressed1: acc.expressed1 + b.expressed1,   blank1:  acc.blank1  + b.blank1,  null1: acc.null1 + b.null1,
      registered2: acc.registered2 + b.registered2, voters2: acc.voters2 + b.voters2,
      expressed2: acc.expressed2 + b.expressed2,   blank2:  acc.blank2  + b.blank2,  null2: acc.null2 + b.null2,
    }),
    { registered1: 0, voters1: 0, expressed1: 0, blank1: 0, null1: 0, registered2: 0, voters2: 0, expressed2: 0, blank2: 0, null2: 0 }
  )
  const totalPart1 = totals.registered1 > 0 ? ((totals.voters1 / totals.registered1) * 100).toFixed(2) : "0"
  const totalPart2 = totals.registered2 > 0 ? ((totals.voters2 / totals.registered2) * 100).toFixed(2) : "0"
  const totalPartDiff = (parseFloat(totalPart2) - parseFloat(totalPart1)).toFixed(2)
  const changedCount = bureaux.filter(b => b.winnerChanged).length

  const totalRow = [
    `TOTAL (${bureaux.length} bureaux)`,
    totals.registered1, totals.voters1, totals.expressed1, totals.blank1, totals.null1, totalPart1,
    totals.registered2, totals.voters2, totals.expressed2, totals.blank2, totals.null2, totalPart2,
    totals.voters2 - totals.voters1,
    totals.expressed2 - totals.expressed1,
    totals.blank2 - totals.blank1,
    totals.null2 - totals.null1,
    totalPartDiff,
    "", "", `${changedCount} changement(s)`,
  ]

  const escape = (v: any) => {
    const s = String(v)
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s
  }

  const csv = [
    [`Analyse comparative — Élections Évreux — 1er Tour vs 2ème Tour`],
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
  link.download = `analyse-comparative-evreux-${new Date().toISOString().split("T")[0]}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

/* ══════════════════════════════════════
   EXPORT PDF
══════════════════════════════════════ */

function exportToPDF(bureaux: BureauComparison[]) {
  const date = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })

  const totals = bureaux.reduce(
    (acc, b) => ({
      registered1: acc.registered1 + b.registered1, voters1: acc.voters1 + b.voters1,
      expressed1:  acc.expressed1  + b.expressed1,  blank1:  acc.blank1  + b.blank1,  null1: acc.null1 + b.null1,
      registered2: acc.registered2 + b.registered2, voters2: acc.voters2 + b.voters2,
      expressed2:  acc.expressed2  + b.expressed2,  blank2:  acc.blank2  + b.blank2,  null2: acc.null2 + b.null2,
    }),
    { registered1: 0, voters1: 0, expressed1: 0, blank1: 0, null1: 0, registered2: 0, voters2: 0, expressed2: 0, blank2: 0, null2: 0 }
  )

  const part1Global = totals.registered1 > 0 ? ((totals.voters1 / totals.registered1) * 100).toFixed(2) : "0"
  const part2Global = totals.registered2 > 0 ? ((totals.voters2 / totals.registered2) * 100).toFixed(2) : "0"
  const partDiffGlobal = (parseFloat(part2Global) - parseFloat(part1Global))
  const changedCount   = bureaux.filter(b => b.winnerChanged).length

  const fmt = (n: number) => n.toLocaleString("fr-FR")
  const sign = (n: number) => (n >= 0 ? `+${fmt(n)}` : fmt(n))
  const signF = (n: number) => (n >= 0 ? `+${n.toFixed(2)}` : n.toFixed(2))
  const diffCell = (n: number, goodIfUp = true) => {
    const good = goodIfUp ? n >= 0 : n <= 0
    const color = n === 0 ? "#6b7280" : good ? "#16a34a" : "#dc2626"
    return `<span style="color:${color};font-weight:700">${sign(n)}</span>`
  }
  const diffPtCell = (n: number, goodIfUp = true) => {
    const good = goodIfUp ? n >= 0 : n <= 0
    const color = n === 0 ? "#6b7280" : good ? "#16a34a" : "#dc2626"
    return `<span style="color:${color};font-weight:700">${signF(n)} pts</span>`
  }

  const rows = bureaux.map(b => {
    const partDiff = b.participation2 - b.participation1
    const changed  = b.winnerChanged
    return `
    <tr class="${changed ? "changed" : ""}">
      <td>
        ${b.name}
        ${changed ? `<span class="badge-changed">⚡ Changement</span>` : ""}
      </td>
      <td>${fmt(b.voters1)}</td>
      <td>${b.participation1.toFixed(1)}%</td>
      <td>${fmt(b.expressed1)}</td>
      <td>${fmt(b.voters2)}</td>
      <td>${b.participation2.toFixed(1)}%</td>
      <td>${fmt(b.expressed2)}</td>
      <td>${diffCell(b.voters2 - b.voters1)}</td>
      <td>${diffPtCell(partDiff)}</td>
      <td class="winner-cell">${b.winner1 || "—"}</td>
      <td class="winner-cell ${changed ? "winner-changed" : "winner-same"}">${b.winner2 || "—"}</td>
    </tr>`
  }).join("")

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8"/>
<title>Analyse comparative — Élections Évreux</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 10.5px; color: #1a1a2e; background: #fff; }

  .header { background: linear-gradient(135deg, #1d3a6e 0%, #2563eb 100%); color: white; padding: 26px 32px; }
  .header h1 { font-size: 20px; font-weight: 800; letter-spacing: -.5px; }
  .header .sub { font-size: 13px; opacity: .8; margin-top: 4px; }
  .header .meta { font-size: 10px; opacity: .6; margin-top: 8px; }
  .badge { display: inline-block; background: rgba(255,255,255,.18); border: 1px solid rgba(255,255,255,.35); border-radius: 20px; padding: 3px 14px; font-size: 11px; font-weight: 700; margin-top: 8px; }

  /* KPI GLOBAUX */
  .kpi-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; padding: 18px 32px; background: #f8faff; border-bottom: 1px solid #e2e8f0; }
  .kpi { background: white; border-radius: 10px; padding: 12px 14px; border: 1px solid #e2e8f0; }
  .kpi .lbl { font-size: 9px; text-transform: uppercase; letter-spacing: .5px; color: #64748b; font-weight: 700; }
  .kpi .t1  { font-size: 13px; font-weight: 700; color: #64748b; margin-top: 4px; }
  .kpi .t2  { font-size: 17px; font-weight: 800; color: #1d3a6e; }
  .kpi .ev  { font-size: 11px; font-weight: 700; margin-top: 3px; }

  /* SECTION */
  .section { padding: 18px 32px; }
  .section h2 { font-size: 13px; font-weight: 700; color: #1d3a6e; margin-bottom: 12px; padding-bottom: 7px; border-bottom: 2px solid #e2e8f0; }

  /* TABLE */
  table { width: 100%; border-collapse: collapse; font-size: 9.5px; }
  thead th { background: #1d3a6e; color: white; padding: 8px 8px; text-align: left; font-weight: 700; font-size: 9px; text-transform: uppercase; letter-spacing: .3px; }
  thead th.t1 { background: #475569; }
  thead th.t2 { background: #1d4ed8; }
  thead th.ev { background: #0f172a; }
  thead th.gn { background: #065f46; }
  td { padding: 7px 8px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
  tr:nth-child(even) td { background: #f8faff; }
  tr.changed td { background: #fff9eb !important; }
  tfoot td { background: #1d3a6e !important; color: white; font-weight: 700; font-size: 10px; }

  .badge-changed { display: inline-block; background: #fef3c7; color: #92400e; border-radius: 4px; padding: 1px 5px; font-size: 8px; font-weight: 700; margin-left: 4px; vertical-align: middle; }
  .winner-cell { font-weight: 600; color: #374151; }
  .winner-same { color: #16a34a; }
  .winner-changed { color: #dc2626; font-weight: 800; }

  /* LÉGENDE */
  .legend { display: flex; gap: 20px; padding: 10px 32px 0; font-size: 10px; color: #6b7280; }
  .legend span { display: flex; align-items: center; gap: 4px; }
  .dot { width: 10px; height: 10px; border-radius: 2px; display: inline-block; }

  .footer { padding: 14px 32px; background: #f8faff; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; color: #94a3b8; font-size: 9px; margin-top: 10px; }

  @media print {
    body { font-size: 9px; }
    .header, tfoot td, thead th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    tr.changed td { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    tr { page-break-inside: avoid; }
  }
</style>
</head>
<body>

<!-- EN-TÊTE -->
<div class="header">
  <h1>🗳️ Analyse comparative — Élections Évreux</h1>
  <div class="sub">Comparaison détaillée 1er Tour / 2ème Tour par bureau de vote</div>
  <div class="meta">Document généré le ${date}</div>
  <div class="badge">1er Tour → 2ème Tour • ${bureaux.length} bureaux</div>
</div>

<!-- KPI GLOBAUX -->
<div class="kpi-grid">
  <div class="kpi">
    <div class="lbl">Votants T1</div>
    <div class="t2">${fmt(totals.voters1)}</div>
  </div>
  <div class="kpi">
    <div class="lbl">Votants T2</div>
    <div class="t2">${fmt(totals.voters2)}</div>
    <div class="ev" style="color:${totals.voters2 >= totals.voters1 ? "#16a34a" : "#dc2626"}">${sign(totals.voters2 - totals.voters1)}</div>
  </div>
  <div class="kpi">
    <div class="lbl">Participation T1</div>
    <div class="t2">${part1Global}%</div>
  </div>
  <div class="kpi">
    <div class="lbl">Participation T2</div>
    <div class="t2">${part2Global}%</div>
    <div class="ev" style="color:${partDiffGlobal >= 0 ? "#16a34a" : "#dc2626"}">${signF(partDiffGlobal)} pts</div>
  </div>
  <div class="kpi">
    <div class="lbl">Exprimés T2</div>
    <div class="t2">${fmt(totals.expressed2)}</div>
    <div class="ev" style="color:${totals.expressed2 >= totals.expressed1 ? "#16a34a" : "#dc2626"}">${sign(totals.expressed2 - totals.expressed1)}</div>
  </div>
  <div class="kpi">
    <div class="lbl">Changements gagnant</div>
    <div class="t2" style="color:${changedCount > 0 ? "#d97706" : "#16a34a"}">${changedCount}</div>
    <div class="ev" style="color:#6b7280">sur ${bureaux.length} bureaux</div>
  </div>
</div>

<!-- LÉGENDE -->
<div class="legend">
  <span><span class="dot" style="background:#f8faff;border:1px solid #e2e8f0"></span>Bureau normal</span>
  <span><span class="dot" style="background:#fff9eb;border:1px solid #fde68a"></span>Changement de gagnant</span>
  <span style="color:#16a34a;font-weight:600">Vert = hausse favorable</span>
  <span style="color:#dc2626;font-weight:600">Rouge = baisse / dégradation</span>
</div>

<!-- TABLEAU COMPARATIF -->
<div class="section">
  <h2>📊 Tableau comparatif détaillé par bureau (${bureaux.length} bureaux)</h2>
  <table>
    <thead>
      <tr>
        <th rowspan="2" style="width:130px">Bureau</th>
        <th colspan="3" class="t1" style="text-align:center">1er Tour</th>
        <th colspan="3" class="t2" style="text-align:center">2ème Tour</th>
        <th colspan="2" class="ev" style="text-align:center">Évolution</th>
        <th colspan="2" class="gn" style="text-align:center">Gagnants</th>
      </tr>
      <tr>
        <th class="t1">Votants</th><th class="t1">Part.</th><th class="t1">Exprimés</th>
        <th class="t2">Votants</th><th class="t2">Part.</th><th class="t2">Exprimés</th>
        <th class="ev">Δ Votants</th><th class="ev">Δ Part.</th>
        <th class="gn">T1</th><th class="gn">T2</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
    <tfoot>
      <tr>
        <td>TOTAL — ${bureaux.length} bureaux</td>
        <td>${fmt(totals.voters1)}</td><td>${part1Global}%</td><td>${fmt(totals.expressed1)}</td>
        <td>${fmt(totals.voters2)}</td><td>${part2Global}%</td><td>${fmt(totals.expressed2)}</td>
        <td>${sign(totals.voters2 - totals.voters1)}</td>
        <td>${signF(partDiffGlobal)} pts</td>
        <td></td><td>${changedCount} changement(s)</td>
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

export default function ExportAnalyseButton({ bureaux }: ExportAnalyseButtonProps) {
  const [open,       setOpen]       = useState(false)
  const [loadingXls, setLoadingXls] = useState(false)
  const [loadingPdf, setLoadingPdf] = useState(false)

  const changedCount = bureaux.filter(b => b.winnerChanged).length

  const handleExcel = async () => {
    setLoadingXls(true)
    await new Promise(r => setTimeout(r, 300))
    exportToExcel(bureaux)
    setLoadingXls(false)
    setOpen(false)
  }

  const handlePDF = async () => {
    setLoadingPdf(true)
    await new Promise(r => setTimeout(r, 300))
    exportToPDF(bureaux)
    setLoadingPdf(false)
    setOpen(false)
  }

  return (
    <div className="relative">

      {/* ── Bouton principal ── */}
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-all duration-150 cursor-pointer border-none"
      >
        <Download size={15} />
        Exporter l'analyse
        <span className="text-blue-300 text-xs ml-0.5">▼</span>
      </button>

      {/* ── Dropdown ── */}
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />

          <div className="absolute right-0 top-full mt-2 z-20 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden min-w-[220px]">

            

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
                <div className="text-xs text-gray-600">Comparaison T1/T2 complète (.CSV)</div>
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
                <div className="text-xs text-gray-600">Rapport comparatif imprimable</div>
              </div>
            </button>

          </div>
        </>
      )}
    </div>
  )
}
