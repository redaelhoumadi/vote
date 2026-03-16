"use client"

import Sidebar from "@/components/Sidebar"
import BureauCards from "@/components/BureauCards"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function BureauxPage(){

const [bureaux,setBureaux] = useState<any[]>([])
const [sort,setSort] = useState("participation_desc")

const colors:any = {
"Lefrand":"bg-blue-100 text-blue-700",
"Brigantino":"bg-red-100 text-red-700",
"Silighini":"bg-purple-100 text-purple-700",
"Petitjean":"bg-orange-100 text-orange-700"
}

useEffect(()=>{

async function load(){

/* ---------------- SECURITY ---------------- */

const { data:{user} } = await supabase.auth.getUser()

if(!user){
window.location.href="/login"
return
}

const { data:userData } = await supabase
.from("users")
.select("*")
.eq("id",user.id)
.single()

if(!userData){
window.location.href="/login"
return
}

if(!userData.access_enabled){
window.location.href="/blocked"
return
}

/* ---------------- récupérer votes ---------------- */

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

/* ---------------- récupérer résultats ---------------- */

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

/* ---------------- TRI DYNAMIQUE ---------------- */

const sortedBureaux = [...bureaux].sort((a:any,b:any)=>{

const participationA = a.registered > 0 ? a.voters / a.registered : 0
const participationB = b.registered > 0 ? b.voters / b.registered : 0

switch(sort){

case "participation_desc":
return participationB - participationA

case "participation_asc":
return participationA - participationB

case "registered_desc":
return b.registered - a.registered

case "registered_asc":
return a.registered - b.registered

case "votes_desc":
return b.voters - a.voters

case "votes_asc":
return a.voters - b.voters

default:
return 0

}

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

<option value="participation_desc">
Participation : + actif
</option>

<option value="participation_asc">
Participation : - actif
</option>

<option value="registered_desc">
Inscrits : +
</option>

<option value="registered_asc">
Inscrits : -
</option>

<option value="votes_desc">
Votes : +
</option>

<option value="votes_asc">
Votes : -
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