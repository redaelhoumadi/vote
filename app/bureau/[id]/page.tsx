"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Sidebar from "@/components/Sidebar"
import { useVoteStore } from "@/store/voteStore"
import { supabase } from "@/lib/supabase"
import Clock from "@/components/Clock"
import Image from "next/image"
import banier from "@/public/banniere.jpg"
import CandidateCard from "@/components/CandidateCard"
import Toast from "@/components/Toast"
import { useToast } from "@/hooks/useToast"
import Badge from "@/public/carte-didentite.png"
import Vote from "@/public/vote.png"
import Blanc from "@/public/blanc.png"
import Nuls from "@/public/nuls.png"
import Exprime from "@/public/exprime.png"

export default function BureauPage(){

const params = useParams()
const bureauId = Number(params.id)

/* 🔥 NEW */
const [role,setRole] = useState("")

const [bureauName,setBureauName] = useState("")
const [registeredInput,setRegisteredInput] = useState(0)
const [blankInput,setBlankInput] = useState(0)
const [nullInput,setNullInput] = useState(0)
const [votersInput,setVotersInput] = useState(0)
const [loading,setLoading] = useState(true)

const {toast,showToast} = useToast()

const votersError = votersInput > registeredInput
const blankError = blankInput > votersInput
const nullError = nullInput > votersInput

const {
round,
setRound,
candidates,
setCandidates,
setStats
} = useVoteStore()

/* 🔥 INIT ROUND (localStorage + défaut 2) */
useEffect(()=>{
const saved = localStorage.getItem("round")
if(saved){
setRound(Number(saved))
}else{
setRound(2)
}
},[])

/* 🔥 SAVE ROUND */
useEffect(()=>{
localStorage.setItem("round",String(round))
},[round])

const participation =
registeredInput > 0
? ((votersInput / registeredInput) * 100).toFixed(2)
: "0"

const expressedCalculated = votersInput - blankInput - nullInput

const expressedRate =
votersInput > 0
? ((expressedCalculated / votersInput) * 100).toFixed(2)
: "0"

useEffect(()=>{

let currentUser:any = null

async function init(){

const { data:{user} } = await supabase.auth.getUser()

if(!user){
window.location.href="/login"
return
}

currentUser = user

await loadData(user)
await ping(user)
await checkAccess(user)

}

async function loadData(user:any){

setLoading(true)

const { data:userData } = await supabase
.from("users")
.select("*")
.eq("id",user.id)
.single()

if(!userData){
window.location.href="/login"
return
}

/* 🔥 SAVE ROLE */
setRole(userData.role)

/* 🔥 BLOQUE AGENT SUR TOUR 2 */
if(userData.role === "agent" && round === 1){
setRound(2)
}

if(!userData.access_enabled){
window.location.href="/blocked"
return
}

if(userData.role !== "admin" && userData.bureau_id !== bureauId){
showToast("error","Accès interdit à ce bureau")
window.location.href=`/bureau/${userData.bureau_id}`
return
}

/* bureau */

const { data:bureauData } = await supabase
.from("bureaux")
.select("*")
.eq("id",bureauId)
.single()

if(bureauData){
setBureauName(bureauData.name)
}

/* candidats */

let candidatesData:any = []

if(round === 1){

const { data } = await supabase
.from("candidates")
.select("*")

candidatesData = data

}else{

const { data:firstRoundVotes } = await supabase
.from("votes")
.select(`
votes,
candidate_id,
candidates(name,photo)
`)
.eq("round",1)

const totals:any = {}

firstRoundVotes?.forEach((v:any)=>{

if(!totals[v.candidate_id]){
totals[v.candidate_id] = {
id:v.candidate_id,
name:v.candidates.name,
photo:v.candidates.photo,
votes:0
}
}

totals[v.candidate_id].votes += v.votes

})

const sorted = Object.values(totals)
.sort((a:any,b:any)=>b.votes-a.votes)

candidatesData = sorted.slice(0,4)

}

/* votes */

const { data:votesData } = await supabase
.from("votes")
.select("*")
.eq("bureau_id",bureauId)
.eq("round",round)

/* stats */

const { data:statsData } = await supabase
.from("bureau_results")
.select("*")
.eq("bureau_id",bureauId)
.eq("round",round)
.single()

if(statsData){

setStats({
registered:statsData.registered,
voters:statsData.voters,
blank:statsData.blank,
nullVotes:statsData.null_votes
})

setRegisteredInput(statsData.registered)
setVotersInput(statsData.voters)
setBlankInput(statsData.blank)
setNullInput(statsData.null_votes)

}

/* 🔥 1ER TOUR DATA (SI TOUR 2) */

let firstRoundVotesAll:any = []
let totalFirstRoundVotes = 0

if(round === 2){

const { data } = await supabase
.from("votes")
.select("*")
.eq("round",1)
.eq("bureau_id",bureauId)

firstRoundVotesAll = data || []

totalFirstRoundVotes = firstRoundVotesAll.reduce(
(acc:any,v:any)=>acc + v.votes,
0
)

}

/* format candidats */

if(candidatesData?.length){

const formatted = candidatesData.map((c:any)=>{

const vote = votesData?.find(
(v:any)=>v.candidate_id === c.id
)

let firstVotes = undefined
let firstPercent = undefined

if(round === 2){

firstVotes = firstRoundVotesAll
.filter((v:any)=>v.candidate_id === c.id)
.reduce((acc:any,v:any)=>acc + v.votes,0)

firstPercent =
totalFirstRoundVotes > 0
? (firstVotes / totalFirstRoundVotes) * 100
: 0

}

return{
id:c.id,
name:c.name,
photo:c.photo,
votes: vote ? vote.votes : 0,
firstRoundVotes:firstVotes,
firstRoundPercent:firstPercent
}

})

setCandidates(formatted)

}

setLoading(false)

}

/* ping */

async function ping(user:any){
if(!user) return
await supabase.from("users").update({
last_seen:new Date().toISOString()
}).eq("id",user.id)
}

/* check access */

async function checkAccess(user:any){
if(!user) return
const { data } = await supabase
.from("users")
.select("access_enabled")
.eq("id",user.id)
.single()

if(!data?.access_enabled){
window.location.href="/blocked"
}
}

init()

const pingInterval = setInterval(()=>{
if(currentUser) ping(currentUser)
},10000)

const accessInterval = setInterval(()=>{
if(currentUser) checkAccess(currentUser)
},5000)

return ()=>{
clearInterval(pingInterval)
clearInterval(accessInterval)
}

},[bureauId,round])

/* 🔥 PERCENT */

const candidatesWithPercent = candidates.map(c => ({
...c,
percent: expressedCalculated > 0
? (c.votes / expressedCalculated) * 100
: 0
}))

/* 🔥 VOTE */

async function handleVote(id:number,newVotes:number){

if(newVotes < 0){
showToast("error","Vote négatif impossible")
return
}

const updated = candidates.map(c =>
c.id === id ? {...c, votes:newVotes} : c
)

const totalVotes = updated.reduce((acc,c)=>acc + c.votes,0)

if(totalVotes > expressedCalculated){
showToast("warning","Les votes dépassent les exprimés")
return
}

setCandidates(updated)

await supabase.from("votes").upsert({
bureau_id:bureauId,
candidate_id:id,
votes:newVotes,
round:round
},{onConflict:"bureau_id,candidate_id,round"})

}

/* SAVE */

async function saveStats(){

const expressed = votersInput - blankInput - nullInput

const totalVotes = candidates.reduce((acc,c)=>acc + c.votes,0)

if(totalVotes > expressed){
showToast("error","Les votes dépassent les exprimés")
return
}

await supabase.from("bureau_results").update({
registered:registeredInput,
voters:votersInput,
blank:blankInput,
null_votes:nullInput,
expressed:expressed
})
.eq("bureau_id",bureauId)
.eq("round",round)

showToast("success","Statistiques enregistrées")

}

if(loading){
return(
<div className="flex items-center justify-center min-h-screen bg-gray-100">
<div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"/>
</div>
)
}

return(

<>
{toast && <Toast type={toast.type} message={toast.message}/>}

<div className="flex bg-gray-100 min-h-screen">

<Sidebar/>

<div className="flex-1 p-4">

{/* SWITCH TOUR */}

<div className="flex gap-3 mb-4">

<button
onClick={()=> role !== "agent" && setRound(1)}
disabled={role === "agent"}
className={`px-4 py-2 cursor-pointer rounded font-semibold 
${round===1 ? "bg-blue-600 text-white" : "bg-gray-200"}
${role==="agent" ? "opacity-50 cursor-not-allowed" : ""}
`}
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

<div className="flex justify-between mb-6">
<h1 className="text-2xl font-bold bg-white rounded-xl shadow p-4">
Bureau — {bureauName}
</h1>

<Clock/>
</div>

{/* STATS UI (inchangé) */}

<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-8 gap-4 gap-4 mb-4">

<div className="bg-white rounded-xl shadow p-4 text-center">

<div className="flex items-center justify-center gap-1">
    <Image src={Badge} alt="badge" className="w-5"/>
<div className="text-blue-500 text-md font-bold">Inscrits</div>
</div>


<input
type="number"
min="0"
value={registeredInput}
onChange={(e)=>setRegisteredInput(Number(e.target.value))}
className="w-full mt-2 text-2xl font-bold text-blue-600 border rounded text-center"
/>

</div>

<div className="bg-white rounded-xl shadow p-4 text-center">
<div className="flex items-center justify-center gap-1">
<Image src={Vote} alt="badge" className="w-6"/>
<div className="text-orange-500 font-bold text-md">Votants</div>
</div>
<input
type="number"
min="0"
value={votersInput}
onChange={(e)=>setVotersInput(Number(e.target.value))}
className={`w-full mt-2 text-2xl font-bold border rounded text-center text-orange-500
${votersError ? "border-red-500 bg-red-50" : ""}`}
/>

</div>

<div className="bg-white rounded-xl shadow p-4 text-center">
<div className="flex items-center justify-center gap-1">
    <Image src={Blanc} alt="badge" className="w-6"/>
<div className="text-black-500 font-bold text-sm">Blancs</div>
</div>
<input
type="number"
min="0"
value={blankInput}
onChange={(e)=>setBlankInput(Number(e.target.value))}
className={`w-full mt-2 text-2xl font-bold border rounded text-center
${blankError ? "border-red-500 bg-red-50" : ""}`}
/>

</div>

<div className="bg-white rounded-xl shadow p-4 text-center">
<div className="flex items-center justify-center gap-1">
    <Image src={Nuls} alt="badge" className="w-6"/>
<div className="text-red-500 font-bold text-sm">Nuls</div>
</div>
<input
type="number"
min="0"
value={nullInput}
onChange={(e)=>setNullInput(Number(e.target.value))}
className={`w-full mt-2 text-2xl font-bold border rounded text-center text-red-500
${nullError ? "border-red-900 bg-red-50" : ""}`}
/>

</div>

<div className="bg-white rounded-xl shadow p-4 text-center">
<div className="flex items-center justify-center gap-1">
    <Image src={Exprime} alt="badge" className="w-6"/>
<div className="text-green-500  text-lg">Exprimés</div>
</div>
<div className="text-2xl font-bold text-green-500">
{expressedCalculated}
</div>

</div>

<div className="bg-white rounded-xl shadow p-4 text-center">

<div className="text-orange-500 text-lg ">Taux de vote</div>

<div className="text-2xl font-bold text-orange-500">
{participation}%
</div>

</div>

<div className="bg-white rounded-xl shadow p-4 text-center">

<div className="text-teal-500 text-lg">Taux exprimés</div>

<div className="text-2xl font-bold text-teal-500">
{expressedRate}%
</div>

</div>

<button
onClick={saveStats}
className="bg-blue-600 text-white px-6 py-2 rounded-lg shadow hover:bg-blue-700 transition cursor-pointer"
>
Enregistrer
</button>

</div>
<div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

{/* CANDIDATS */}
<div className="xl:col-span-2">

<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">

{candidatesWithPercent.map(c=>(

<CandidateCard
key={`${c.id}-${round}`}
id={c.id}
name={c.name}
photo={c.photo}
votes={c.votes}
percent={c.percent}

firstRoundVotes={round === 2 ? c.firstRoundVotes : undefined}
firstRoundPercent={round === 2 ? c.firstRoundPercent : undefined}

onAdd={()=>handleVote(c.id,c.votes+1)}
onRemove={()=>handleVote(c.id,Math.max(0,c.votes-1))}
onSave={(value)=>handleVote(c.id,value)}
/>

))}

</div>

</div>

{/* CLASSEMENT */}
<div className="bg-white rounded-xl shadow p-6">

<h2 className="text-3xl font-bold mb-4">
🏆 Classement
</h2>

{[...candidatesWithPercent]
.sort((a,b)=>b.votes-a.votes)
.map((c,i)=>(

<div
key={`${c.id}-rank`}
className="flex justify-between py-5"
>

<div className="font-bold">
{i+1} - {c.name}
</div>

<div className="font-bold">
{c.votes} Votes — {c.percent.toFixed(2)}%
</div>

</div>

))}

</div>

</div>

<div className="pt-1 pb-4 rounded-xl mt-4">
<Image src={banier} className="mt-4 rounded-xl shadow w-full object-cover" alt="elections"/>
</div>

</div>

</div>

</>

)

}