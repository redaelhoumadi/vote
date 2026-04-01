"use client"

import Sidebar from "@/components/Sidebar"
import BureauCards from "@/components/BureauCards"
import ExportButton from "@/components/ExportButton"   // ← AJOUT
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

/* ═══════════════════════════════════════════
   TYPES
═══════════════════════════════════════════ */

const CANDIDATE_COLORS: Record<string, string> = {
  "Lefrand":    "bg-blue-100 text-blue-700",
  "Brigantino": "bg-red-100 text-red-700",
  "Silighini":  "bg-purple-100 text-purple-700",
  "Petitjean":  "bg-orange-100 text-orange-700",
}

const SORT_OPTIONS = [
  { value: "participation_desc", label: "Participation : + actif" },
  { value: "participation_asc",  label: "Participation : - actif" },
  { value: "registered_desc",    label: "Inscrits : +" },
  { value: "registered_asc",     label: "Inscrits : -" },
  { value: "votes_desc",         label: "Votes : +" },
  { value: "votes_asc",          label: "Votes : -" },
]

/* ═══════════════════════════════════════════
   PAGE
═══════════════════════════════════════════ */

export default function BureauxPage() {

  const [bureaux,      setBureaux]      = useState<any[]>([])
  const [sort,         setSort]         = useState("participation_desc")
  const [round,        setRound]        = useState(1)
  const [winnerFilter, setWinnerFilter] = useState("all")
  const [loading,      setLoading]      = useState(true)

  /* ─────────────────────────────────────────
     CHARGEMENT
  ───────────────────────────────────────── */

  useEffect(() => {
    async function load() {
      setLoading(true)

      /* 🔒 AUTH */
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = "/login"; return }

      const { data: userData } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single()

      if (!userData)             { window.location.href = "/login";   return }
      if (!userData.access_enabled) { window.location.href = "/blocked"; return }

      /* 🗳️ VOTES */
      const { data: votes } = await supabase
        .from("votes")
        .select("votes, bureau_id, candidate_id, round, candidates(name)")
        .eq("round", round)

      const bureauVotes: any = {}
      votes?.forEach((v: any) => {
        const name = v.candidates.name
        if (!bureauVotes[v.bureau_id]) bureauVotes[v.bureau_id] = {}
        if (!bureauVotes[v.bureau_id][name]) bureauVotes[v.bureau_id][name] = 0
        bureauVotes[v.bureau_id][name] += v.votes
      })

      /* 📊 RÉSULTATS */
      const { data: results } = await supabase
        .from("bureau_results")
        .select("*, bureaux(name)")
        .eq("round", round)

      results?.forEach((b: any) => {
        const votesBureau = bureauVotes[b.bureau_id] || {}
        const sorted = Object.entries(votesBureau).sort((a: any, b: any) => b[1] - a[1])
        b.winner = sorted[0] ? sorted[0][0] : "-"
        b.top3   = sorted.slice(0, 3)
      })

      setBureaux(results || [])
      setLoading(false)
    }

    load()
  }, [round])

  /* ─────────────────────────────────────────
     FILTRES & TRI
  ───────────────────────────────────────── */

  const winnersList = Array.from(new Set(bureaux.map(b => b.winner).filter(Boolean)))

  const sortedBureaux = bureaux
    .filter(b => winnerFilter === "all" || b.winner === winnerFilter)
    .sort((a: any, b: any) => {
      const pA = a.registered > 0 ? a.voters / a.registered : 0
      const pB = b.registered > 0 ? b.voters / b.registered : 0
      switch (sort) {
        case "participation_desc": return pB - pA
        case "participation_asc":  return pA - pB
        case "registered_desc":    return b.registered - a.registered
        case "registered_asc":     return a.registered - b.registered
        case "votes_desc":         return b.voters - a.voters
        case "votes_asc":          return a.voters - b.voters
        default:                   return 0
      }
    })

  /* ─────────────────────────────────────────
     RENDER
  ───────────────────────────────────────── */

  return (
    <div className="flex bg-gray-50 min-h-screen">

      <Sidebar />

      <div className="flex-1 p-4">

        {/* ── TITRE ── */}
        <div className="mb-7">
          <h1 className="text-2xl font-extrabold text-gray-900">
            🏫 Résultats par bureau
          </h1>
          <p className="text-sm text-gray-500 mt-1.5">
            Consultez et filtrez les résultats détaillés par bureau de vote
          </p>
        </div>

        <div className="flex flex-col xl:flex-row justify-between">

          {/* ── SWITCH TOUR ── */}
          <div className="flex gap-1 mb-8 bg-white rounded-xl p-1 shadow-sm w-fit">
            {[
              { value: 1, label: "1er tour" },
              { value: 2, label: "2ème tour" },
            ].map(t => (
              <button
                key={t.value}
                onClick={() => setRound(t.value)}
                className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 border-none cursor-pointer ${
                  round === t.value
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* ── FILTRES, TRI & EXPORT ── */}
          <div className="flex flex-wrap gap-3 mb-6 items-center">

            {/* Tri */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Trier par</span>
              <select
                value={sort}
                onChange={e => setSort(e.target.value)}
                className="text-sm font-medium bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm text-gray-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {SORT_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* Filtre gagnant */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Gagnant</span>
              <select
                value={winnerFilter}
                onChange={e => setWinnerFilter(e.target.value)}
                className="text-sm font-medium bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm text-gray-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tous</option>
                {winnersList.map((w: any) => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
            </div>

            {/* Compteur */}
            <span className="text-sm text-gray-400 font-medium">
              {sortedBureaux.length} bureau{sortedBureaux.length > 1 ? "x" : ""}
            </span>

            {/* ── BOUTON EXPORT ── */}  {/* ← AJOUT */}
            {!loading && sortedBureaux.length > 0 && (
              <ExportButton bureaux={sortedBureaux} round={round} />
            )}

          </div>
        </div>

        {/* ── CONTENU ── */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : sortedBureaux.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-base">
            Aucun bureau trouvé
          </div>
        ) : (
          <BureauCards
            bureaux={sortedBureaux}
            colors={CANDIDATE_COLORS}
          />
        )}

      </div>
    </div>
  )
}
