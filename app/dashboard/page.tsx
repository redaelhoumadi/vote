"use client"

import { useEffect, useState } from "react"
import Sidebar from "@/components/Sidebar"
import { supabase } from "@/lib/supabase"
import Image from "next/image"
import banier from "@/public/banniere.jpg"
import {
BarChart,
Bar,
XAxis,
YAxis,
Tooltip,
ResponsiveContainer,
} from "recharts"

export default function DashboardPage(){

const [candidates,setCandidates] = useState<any[]>([])
const [bureaux,setBureaux] = useState<any[]>([])
const [users,setUsers] = useState<any[]>([])
const [firstRoundCandidates,setFirstRoundCandidates] = useState<any[]>([])

/* 🔥 TOUR */
const [round,setRound] = useState(1)

const [stats,setStats] = useState({
registered:0,
voters:0,
expressed:0,
blank:0,
nullVotes:0
})

async function loadData(){

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

/* 🔥 STEP 1 : TOP 4 DU 1ER TOUR */

let secondRoundCandidates:any = null

if(round === 2){

const { data:firstRoundVotes } = await supabase
.from("votes")
.select(`
votes,
candidate_id,
candidates(name)
`)
.eq("round",1)

const totalsFirst:any = {}

firstRoundVotes?.forEach((v:any)=>{

const name = v.candidates.name

if(!totalsFirst[name]) totalsFirst[name] = 0
totalsFirst[name] += v.votes

})

const sorted = Object.entries(totalsFirst)
.sort((a:any,b:any)=>b[1]-a[1])

secondRoundCandidates = sorted.slice(0,4).map((c:any)=>c[0])

}

/* 🔥 DATA CLASSEMENT 1ER TOUR */

const { data:firstVotes } = await supabase
.from("votes")
.select(`
votes,
candidates(name)
`)
.eq("round",1)

const totalsFirst:any = {}

firstVotes?.forEach((v:any)=>{

const name = v.candidates.name

if(!totalsFirst[name]) totalsFirst[name] = 0
totalsFirst[name] += v.votes

})

let firstArray = Object.entries(totalsFirst).map(
([name,votes])=>({name,votes})
)

firstArray.sort((a:any,b:any)=>b.votes-a.votes)

setFirstRoundCandidates(firstArray)

/* ---------------- VOTES (PAR TOUR) ---------------- */

const { data:votes } = await supabase
.from("votes")
.select(`
votes,
bureau_id,
candidate_id,
round,
candidates(name)
`)
.eq("round",round)

const totals:any = {}
const bureauVotes:any = {}

votes?.forEach((v:any)=>{

const name = v.candidates.name

/* 🔥 FILTRE 2EME TOUR */
if(round === 2 && !secondRoundCandidates?.includes(name)){
return
}

if(!totals[name]) totals[name] = 0
totals[name] += v.votes

if(!bureauVotes[v.bureau_id]) bureauVotes[v.bureau_id] = {}
if(!bureauVotes[v.bureau_id][name]) bureauVotes[v.bureau_id][name] = 0

bureauVotes[v.bureau_id][name] += v.votes

})

/* 🔥 FORMAT FINAL */

let candidatesArray = Object.entries(totals).map(
([name,votes])=>({name,votes})
)

candidatesArray.sort((a:any,b:any)=>b.votes-a.votes)

/* 🔥 SECURITÉ DOUBLE FILTRE */

if(round === 2 && secondRoundCandidates){
candidatesArray = candidatesArray.filter(c =>
secondRoundCandidates.includes(c.name)
)
}

setCandidates(candidatesArray)

/* ---------------- BUREAUX (PAR TOUR) ---------------- */

const { data:results } = await supabase
.from("bureau_results")
.select(`
*,
bureaux(name)
`)
.eq("round",round)

let registered = 0
let voters = 0
let expressed = 0
let blank = 0
let nullVotes = 0

results?.forEach((b:any)=>{

registered += b.registered
voters += b.voters
expressed += b.expressed
blank += b.blank
nullVotes += b.null_votes

const votesBureau = bureauVotes[b.bureau_id] || {}

const sorted =
Object.entries(votesBureau)
.sort((a:any,b:any)=>b[1]-a[1])

b.winner = sorted[0] ? sorted[0][0] : "-"
b.top3 = sorted.slice(0,3)

})

setStats({
registered,
voters,
expressed,
blank,
nullVotes
})

setBureaux(results || [])

/* ---------------- USERS ---------------- */

const { data:usersData } = await supabase
.from("users")
.select(`
id,
email,
access_enabled,
bureau_id,
last_seen,
bureaux(name)
`)
.eq("role","agent")
.order("bureau_id",{ascending:true})

setUsers(usersData || [])

}

/* ---------------- LOAD ---------------- */

useEffect(()=>{

loadData()

const interval = setInterval(loadData,3000)

return ()=>clearInterval(interval)

},[round]) // 🔥 MAJ quand change tour

/* ---------------- STATS ---------------- */

const participation =
stats.registered > 0
? ((stats.voters / stats.registered)*100).toFixed(2)
: "0"

const expressedRate =
stats.voters > 0
? ((stats.expressed / stats.voters)*100).toFixed(2)
: "0"

const totalVotes =
candidates.reduce((acc,c)=>acc+c.votes,0)

/* ---------------- PARTICIPATION RANKING ---------------- */

const participationRanking =
[...bureaux]
.map((b:any)=>{

const rate =
b.registered > 0
? (b.voters / b.registered) * 100
: 0

return{
name:b.bureaux?.name || `Bureau ${b.bureau_id}`,
rate
}

})
.sort((a,b)=>b.rate-a.rate)

/* ---------------- WINNERS COUNT 🔥 ---------------- */

const winnersCount:any = {}

bureaux.forEach((b:any)=>{
if(!b.winner) return
if(!winnersCount[b.winner]) winnersCount[b.winner] = 0
winnersCount[b.winner]++
})

/* ---------------- ACCESS ---------------- */

async function toggleAccess(userId:string,enabled:boolean){

await supabase
.from("users")
.update({ access_enabled:enabled })
.eq("id",userId)

loadData()

}

/* ---------------- RENDER ---------------- */

return(

<div className="flex bg-gray-100 min-h-screen">

<Sidebar/>

<div className="flex-1 p-4">

{/* 🔥 SWITCH TOUR */}

<div className="flex gap-3 mb-4">

<button
onClick={()=>setRound(1)}
className={`px-4 py-2 cursor-pointer rounded font-semibold ${round===1 ? "bg-blue-600 text-white" : "bg-gray-200"}`}
>
1er tour
</button>

<button
onClick={()=>setRound(2)}
className={`px-4 py-2 rounded cursor-pointer font-semibold ${round===2 ? "bg-blue-600 text-white" : "bg-gray-200"}`}
>
2ème tour
</button>

</div>

{/* STATS */}

<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-10">

<Card title="Inscrits" value={stats.registered} color="blue"/>
<Card title="Votants" value={stats.voters} color="orange"/>
<Card title="Blancs" value={stats.blank} color="gray"/>
<Card title="Nuls" value={stats.nullVotes} color="red"/>
<Card title="Exprimés" value={stats.expressed} color="green"/>
<Card title="Taux de vote" value={`${participation}%`} color="orange"/>
<Card title="Taux exprimés" value={`${expressedRate}%`} color="teal"/>
<Card title="Candidats" value={candidates.length} color="purple"/>

</div>

<div className="grid grid-cols-1 lg:grid-cols-4 gap-4">

{/* PARTICIPATION */}

<div className="bg-white p-6 pb-0 rounded-xl shadow">

<h2 className="text-xl font-bold mb-6">
📊 Classement participation
</h2>

<div style={{width:"100%",height:500}}>

<ResponsiveContainer>

<BarChart data={participationRanking} layout="vertical">

<XAxis type="number" domain={[0,100]} tickFormatter={(v)=>`${v}%`} />
<YAxis type="category" dataKey="name" width={0}/>
<Tooltip formatter={(value:any)=>`${value.toFixed(2)} %`} />

<Bar dataKey="rate" fill="#16a34a" radius={[0,6,6,0]}/>

</BarChart>

</ResponsiveContainer>

</div>

</div>

{/* CLASSEMENT */}

<div className="bg-white p-6 rounded-xl shadow shadow h-152 overflow-auto">

<h2 className="text-xl font-bold mb-6">
🏆 Classement général — Tour {round}
</h2>

{candidates.map((c,i)=>{

const percent =
totalVotes > 0
? ((c.votes / totalVotes)*100).toFixed(2)
: "0"

return(

<div key={c.name} className="mb-5">

<div className="flex justify-between mb-1">
<div className="font-semibold">{i+1}. {c.name}</div>
<div className="font-bold">{c.votes} — {percent}%</div>
</div>

<div className="w-full bg-gray-200 rounded h-3">
<div className="bg-blue-600 h-3 rounded" style={{width:`${percent}%`}}/>
</div>

</div>

)

})}

{/* 🔥 AFFICHAGE 1ER TOUR */}

{round === 2 && (

<div className="mt-10 border-t pt-6">

<h3 className="text-lg font-bold mb-4 text-gray-600">
📊 Résultats 1er tour
</h3>

{firstRoundCandidates.map((c,i)=>{

const totalFirst =
firstRoundCandidates.reduce((acc,x)=>acc+x.votes,0)

const percent =
totalFirst > 0
? ((c.votes / totalFirst)*100).toFixed(2)
: "0"

return(

<div key={`first-${c.name}`} className="mb-4 opacity-70">

<div className="flex justify-between mb-1">
<div className="font-semibold">{i+1}. {c.name}</div>
<div className="font-bold">{c.votes} — {percent}%</div>
</div>

<div className="w-full bg-gray-200 rounded h-2">
<div className="bg-gray-500 h-2 rounded" style={{width:`${percent}%`}}/>
</div>

</div>

)

})}

</div>

)}

</div>

{/* USERS */}

<div className="bg-white p-6 rounded-xl shadow h-152 overflow-auto lg:col-span-2">

<h2 className="text-xl font-bold mb-6">
🗳️ Gestion des bureaux
</h2>

{users.map((u:any)=>{

const lastSeen = u.last_seen
? new Date(u.last_seen + "Z").getTime()
: 0

const isOnline = (Date.now() - lastSeen) < 60000

return(

<div key={u.id} className="flex justify-between items-center border-b border-gray-200 py-3">

<div className="flex gap-2 items-center">

<div className="text-sm font-semibold">
{u.bureaux?.name}
</div>

{isOnline
? <span className="text-green-600 text-sm">🟢 En ligne</span>
: <span className="text-gray-400 text-sm">⚪ Hors ligne</span>
}

</div>

<div>

<button
onClick={()=>toggleAccess(u.id,!u.access_enabled)}
className={`px-3 py-1 rounded cursor-pointer text-white ${u.access_enabled ? "bg-red-500" : "bg-green-500"}`}
>
{u.access_enabled ? "Bloquer" : "Débloquer"}
</button>

</div>

</div>

)

})}

</div>

{/* GRAPH */}

<div className="bg-white p-6 rounded-xl shadow lg:col-span-4">

<h2 className="text-xl font-bold mb-6">
📊 Votes par candidat
</h2>

<div style={{width:"100%",height:500}}>

<ResponsiveContainer>

<BarChart data={candidates}>
<XAxis dataKey="name"/>
<YAxis/>
<Tooltip/>
<Bar dataKey="votes" fill="#2563eb"/>
</BarChart>

</ResponsiveContainer>

</div>

</div>

</div>

<div className="rounded-xl">
<Image src={banier} className="mt-4 rounded-xl shadow w-full" alt="elections"/>
</div>

</div>

</div>

)

}

function Card({title,value,color}:any){

return(

<div className="bg-white p-4 rounded-xl shadow text-center">

<div className={`text-${color}-500 text-lg`}>
{title}
</div>

<div className={`text-2xl font-bold text-${color}-500`}>
{value}
</div>

</div>

)

}