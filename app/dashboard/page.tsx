"use client"

import { useEffect, useState } from "react"
import Sidebar from "@/components/Sidebar"
import { supabase } from "@/lib/supabase"
import BureauCards from "@/components/BureauCards"
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
  const [participationData,setParticipationData] = useState<any[]>([])
  const [activeBureau,setActiveBureau] = useState<any>(null)

  const [stats,setStats] = useState({
    registered:0,
    voters:0,
    expressed:0,
    blank:0,
    nullVotes:0
  })

  async function loadData(){

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

  const participationArray:any = []

  results?.forEach((b:any)=>{

    registered += b.registered
    voters += b.voters
    expressed += b.expressed
    blank += b.blank
    nullVotes += b.null_votes

    const part =
    b.registered > 0
    ? ((b.voters / b.registered)*100).toFixed(2)
    : 0

    participationArray.push({
      name:b.bureaux?.name || `Bureau ${b.bureau_id}`,
      value:Number(part),
      fill:`hsl(${Math.random()*360},70%,50%)`
    })

    const votesBureau = bureauVotes[b.bureau_id] || {}

    const sorted =
    Object.entries(votesBureau)
    .sort((a:any,b:any)=>b[1]-a[1])

    const winner = sorted[0]

    b.winner = winner ? winner[0] : "-"

    // TOP 3 candidats
    b.top3 = sorted.slice(0,3)

  })

  setParticipationData(participationArray)

  setStats({
    registered,
    voters,
    expressed,
    blank,
    nullVotes
  })

  setBureaux(results || [])

}

  useEffect(()=>{

    loadData()

    const interval = setInterval(loadData,3000)

    return ()=>clearInterval(interval)

  },[])

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

  const colors:any = {
    "Lefrand":"bg-blue-100 text-blue-700",
    "Petitjean":"bg-red-100 text-red-700",
    "Messiha":"bg-purple-100 text-purple-700"
  }

  return(

<div className="flex bg-gray-100 min-h-screen">

<Sidebar/>

<div className="flex-1 p-8">

<h1 className="text-2xl font-bold mb-6">
Dashboard Élections
</h1>

{/* STATS */}
<div className="grid grid-cols-8 gap-4 mb-10">

<Card title="Inscrits" value={stats.registered} color="blue"/>
<Card title="Votants" value={stats.voters} color="yellow"/>
<Card title="Blancs" value={stats.blank} color="gray"/>
<Card title="Nuls" value={stats.nullVotes} color="red"/>
<Card title="Exprimés" value={stats.expressed} color="green"/>
<Card title="Taux de vote" value={`${participation}%`} color="orange"/>
<Card title="Taux exprimés" value={`${expressedRate}%`} color="teal"/>
<Card title="Candidats" value={candidates.length} color="purple"/>

</div>

<div className="grid grid-cols-4 gap-6">

{/* GRAPH candidats */}
<div className="bg-white p-6 rounded-xl col-span-2 shadow mb-10">

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


{/* GRAPH PARTICIPATION PAR BUREAU */}
<div className="bg-white p-6 rounded-xl shadow mb-10">

<h2 className="text-xl font-bold mb-6">
📊 Classement participation
</h2>

<div style={{width:"100%",height:500}}>

<ResponsiveContainer>

<BarChart
data={participationRanking}
layout="vertical"
margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
>

<XAxis
type="number"
domain={[0,100]}
tickFormatter={(v)=>`${v}%`}
/>

<YAxis
type="category"
dataKey="name"
width={0}
/>

<Tooltip
formatter={(value:any)=>`${value.toFixed(2)} %`}
/>

<Bar
dataKey="rate"
fill="#16a34a"
radius={[0,6,6,0]}
/>

</BarChart>

</ResponsiveContainer>

</div>

</div>

{/* RESULTATS */}
<div className="bg-white p-6 rounded-xl shadow mb-10">

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

</div>

<div className="rounded-xl">
      <Image src={banier} className="mt-4 rounded-xl shadow  w-full" alt="elections"/>
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