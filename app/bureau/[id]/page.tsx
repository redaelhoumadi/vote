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

export default function BureauPage(){

const params = useParams()
const bureauId = Number(params.id)

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
candidates,
setCandidates,
updateVote,
setStats
} = useVoteStore()

const participation =
registeredInput > 0
? ((votersInput / registeredInput) * 100).toFixed(2)
: "0"

const expressedCalculated = votersInput - blankInput - nullInput

const expressedRate =
votersInput > 0
? ((expressedCalculated / votersInput) * 100).toFixed(2)
: "0"

const totalCandidateVotes =
candidates.reduce((acc,c)=>acc + c.votes,0)

const voteOverflow =
totalCandidateVotes > expressedCalculated

useEffect(()=>{

async function loadData(){

setLoading(true)

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

if(userData.role !== "admin" && userData.bureau_id !== bureauId){
showToast("error","Accès interdit à ce bureau")
window.location.href=`/bureau/${userData.bureau_id}`
return
}

/* ---------------- bureau ---------------- */

const { data:bureauData } = await supabase
.from("bureaux")
.select("*")
.eq("id",bureauId)
.single()

if(bureauData){
setBureauName(bureauData.name)
}

/* ---------------- candidats ---------------- */

const { data:candidatesData } = await supabase
.from("candidates")
.select("*")

const { data:votesData } = await supabase
.from("votes")
.select("*")
.eq("bureau_id",bureauId)

const { data:statsData } = await supabase
.from("bureau_results")
.select("*")
.eq("bureau_id",bureauId)
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

if(candidatesData){

const expressedVotes = statsData?.expressed || 0

const formatted = candidatesData.map((c)=>{

const vote = votesData?.find(
(v)=>v.candidate_id === c.id
)

const votes = vote ? vote.votes : 0

const percent =
expressedVotes > 0
? (votes / expressedVotes) * 100
: 0

return{
id:c.id,
name:c.name,
photo:c.photo,
votes,
percent
}

})

setCandidates(formatted)

}

setLoading(false)

}

/* -------- ping utilisateur connecté -------- */

async function ping(){

const { data:{user} } = await supabase.auth.getUser()

if(!user) return

await supabase
.from("users")
.update({
last_seen:new Date().toISOString()
})
.eq("id",user.id)

}

/* -------- vérifier blocage -------- */

async function checkAccess(){

const { data:{user} } = await supabase.auth.getUser()

if(!user) return

const { data:userData } = await supabase
.from("users")
.select("access_enabled")
.eq("id",user.id)
.single()

if(!userData?.access_enabled){
window.location.href="/blocked"
}

}

if(bureauId){

loadData()
ping()
checkAccess()

const pingInterval = setInterval(ping,5000)
const accessInterval = setInterval(checkAccess,3000)

return ()=>{
clearInterval(pingInterval)
clearInterval(accessInterval)
}

}

},[bureauId])

async function handleVote(id:number,newVotes:number){

const oldVotes = candidates.find(c=>c.id===id)?.votes || 0

const newTotal =
totalCandidateVotes - oldVotes + newVotes

if(newTotal > expressedCalculated){
showToast("warning","Total votes dépasse exprimés")
return
}

updateVote(id,newVotes)

const { error } = await supabase
.from("votes")
.upsert({
bureau_id:bureauId,
candidate_id:id,
votes:newVotes
},{onConflict:"bureau_id,candidate_id"})

if(error){
showToast("error","Erreur sauvegarde vote")
}else{
showToast("success","Vote enregistré")
}

}

async function saveStats(){

if(votersError || blankError || nullError){
showToast("error","Erreur dans les statistiques")
return
}

const { error } = await supabase
.from("bureau_results")
.update({
registered:registeredInput,
voters:votersInput,
blank:blankInput,
null_votes:nullInput
})
.eq("bureau_id",bureauId)

if(error){
showToast("error","Erreur sauvegarde statistiques")
return
}

setStats({
registered:registeredInput,
voters:votersInput,
blank:blankInput,
nullVotes:nullInput
})

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

{toast && (
<Toast type={toast.type} message={toast.message}/>
)}



<div className="flex bg-gray-100 min-h-screen">

<Sidebar/>

<div className="flex-1 p-4">

<div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">

<h1 className="text-2xl font-bold bg-white rounded-xl shadow p-4">
Bureau — {bureauName || "Chargement..."}
</h1>

<Clock/>

</div>

<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-8 gap-4 gap-4 mb-4">

<div className="bg-white rounded-xl shadow p-4 text-center">

<div className="text-gray-500 text-sm">Inscrits</div>

<input
type="number"
value={registeredInput}
onChange={(e)=>setRegisteredInput(Number(e.target.value))}
className="w-full mt-2 text-2xl font-bold text-blue-600 border rounded text-center"
/>

</div>

<div className="bg-white rounded-xl shadow p-4 text-center">

<div className="text-orange-500 font-bold text-sm">Votants</div>

<input
type="number"
value={votersInput}
onChange={(e)=>setVotersInput(Number(e.target.value))}
className={`w-full mt-2 text-2xl font-bold border rounded text-center text-orange-500
${votersError ? "border-red-500 bg-red-50" : ""}`}
/>

</div>

<div className="bg-white rounded-xl shadow p-4 text-center">

<div className="text-black-500 font-bold text-sm">Blancs</div>

<input
type="number"
value={blankInput}
onChange={(e)=>setBlankInput(Number(e.target.value))}
className={`w-full mt-2 text-2xl font-bold border rounded text-center
${blankError ? "border-red-500 bg-red-50" : ""}`}
/>

</div>

<div className="bg-white rounded-xl shadow p-4 text-center">

<div className="text-red-500 font-bold text-sm">Nuls</div>

<input
type="number"
value={nullInput}
onChange={(e)=>setNullInput(Number(e.target.value))}
className={`w-full mt-2 text-2xl font-bold border rounded text-center text-red-500
${nullError ? "border-red-900 bg-red-50" : ""}`}
/>

</div>

<div className="bg-white rounded-xl shadow p-4 text-center">

<div className="text-green-500  text-lg">Exprimés</div>

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
{/* {voteOverflow && (

<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">

⚠ Total votes candidats ({totalCandidateVotes}) dépasse les exprimés ({expressedCalculated})

</div>

)}*/}



<div className="grid grid-cols-1 xl:grid-cols-4 gap-6 gap-6">

<div className="xl:col-span-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">

{candidates.map(c=>(

<CandidateCard
key={c.id}
id={c.id}
name={c.name}
photo={c.photo}
votes={c.votes}
percent={c.percent}
onAdd={()=>handleVote(c.id,c.votes+1)}
onRemove={()=>handleVote(c.id,Math.max(0,c.votes-1))}
onSave={(value)=>handleVote(c.id,value)}
/>

))}

</div>

<div className="bg-white rounded-xl shadow p-6 mt-6 xl:mt-0">

<h2 className="text-3xl font-bold mb-4">
🏆 Classement
</h2>

{[...candidates]
.sort((a,b)=>b.votes-a.votes)
.map((c,i)=>(

<div
key={c.id}
className="flex justify-between border-t border-gray-200 py-5"
>

<div className="font-bold">
{i+1} - {c.name}
</div>

<div className="font-bold">
{c.votes} Votes
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