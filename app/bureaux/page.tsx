"use client"

import Sidebar from "@/components/Sidebar"
import BureauCards from "@/components/BureauCards"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function BureauxPage(){

const [bureaux,setBureaux] = useState<any[]>([])
const [sort,setSort] = useState("desc")

const colors:any = {
"Lefrand":"bg-blue-100 text-blue-700",
"Petitjean":"bg-red-100 text-red-700",
"Messiha":"bg-purple-100 text-purple-700"
}

useEffect(()=>{

async function load(){

// récupérer les votes
const { data:votes } = await supabase
.from("votes")
.select(`
votes,
bureau_id,
candidate_id,
candidates(name)
`)

const bureauVotes:any = {}

votes?.forEach((v:any)=>{

const name = v.candidates.name

if(!bureauVotes[v.bureau_id]) bureauVotes[v.bureau_id] = {}
if(!bureauVotes[v.bureau_id][name]) bureauVotes[v.bureau_id][name] = 0

bureauVotes[v.bureau_id][name] += v.votes

})

// récupérer résultats bureaux
const { data:results } = await supabase
.from("bureau_results")
.select(`
*,
bureaux(name)
`)

results?.forEach((b:any)=>{

const votesBureau = bureauVotes[b.bureau_id] || {}

const sorted =
Object.entries(votesBureau)
.sort((a:any,b:any)=>b[1]-a[1])

const winner = sorted[0]

b.winner = winner ? winner[0] : "-"

b.top3 = sorted.slice(0,3)

})

setBureaux(results || [])

}

load()

},[])


// tri dynamique
const sortedBureaux = [...bureaux].sort((a:any,b:any)=>{

const rateA = a.registered > 0 ? a.voters / a.registered : 0
const rateB = b.registered > 0 ? b.voters / b.registered : 0

if(sort === "desc") return rateB - rateA
return rateA - rateB

})

return(

<div className="flex bg-gray-100 min-h-screen">

<Sidebar/>

<div className="flex-1 p-4">

<div className="flex justify-between xl:items-center mb-6 xl:flex-row flex-col items-start gap-6">

<h1 className="text-2xl font-bold">
🏫 Résultats par bureau
</h1>

<select
value={sort}
onChange={(e)=>setSort(e.target.value)}
className="border rounded px-3 py-2 bg-white shadow"
>

<option value="desc">
Participation : plus actif
</option>

<option value="asc">
Participation : moins actif
</option>

</select>

</div>

<BureauCards
bureaux={sortedBureaux}
colors={colors}
/>

</div>

</div>

)

}