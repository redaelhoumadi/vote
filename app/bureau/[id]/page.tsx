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

export default function BureauPage(){

  const params = useParams()
  const bureauId = Number(params.id)

  const [bureauName,setBureauName] = useState("")

  const [registeredInput,setRegisteredInput] = useState(0)
  const [blankInput,setBlankInput] = useState(0)
  const [nullInput,setNullInput] = useState(0)
  const [votersInput,setVotersInput] = useState(0)

  const {
    candidates,
    setCandidates,
    updateVote,
    registered,
    voters,
    blank,
    nullVotes,
    expressed,
    setStats
  } = useVoteStore()

  const participation =
  registered > 0
  ? ((voters / registered) * 100).toFixed(2)
  : "0"

  const expressedRate =
  voters > 0
  ? ((expressed / voters) * 100).toFixed(2)
  : "0"

  useEffect(()=>{

    async function loadData(){

      const { data:{user} } = await supabase.auth.getUser()

      if(!user){
        window.location.href = "/login"
        return
      }

      const { data:userData } = await supabase
        .from("users")
        .select("*")
        .eq("id",user.id)
        .single()

      if(!userData){
        window.location.href = "/login"
        return
      }

      if(userData.role !== "admin" && userData.bureau_id !== bureauId){

        alert("Accès interdit à ce bureau")
        window.location.href = `/bureau/${userData.bureau_id}`
        return

      }

      const { data:bureauData } = await supabase
        .from("bureaux")
        .select("*")
        .eq("id",bureauId)
        .single()

      if(bureauData){
        setBureauName(bureauData.name)
      }

      const { data: candidatesData } = await supabase
        .from("candidates")
        .select("*")

      const { data: votesData } = await supabase
        .from("votes")
        .select("*")
        .eq("bureau_id",bureauId)

      const { data: statsData } = await supabase
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

        const formatted = candidatesData.map((c:any)=>{

          const vote = votesData?.find(
            (v:any)=>v.candidate_id === c.id
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
            votes:votes,
            percent
          }

        })

        setCandidates(formatted)

      }

    }

    if(bureauId){
      loadData()
    }

  },[bureauId])


  async function handleVote(id:number,newVotes:number){

    updateVote(id,newVotes)

    const { error } = await supabase
      .from("votes")
      .upsert({
        bureau_id: bureauId,
        candidate_id: id,
        votes: newVotes
      },{ onConflict: "bureau_id,candidate_id" })

    if(error){
      console.error("Erreur sauvegarde vote:", error)
      alert("Erreur sauvegarde vote")
    }

  }

  async function saveStats(){

  const { error } = await supabase
  .from("bureau_results")
  .update({
    registered: registeredInput,
    voters: votersInput,
    blank: blankInput,
    null_votes: nullInput
  })
  .eq("bureau_id",bureauId)

  if(error){
    alert("Erreur sauvegarde")
    return
  }

  setStats({
    registered: registeredInput,
    voters: votersInput,
    blank: blankInput,
    nullVotes: nullInput
  })

  alert("Statistiques enregistrées")

}

  return(

<div className="flex bg-gray-100 min-h-screen">

  <Sidebar/>

  <div className="flex-1 p-8">

    <div className="flex justify-between items-center mb-6">

      <h1 className="text-2xl font-bold bg-white text-black rounded-xl shadow p-4 text-center">
        Bureau — {bureauName || "Chargement..."}
      </h1>

      <Clock/>

    </div>

    <div className="grid grid-cols-8 gap-4 mb-4">

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

<div className="text-gray-500 text-sm">Votants</div>

<input
type="number"
value={votersInput}
onChange={(e)=>setVotersInput(Number(e.target.value))}
className="w-full mt-2 text-2xl font-bold text-yellow-500 border rounded text-center"
/>

</div>

      <div className="bg-white rounded-xl shadow p-4 text-center">

        <div className="text-gray-500 text-sm">Blancs</div>

        <input
        type="number"
        value={blankInput}
        onChange={(e)=>setBlankInput(Number(e.target.value))}
        className="w-full mt-2 text-2xl font-bold border rounded text-center"
        />

      </div>

      <div className="bg-white rounded-xl shadow p-4 text-center">

        <div className="text-gray-500 text-sm">Nuls</div>

        <input
        type="number"
        value={nullInput}
        onChange={(e)=>setNullInput(Number(e.target.value))}
        className="w-full mt-2 text-2xl font-bold text-red-500 border rounded text-center"
        />

      </div>

      <div className="bg-white rounded-xl shadow p-4 text-center">
        <div className="text-gray-500 text-sm">Exprimés</div>
        <div className="text-2xl font-bold text-green-500">
          {expressed}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-4 text-center">
        <div className="text-gray-500 text-sm">Taux de vote</div>
        <div className="text-2xl font-bold text-orange-500">
          {participation}%
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-4 text-center">
        <div className="text-gray-500 text-sm">Taux d'exprimés</div>
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

    <div className="mb-8">

      

    </div>

    <div className="grid grid-cols-4 gap-6">

      <div className="col-span-3 grid grid-cols-4 gap-6">

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

      <div className="bg-white rounded-xl shadow p-6">

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
      <Image src={banier} className="mt-4 rounded-xl shadow w-full" alt="elections"/>
    </div>

  </div>

</div>

)

}