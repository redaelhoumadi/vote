"use client"

import { useEffect, useState } from "react"
import Sidebar from "@/components/Sidebar"
import { supabase } from "@/lib/supabase"

/* ═══════════════════════════════════════════
   TYPES
═══════════════════════════════════════════ */

interface KpiCard {
  label: string
  value1: number
  value2: number
  diff: number
  rate: number
  unit?: string
  icon: string
  colorUp: "green" | "red"
}

interface TopBureau {
  name: string
  participation: number
}

interface CandidateRank {
  name: string
  party?: string
  photo?: string
  rank1: number
  rank2: number
  votes1: number
  votes2: number
  pct1: number
  pct2: number
  rankMove: number
  voteDiff: number
  pctDiff: number
}

interface BureauComparison {
  id: number
  name: string
  registered1: number; voters1: number; blank1: number; null1: number; expressed1: number; participation1: number
  registered2: number; voters2: number; blank2: number; null2: number; expressed2: number; participation2: number
  winner1: string; winner2: string; winnerChanged: boolean
}

/* ═══════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════ */

function pctEvol(a: number, b: number) {
  if (b === 0) return 0
  return ((a - b) / b) * 100
}

function fmt(n: number) {
  return n.toLocaleString("fr-FR")
}

function diffColor(diff: number, goodIfUp = true) {
  if (diff === 0) return "#6b7280"
  if (goodIfUp) return diff > 0 ? "#16a34a" : "#dc2626"
  return diff > 0 ? "#dc2626" : "#16a34a"
}

/* ═══════════════════════════════════════════
   COMPOSANTS KPI
═══════════════════════════════════════════ */

function KpiBlock({ card }: { card: KpiCard }) {
  const isUp = card.diff >= 0
  const isGood = isUp ? card.colorUp === "green" : card.colorUp === "red"
  const color = isGood ? "#22c55e" : "#ef4444"
  const arrow = isUp ? "▲" : "▼"
  return (
    <div style={{ background: "white", borderRadius: 16, padding: "24px 28px", boxShadow: "0 1px 3px rgba(0,0,0,.08), 0 4px 16px rgba(0,0,0,.04)", display: "flex", flexDirection: "column", gap: 12, borderTop: `4px solid ${color}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: ".06em" }}>{card.label}</span>
        <span style={{ fontSize: 22 }}>{card.icon}</span>
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
        <div><div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 2 }}>Tour 1</div><div style={{ fontSize: 26, fontWeight: 800, color: "#111827", lineHeight: 1 }}>{fmt(card.value1)}{card.unit}</div></div>
        <div style={{ fontSize: 20, color: "#d1d5db", marginBottom: 4 }}>→</div>
        <div><div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 2 }}>Tour 2</div><div style={{ fontSize: 26, fontWeight: 800, color: "#111827", lineHeight: 1 }}>{fmt(card.value2)}{card.unit}</div></div>
      </div>
      <div style={{ display: "flex", gap: 10, alignItems: "center", padding: "8px 12px", borderRadius: 8, background: isGood ? "#f0fdf4" : "#fef2f2" }}>
        <span style={{ fontSize: 13, fontWeight: 700, color }}>{arrow} {isUp ? "+" : ""}{fmt(card.diff)}{card.unit}</span>
        <span style={{ fontSize: 12, color: "#6b7280" }}>|</span>
        <span style={{ fontSize: 13, fontWeight: 600, color }}>{isUp ? "+" : ""}{card.rate.toFixed(2)} %</span>
      </div>
    </div>
  )
}

function ProgressBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const p = max > 0 ? (value / max) * 100 : 0
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 13, color: "#374151" }}>
        <span>{label}</span><span style={{ fontWeight: 600 }}>{p.toFixed(1)} %</span>
      </div>
      <div style={{ height: 8, background: "#f3f4f6", borderRadius: 99 }}>
        <div style={{ height: 8, borderRadius: 99, background: color, width: `${Math.min(p, 100)}%`, transition: "width .6s ease" }} />
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════
   COMPOSANTS CLASSEMENT
═══════════════════════════════════════════ */

function RankBadge({ rank }: { rank: number }) {
  const colors: any = {
    1: { bg: "#fef9c3", color: "#854d0e", border: "#fde047" },
    2: { bg: "#f1f5f9", color: "#475569", border: "#cbd5e1" },
    3: { bg: "#fff7ed", color: "#9a3412", border: "#fdba74" },
  }
  const s = colors[rank] ?? { bg: "#f3f4f6", color: "#6b7280", border: "#e5e7eb" }
  return (
    <div style={{ width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, background: s.bg, color: s.color, border: `2px solid ${s.border}`, flexShrink: 0 }}>
      {rank}
    </div>
  )
}

function MoveArrow({ move }: { move: number }) {
  if (move === 0) return <span style={{ fontSize: 12, color: "#9ca3af", fontWeight: 600 }}>—</span>
  const up = move > 0
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 3, color: up ? "#16a34a" : "#dc2626", fontWeight: 700, fontSize: 13 }}>
      <span>{up ? "▲" : "▼"}</span><span>{Math.abs(move)}</span>
    </div>
  )
}

function VoteBar({ pct: p, color, label }: { pct: number; color: string; label: string }) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 3 }}>{label}</div>
      <div style={{ height: 6, background: "#f3f4f6", borderRadius: 99, overflow: "hidden" }}>
        <div style={{ height: "100%", borderRadius: 99, background: color, width: `${Math.min(p, 100)}%`, transition: "width .7s cubic-bezier(.4,0,.2,1)" }} />
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginTop: 3 }}>{p.toFixed(2)} %</div>
    </div>
  )
}

function CandidateRow({ c, index }: { c: CandidateRank; index: number }) {
  const [open, setOpen] = useState(false)
  const pctDiffColor = c.pctDiff > 0 ? "#16a34a" : c.pctDiff < 0 ? "#dc2626" : "#6b7280"
  return (
    <div style={{ background: "white", borderRadius: 14, marginBottom: 12, boxShadow: open ? "0 4px 24px rgba(37,99,235,.10)" : "0 1px 3px rgba(0,0,0,.06)", border: open ? "1.5px solid #2563eb" : "1.5px solid transparent", transition: "box-shadow .2s, border-color .2s", overflow: "hidden", animationName: "fadeUp", animationDuration: ".4s", animationFillMode: "both", animationDelay: `${index * 60}ms` }}>
      <div onClick={() => setOpen(o => !o)} style={{ display: "grid", gridTemplateColumns: "44px 1fr 80px 80px 80px 40px", alignItems: "center", gap: 16, padding: "16px 20px", cursor: "pointer" }}>
        <RankBadge rank={c.rank2} />
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {c.photo ? (
            <img src={c.photo} alt={c.name} style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", border: "2px solid #e5e7eb" }} />
          ) : (
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: `hsl(${(c.name.charCodeAt(0) * 37) % 360}, 60%, 70%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "white", flexShrink: 0 }}>{c.name[0]}</div>
          )}
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#111827" }}>{c.name}</div>
            {c.party && <div style={{ fontSize: 12, color: "#6b7280" }}>{c.party}</div>}
          </div>
        </div>
        <div style={{ textAlign: "right" }}><div style={{ fontSize: 11, color: "#9ca3af" }}>Votes T2</div><div style={{ fontWeight: 700, fontSize: 15, color: "#111827" }}>{fmt(c.votes2)}</div></div>
        <div style={{ textAlign: "right" }}><div style={{ fontSize: 11, color: "#9ca3af" }}>Évol. %</div><div style={{ fontWeight: 700, fontSize: 14, color: pctDiffColor }}>{c.pctDiff > 0 ? "+" : ""}{c.pctDiff.toFixed(2)} pts</div></div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}><div style={{ fontSize: 11, color: "#9ca3af" }}>Rang</div><MoveArrow move={c.rankMove} /></div>
        <div style={{ fontSize: 18, color: "#d1d5db", transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform .2s" }}>⌄</div>
      </div>
      {open && (
        <div style={{ padding: "16px 20px 20px", borderTop: "1px solid #f3f4f6" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>
            <div style={{ background: "#f8fafc", borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", marginBottom: 12, textTransform: "uppercase", letterSpacing: ".05em" }}>Classements</div>
              <div style={{ display: "flex", justifyContent: "space-around" }}>
                <div style={{ textAlign: "center" }}><div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 6 }}>Tour 1</div><RankBadge rank={c.rank1} /></div>
                <div style={{ fontSize: 24, color: "#d1d5db", alignSelf: "center" }}>→</div>
                <div style={{ textAlign: "center" }}><div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 6 }}>Tour 2</div><RankBadge rank={c.rank2} /></div>
              </div>
            </div>
            <div style={{ background: "#f8fafc", borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", marginBottom: 12, textTransform: "uppercase", letterSpacing: ".05em" }}>Votes</div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><span style={{ fontSize: 13, color: "#6b7280" }}>Tour 1</span><span style={{ fontWeight: 700, color: "#374151" }}>{fmt(c.votes1)}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><span style={{ fontSize: 13, color: "#6b7280" }}>Tour 2</span><span style={{ fontWeight: 700, color: "#374151" }}>{fmt(c.votes2)}</span></div>
              <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: 8, display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, color: "#6b7280" }}>Différence</span>
                <span style={{ fontWeight: 800, fontSize: 14, color: c.voteDiff >= 0 ? "#16a34a" : "#dc2626" }}>{c.voteDiff >= 0 ? "+" : ""}{fmt(c.voteDiff)}</span>
              </div>
            </div>
            <div style={{ background: "#f8fafc", borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", marginBottom: 12, textTransform: "uppercase", letterSpacing: ".05em" }}>Part des votes</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <VoteBar pct={c.pct1} color="#94a3b8" label="Tour 1" />
                <VoteBar pct={c.pct2} color="#2563eb" label="Tour 2" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════
   COMPOSANT BUREAU CARD
═══════════════════════════════════════════ */

function BureauCard({ b }: { b: BureauComparison }) {
  const [open, setOpen] = useState(false)
  const partDiff = b.participation2 - b.participation1
  const partColor = partDiff >= 0 ? "#16a34a" : "#dc2626"

  function StatRow({ label, v1, v2, goodIfUp = true }: { label: string; v1: number; v2: number; goodIfUp?: boolean }) {
    const d = v2 - v1
    const c = diffColor(d, goodIfUp)
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 80px 80px", gap: 8, alignItems: "center", padding: "7px 0", borderBottom: "1px solid #f3f4f6" }}>
        <span style={{ fontSize: 13, color: "#6b7280" }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#374151", textAlign: "right" }}>{fmt(v1)}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#1d4ed8", textAlign: "right" }}>{fmt(v2)}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: c, textAlign: "right" }}>{d > 0 ? "+" : ""}{fmt(d)}</span>
      </div>
    )
  }

  return (
    <div style={{ background: "white", borderRadius: 16, overflow: "hidden", boxShadow: open ? "0 4px 24px rgba(37,99,235,.10)" : "0 1px 4px rgba(0,0,0,.07)", border: open ? "1.5px solid #2563eb" : "1.5px solid transparent", transition: "box-shadow .2s, border-color .2s" }}>

      {/* HEADER */}
      <div onClick={() => setOpen(o => !o)} style={{ padding: "18px 20px", cursor: "pointer" }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: "#111827" }}>🏫 {b.name}</div>
            {b.winnerChanged && (
              <div style={{ marginTop: 5, display: "inline-flex", alignItems: "center", gap: 5, background: "#fef3c7", borderRadius: 6, padding: "2px 8px" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#92400e" }}>⚡ Changement de gagnant</span>
              </div>
            )}
          </div>
          <div style={{ fontSize: 16, color: "#d1d5db", transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform .2s" }}>⌄</div>
        </div>

        {/* Stats en 3 blocs */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>

          <div style={{ background: "#f8fafc", borderRadius: 10, padding: "10px 14px" }}>
            <div style={{ fontSize: 10, color: "#9ca3af", marginBottom: 4, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em" }}>Tour 1</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#374151" }}>{b.participation1.toFixed(1)} %</div>
            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{fmt(b.voters1)} / {fmt(b.registered1)}</div>
          </div>

          <div style={{ background: "#eff6ff", borderRadius: 10, padding: "10px 14px" }}>
            <div style={{ fontSize: 10, color: "#3b82f6", marginBottom: 4, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em" }}>Tour 2</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#1d4ed8" }}>{b.participation2.toFixed(1)} %</div>
            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{fmt(b.voters2)} / {fmt(b.registered2)}</div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ background: partDiff >= 0 ? "#f0fdf4" : "#fef2f2", borderRadius: 10, padding: "8px 12px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <div style={{ fontSize: 10, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 2 }}>Participation</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: partColor }}>{partDiff >= 0 ? "+" : ""}{partDiff.toFixed(1)} pts</div>
            </div>
            <div style={{ background: b.winnerChanged ? "#fef9c3" : "#f0fdf4", borderRadius: 10, padding: "8px 12px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <div style={{ fontSize: 10, color: "#9ca3af", fontWeight: 700, letterSpacing: ".05em", marginBottom: 2 }}>GAGNANTS</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#374151", lineHeight: 1.4 }}>
                {b.winner1 || "—"}
                {b.winnerChanged
                  ? <><br /><span style={{ color: "#dc2626" }}>→ {b.winner2 || "—"}</span></>
                  : <span style={{ color: "#16a34a" }}> ✓</span>
                }
              </div>
            </div>
          </div>
        </div>

        {/* Barres participation */}
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 3 }}>
          <div style={{ height: 4, background: "#f3f4f6", borderRadius: 99 }}>
            <div style={{ height: 4, borderRadius: 99, background: "#94a3b8", width: `${Math.min(b.participation1, 100)}%`, transition: "width .6s ease" }} />
          </div>
          <div style={{ height: 4, background: "#f3f4f6", borderRadius: 99 }}>
            <div style={{ height: 4, borderRadius: 99, background: "#2563eb", width: `${Math.min(b.participation2, 100)}%`, transition: "width .6s ease" }} />
          </div>
        </div>
      </div>

      {/* DETAIL */}
      {open && (
        <div style={{ padding: "0 20px 20px", borderTop: "1px solid #f3f4f6", paddingTop: 16 }}>
          {/* En-tête tableau */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 80px 80px", gap: 8, padding: "0 0 8px", borderBottom: "2px solid #f3f4f6", marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".05em" }}>Indicateur</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textAlign: "right", textTransform: "uppercase", letterSpacing: ".05em" }}>T1</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#2563eb", textAlign: "right", textTransform: "uppercase", letterSpacing: ".05em" }}>T2</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textAlign: "right", textTransform: "uppercase", letterSpacing: ".05em" }}>Diff.</span>
          </div>
          <StatRow label="Inscrits"     v1={b.registered1} v2={b.registered2} goodIfUp={true}  />
          <StatRow label="Votants"      v1={b.voters1}     v2={b.voters2}     goodIfUp={true}  />
          <StatRow label="Exprimés"     v1={b.expressed1}  v2={b.expressed2}  goodIfUp={true}  />
          <StatRow label="Votes blancs" v1={b.blank1}      v2={b.blank2}      goodIfUp={false} />
          <StatRow label="Votes nuls"   v1={b.null1}       v2={b.null2}       goodIfUp={false} />
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════
   PAGE PRINCIPALE
═══════════════════════════════════════════ */

type Tab = "kpi" | "classement" | "bureaux"

export default function DashboardPage() {

  const [tab, setTab] = useState<Tab>("kpi")

  const [kpis, setKpis] = useState<KpiCard[]>([])
  const [participation, setParticipation] = useState<{ r1: number; r2: number } | null>(null)
  const [topBureaux, setTopBureaux] = useState<TopBureau[]>([])

  const [candidates, setCandidates] = useState<CandidateRank[]>([])
  const [sortBy, setSortBy] = useState<"rank2" | "rankMove" | "votes2" | "pctDiff">("rank2")

  const [bureauComparisons, setBureauComparisons] = useState<BureauComparison[]>([])
  const [bureauFilter, setBureauFilter] = useState<"all" | "changed">("all")

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = "/login"; return }

      const [
        { data: votes },
        { data: bureauResults },
        { data: bureaux }
      ] = await Promise.all([
        supabase.from("votes").select("votes, round, bureau_id, candidate_id, candidates(name, party, photo)"),
        supabase.from("bureau_results").select("registered, voters, blank, null_votes, expressed, round, bureau_id"),
        supabase.from("bureaux").select("id, name"),
      ])

      /* ── KPI ── */
      let totalVotes1 = 0, totalVotes2 = 0
      let inscrits1 = 0, inscrits2 = 0, votants1 = 0, votants2 = 0
      let blancs1 = 0, blancs2 = 0, nuls1 = 0, nuls2 = 0

      votes?.forEach((v: any) => {
        if (v.round === 1) totalVotes1 += v.votes
        if (v.round === 2) totalVotes2 += v.votes
      })
      bureauResults?.forEach((b: any) => {
        if (b.round === 1) { inscrits1 += b.registered ?? 0; votants1 += b.voters ?? 0; blancs1 += b.blank ?? 0; nuls1 += b.null_votes ?? 0 }
        if (b.round === 2) { inscrits2 += b.registered ?? 0; votants2 += b.voters ?? 0; blancs2 += b.blank ?? 0; nuls2 += b.null_votes ?? 0 }
      })

      setKpis([
        { label: "Votes exprimés", icon: "🗳️", value1: totalVotes1, value2: totalVotes2, diff: totalVotes2 - totalVotes1, rate: pctEvol(totalVotes2, totalVotes1), colorUp: "green" },
        { label: "Votants",        icon: "👥", value1: votants1,    value2: votants2,    diff: votants2 - votants1,       rate: pctEvol(votants2, votants1),       colorUp: "green" },
        { label: "Votes blancs",   icon: "⬜", value1: blancs1,     value2: blancs2,     diff: blancs2 - blancs1,         rate: pctEvol(blancs2, blancs1),         colorUp: "red"   },
        { label: "Votes nuls",     icon: "❌", value1: nuls1,       value2: nuls2,       diff: nuls2 - nuls1,             rate: pctEvol(nuls2, nuls1),             colorUp: "red"   },
      ])
      setParticipation({
        r1: inscrits1 > 0 ? (votants1 / inscrits1) * 100 : 0,
        r2: inscrits2 > 0 ? (votants2 / inscrits2) * 100 : 0,
      })
      const bureauMap: any = {}
      bureaux?.forEach((b: any) => { bureauMap[b.id] = b.name })
      const bureauPart: any = {}
      bureauResults?.forEach((b: any) => {
        if (b.round === 2 && b.registered > 0) bureauPart[b.bureau_id] = (b.voters / b.registered) * 100
      })
      setTopBureaux(
        Object.entries(bureauPart)
          .map(([id, p]: any) => ({ name: bureauMap[id] ?? `Bureau ${id}`, participation: p }))
          .sort((a: any, b: any) => b.participation - a.participation)
          .slice(0, 3)
      )

      /* ── CLASSEMENT ── */
      const agg: any = {}
      votes?.forEach((v: any) => {
        const name = v.candidates.name
        if (!agg[name]) agg[name] = { name, party: v.candidates.party, photo: v.candidates.photo, votes1: 0, votes2: 0 }
        if (v.round === 1) agg[name].votes1 += v.votes
        if (v.round === 2) agg[name].votes2 += v.votes
      })
      const all = Object.values(agg) as any[]
      const total1 = all.reduce((s, c) => s + c.votes1, 0)
      const total2 = all.reduce((s, c) => s + c.votes2, 0)
      const finalists = all.filter(c => c.votes2 > 0)
      const finalistNames = new Set(finalists.map((c: any) => c.name))
      const sorted1 = [...all].sort((a, b) => b.votes1 - a.votes1)
      const sorted2 = [...finalists].sort((a, b) => b.votes2 - a.votes2)
      const rank1Map: any = {}
      sorted1.forEach((c, i) => { rank1Map[c.name] = i + 1 })
      setCandidates(sorted2.map((c, i) => {
        const rank2 = i + 1; const rank1 = rank1Map[c.name] ?? sorted1.length
        const p1 = total1 > 0 ? (c.votes1 / total1) * 100 : 0
        const p2 = total2 > 0 ? (c.votes2 / total2) * 100 : 0
        return { name: c.name, party: c.party, photo: c.photo, rank1, rank2, votes1: c.votes1, votes2: c.votes2, pct1: p1, pct2: p2, rankMove: rank1 - rank2, voteDiff: c.votes2 - c.votes1, pctDiff: p2 - p1 }
      }))

      /* ── BUREAUX ── */
      const brMap: any = {}
      bureauResults?.forEach((b: any) => {
        if (!brMap[b.bureau_id]) brMap[b.bureau_id] = {}
        brMap[b.bureau_id][b.round] = b
      })
      const bvMap: any = {}
      votes?.forEach((v: any) => {
        if (!bvMap[v.bureau_id]) bvMap[v.bureau_id] = { 1: {}, 2: {} }
        const name = v.candidates.name
        if (!bvMap[v.bureau_id][v.round][name]) bvMap[v.bureau_id][v.round][name] = 0
        bvMap[v.bureau_id][v.round][name] += v.votes
      })

      function getWinner(obj: any) {
        const entries = Object.entries(obj || {})
        if (entries.length === 0) return "—"
        return entries.sort((a: any, b: any) => b[1] - a[1])[0][0]
      }
      function filterFinalists(obj: any) {
        return Object.fromEntries(Object.entries(obj || {}).filter(([name]) => finalistNames.has(name)))
      }

      const comparisons: BureauComparison[] = (bureaux ?? []).map((bureau: any) => {
        const r1 = brMap[bureau.id]?.[1] ?? {}
        const r2 = brMap[bureau.id]?.[2] ?? {}
        const p1 = r1.registered > 0 ? (r1.voters / r1.registered) * 100 : 0
        const p2 = r2.registered > 0 ? (r2.voters / r2.registered) * 100 : 0
        const w1 = getWinner(filterFinalists(bvMap[bureau.id]?.[1] ?? {}))
        const w2 = getWinner(filterFinalists(bvMap[bureau.id]?.[2] ?? {}))
        return {
          id: bureau.id, name: bureau.name,
          registered1: r1.registered ?? 0, voters1: r1.voters ?? 0, blank1: r1.blank ?? 0, null1: r1.null_votes ?? 0, expressed1: r1.expressed ?? 0, participation1: p1,
          registered2: r2.registered ?? 0, voters2: r2.voters ?? 0, blank2: r2.blank ?? 0, null2: r2.null_votes ?? 0, expressed2: r2.expressed ?? 0, participation2: p2,
          winner1: w1, winner2: w2, winnerChanged: w1 !== w2 && w1 !== "—" && w2 !== "—",
        }
      })
      setBureauComparisons(comparisons.sort((a, b) => a.name.localeCompare(b.name)))
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const sortedCandidates = [...candidates].sort((a, b) => {
    if (sortBy === "rank2")    return a.rank2 - b.rank2
    if (sortBy === "rankMove") return b.rankMove - a.rankMove
    if (sortBy === "votes2")   return b.votes2 - a.votes2
    if (sortBy === "pctDiff")  return b.pctDiff - a.pctDiff
    return 0
  })

  const filteredBureaux = bureauFilter === "changed"
    ? bureauComparisons.filter(b => b.winnerChanged)
    : bureauComparisons

  const changedCount = bureauComparisons.filter(b => b.winnerChanged).length

  return (
    <div style={{ display: "flex", background: "#f9fafb", minHeight: "100vh" }}>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <Sidebar />

      <div style={{ flex: 1, padding: "32px 16px" }}>

        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#111827", margin: 0 }}>📈 Tableau de bord électoral</h1>
          <p style={{ fontSize: 14, color: "#6b7280", marginTop: 6 }}>Comparaison Tour 1 vs Tour 2 — indicateurs clés, classement & résultats par bureau</p>
        </div>

        {/* ONGLETS */}
        <div style={{ display: "flex", gap: 4, marginBottom: 32, background: "white", borderRadius: 12, padding: 4, boxShadow: "0 1px 3px rgba(0,0,0,.08)", width: "fit-content" }}>
          {([
            { key: "kpi",        label: "📈 KPI & Participation" },
            { key: "classement", label: "🏅 Classement candidats" },
            { key: "bureaux",    label: `🏫 Bureaux (${bureauComparisons.length})` },
          ] as { key: Tab; label: string }[]).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{ padding: "10px 20px", borderRadius: 9, border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer", background: tab === t.key ? "#2563eb" : "transparent", color: tab === t.key ? "white" : "#6b7280", transition: "all .15s" }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── KPI ── */}
        {tab === "kpi" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(260px, 1fr))", gap: 20, marginBottom: 28 }}>
              {kpis.map(card => <KpiBlock key={card.label} card={card} />)}
            </div>
            <div  style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(260px, 1fr))", gap: 20, marginBottom: 28 }}>
            {participation && (
              <div style={{ background: "white", borderRadius: 16, padding: "24px 28px", boxShadow: "0 1px 3px rgba(0,0,0,.08)", marginBottom: 24 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 20 }}>📊 Taux de participation</h2>
                <div style={{ display: "grid", gap: 18 }}>
                  <div>
                    <ProgressBar label="Tour 1" value={participation.r1} max={100} color="#94a3b8" />
                    <ProgressBar label="Tour 2" value={participation.r2} max={100} color="#2563eb" />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 12 }}>
                    <div style={{ paddingTop: 10, display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                      <span style={{ color: "#6b7280" }}>Évolution</span>
                      <span style={{ fontWeight: 700, color: participation.r2 >= participation.r1 ? "#22c55e" : "#ef4444" }}>
                        {participation.r2 >= participation.r1 ? "+" : ""}{(participation.r2 - participation.r1).toFixed(2)} pts
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {topBureaux.length > 0 && (
              <div style={{ background: "white", borderRadius: 16, padding: "24px 28px", boxShadow: "0 1px 3px rgba(0,0,0,.08)" }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 20 }}>🏫 Top 3 bureaux — participation au Tour 2</h2>
                {topBureaux.map((b, i) => (
                  <div key={b.name} style={{ marginBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 13 }}>
                      <span style={{ color: "#374151" }}><span style={{ fontWeight: 700, marginRight: 8, color: "#2563eb" }}>#{i + 1}</span>{b.name}</span>
                      <span style={{ fontWeight: 700, color: "#111827" }}>{b.participation.toFixed(1)} %</span>
                    </div>
                    <div style={{ height: 6, background: "#f3f4f6", borderRadius: 99 }}>
                      <div style={{ height: 6, borderRadius: 99, background: `hsl(${220 - i * 15}, 80%, ${50 + i * 5}%)`, width: `${Math.min(b.participation, 100)}%`, transition: "width .6s ease" }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
            </div>
          </>
        )}

        {/* ── CLASSEMENT ── */}
        {tab === "classement" && (
          <>
            <div style={{ display: "flex", gap: 20, marginBottom: 20, flexWrap: "wrap" }}>
              {[{ icon: "▲", color: "#16a34a", label: "Montée au classement" }, { icon: "▼", color: "#dc2626", label: "Baisse au classement" }, { icon: "—", color: "#9ca3af", label: "Rang inchangé" }].map(l => (
                <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#374151" }}>
                  <span style={{ color: l.color, fontWeight: 700 }}>{l.icon}</span>{l.label}
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
              {[{ key: "rank2", label: "Classement T2" }, { key: "rankMove", label: "Meilleure progression" }, { key: "votes2", label: "Plus de votes T2" }, { key: "pctDiff", label: "Meilleure évolution %" }].map(opt => (
                <button key={opt.key} onClick={() => setSortBy(opt.key as any)} style={{ padding: "7px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer", background: sortBy === opt.key ? "#2563eb" : "white", color: sortBy === opt.key ? "white" : "#374151", boxShadow: "0 1px 3px rgba(0,0,0,.08)", transition: "all .15s" }}>
                  {opt.label}
                </button>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "44px 1fr 80px 80px 80px 40px", gap: 16, padding: "0 20px", marginBottom: 8 }}>
              {["Rang T2", "Candidat", "Votes T2", "Évol. %pts", "Rang ↕", ""].map(h => (
                <div key={h} style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".05em" }}>{h}</div>
              ))}
            </div>
            {sortedCandidates.map((c, i) => <CandidateRow key={c.name} c={c} index={i} />)}
          </>
        )}

        {/* ── BUREAUX ── */}
        {tab === "bureaux" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
              <div style={{ display: "flex", gap: 8 }}>
                {([
                  { key: "all",     label: `Tous (${bureauComparisons.length})` },
                  { key: "changed", label: `⚡ Changements (${changedCount})` },
                ] as { key: "all" | "changed"; label: string }[]).map(opt => (
                  <button key={opt.key} onClick={() => setBureauFilter(opt.key)} style={{ padding: "7px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer", background: bureauFilter === opt.key ? "#2563eb" : "white", color: bureauFilter === opt.key ? "white" : "#374151", boxShadow: "0 1px 3px rgba(0,0,0,.08)", transition: "all .15s" }}>
                    {opt.label}
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 16, fontSize: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}><div style={{ width: 14, height: 4, borderRadius: 99, background: "#94a3b8" }} /><span style={{ color: "#6b7280" }}>Tour 1</span></div>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}><div style={{ width: 14, height: 4, borderRadius: 99, background: "#2563eb" }} /><span style={{ color: "#6b7280" }}>Tour 2</span></div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(400px, 1fr))", gap: 16 }}>
              {filteredBureaux.map(b => <BureauCard key={b.id} b={b} />)}
            </div>

            {filteredBureaux.length === 0 && (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#9ca3af", fontSize: 15 }}>
                Aucun bureau avec changement de gagnant
              </div>
            )}
          </>
        )}

      </div>
    </div>
  )
}
