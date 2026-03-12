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

/* ---------------- VOTES ---------------- */

const { data:votes } = await supabase
.from("votes")
.select(`
votes,
bureau_id,
candidate_id,
candidates(name)
`)

const totals:any = {}
const bureauVotes:any = {}

votes?.forEach((v:any)=>{

const name = v.candidates.name

if(!totals[name]) totals[name] = 0
totals[name] += v.votes

if(!bureauVotes[v.bureau_id]) bureauVotes[v.bureau_id] = {}
if(!bureauVotes[v.bureau_id][name]) bureauVotes[v.bureau_id][name] = 0

bureauVotes[v.bureau_id][name] += v.votes

})

const candidatesArray = Object.entries(totals).map(
([name,votes])=>({name,votes})
)

candidatesArray.sort((a:any,b:any)=>b.votes-a.votes)

setCandidates(candidatesArray)

/* ---------------- BUREAUX ---------------- */

const { data:results } = await supabase
.from("bureau_results")
.select(`
*,
bureaux(name)
`)

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

/* ---------------- USERS (AGENTS) ---------------- */

const { data:usersData, error } = await supabase
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

if(error){
console.error("Erreur chargement users:", error)
}

setUsers(usersData || [])

}

/* ---------------- LOAD ---------------- */

useEffect(()=>{

loadData()

const interval = setInterval(loadData,3000)

return ()=>clearInterval(interval)

},[])

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

/* ---------------- BLOQUER / DEBLOQUER ---------------- */

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

<h1 className="text-2xl font-bold mb-6">
Dashboard Élections
</h1>

{/* STATS */}

<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-10">

<Card title="Inscrits" value={stats.registered} color="blue"/>
<Card title="Votants" value={stats.voters} color="yellow"/>
<Card title="Blancs" value={stats.blank} color="gray"/>
<Card title="Nuls" value={stats.nullVotes} color="red"/>
<Card title="Exprimés" value={stats.expressed} color="green"/>
<Card title="Taux de vote" value={`${participation}%`} color="orange"/>
<Card title="Taux exprimés" value={`${expressedRate}%`} color="teal"/>
<Card title="Candidats" value={candidates.length} color="purple"/>

</div>

<div className="grid grid-cols-1 lg:grid-cols-4 gap-4">

{/* PARTICIPATION */}

<div className="bg-white p-6 rounded-xl shadow">

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



{/* CLASSEMENT GENERAL */}

<div className="bg-white p-6 rounded-xl shadow">

<h2 className="text-xl font-bold mb-6">
🏆 Classement général
</h2>

{candidates.map((c,i)=>{

const percent =
totalVotes > 0
? ((c.votes / totalVotes)*100).toFixed(2)
: "0"

return(

<div key={c.name} className="mb-5">

<div className="flex justify-between mb-1">

<div className="font-semibold">
{i+1}. {c.name}
</div>

<div className="font-bold">
{c.votes} votes — {percent}%
</div>

</div>

<div className="w-full bg-gray-200 rounded h-3">

<div
className="bg-blue-600 h-3 rounded"
style={{width:`${percent}%`}}
/>

</div>

</div>

)

})}

</div>

{/* GESTION AGENTS */}

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

<div
key={u.id}
className="flex justify-between items-center border-b py-3"
>

<div className="flex gap-2 items-center">

<div className="text-sm font-semibold">
{u.bureaux?.name}
</div>

{isOnline ? (
<span className="text-green-600 font-semibold">🟢 En ligne</span>
) : (
<span className="text-gray-400">⚪ Hors ligne</span>
)}

{!u.access_enabled && (
<span className="text-red-600 font-semibold">🔴 Bloqué</span>
)}

</div>

<div>

{u.access_enabled ? (

<button
onClick={()=>toggleAccess(u.id,false)}
className="bg-red-500 text-white px-3 py-1 rounded cursor-pointer"
>
Bloquer
</button>

) : (

<button
onClick={()=>toggleAccess(u.id,true)}
className="bg-green-500 text-white px-3 py-1 rounded cursor-pointer"
>
Débloquer
</button>

)}

</div>

</div>

)

})}

</div>

{/* GRAPH CANDIDATS */}

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