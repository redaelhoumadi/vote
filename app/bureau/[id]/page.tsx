"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Sidebar from "@/components/Sidebar"
import { useVoteStore } from "@/store/voteStore"
import { supabase } from "@/lib/supabase"
import Clock from "@/components/Clock"
import Image from "next/image"
import beseline from "@/public/BASELINE 1.png"

export default function BureauPage(){

  const params = useParams()
  const bureauId = Number(params.id)

  const [bureauName,setBureauName] = useState("")

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

      // charger nom bureau
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

  return(

<div className="flex bg-gray-100 min-h-screen">

  <Sidebar/>

  <div className="flex-1 p-8">

    <div className="flex justify-between items-center mb-6">

      <h1 className="text-2xl font-bold p-6 bg-white rounded-xl shadow p-4 text-center">
        Bureau — {bureauName || "Chargement..."}
      </h1>

      <Clock/>

    </div>

    <div className="grid grid-cols-7 gap-4 mb-8">

      <div className="bg-white rounded-xl shadow p-4 text-center">
        <div className="text-gray-500 text-sm">Inscrits</div>
        <div className="text-2xl font-bold text-blue-600">
          {registered}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-4 text-center">
        <div className="text-gray-500 text-sm">Votants</div>
        <div className="text-2xl font-bold text-yellow-500">
          {voters}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-4 text-center">
        <div className="text-gray-500 text-sm">Blancs</div>
        <div className="text-2xl font-bold">
          {blank}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-4 text-center">
        <div className="text-gray-500 text-sm">Nuls</div>
        <div className="text-2xl font-bold text-red-500">
          {nullVotes}
        </div>
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

    </div>

    <div className="grid grid-cols-4 gap-6">

      <div className="col-span-3 grid grid-cols-4 gap-6">

        {candidates.map(c=>(

          <div
            key={c.id}
            className="bg-white rounded-xl shadow p-6 text-center"
          >

            <img
              src={c.photo || "/candidate.png"}
              className="w-20 h-20 rounded-full mx-auto mb-4 object-cover"
            />

            <h3 className="font-semibold mb-3">
              {c.name}
            </h3>

            <div className="flex items-center justify-center gap-3 mb-3">

              <button
                onClick={()=>handleVote(c.id,Math.max(0,c.votes-1))}
                className="text-red-500 text-xl bg-red-100 p-1 rounded-sm cursor-pointer px-2"
              >
                -
              </button>

              <div className="bg-gray-100 px-4 py-1 rounded font-black">
                {c.votes}
              </div>

              <button
                onClick={()=>handleVote(c.id,c.votes+1)}
                className="text-green-500 text-xl bg-green-100 p-1 rounded-sm cursor-pointer px-2"
              >
                +
              </button>

            </div>

            <div className="text-lg font-bold text-blue-800 bg-blue-100 rounded-sm mx-8">
              {c.percent.toFixed(2)} %
            </div>

          </div>

        ))}

      </div>

      <div className="bg-white rounded-xl shadow p-6">

        <h2 className="text-xl font-bold mb-4">
         🏆 Classement
        </h2>

        {[...candidates]
        .sort((a,b)=>b.votes-a.votes)
        .map((c,i)=>(

          <div
            key={c.id}
            className="flex justify-between border-b border-gray-100 py-5"
          >

            <div>
              {i+1} - {c.name}
            </div>

            <div className="font-bold">
              {c.votes} Votes
            </div>

          </div>

        ))}

      </div>

    </div>

    <div className="bg-linear-to-r from-blue-900 to-orange-500 px-120 pt-1 pb-4 rounded-xl mt-8">
      <Image src={beseline} className="mt-4 rounded-xl w-full" alt="elections"/>
    </div>

  </div>

</div>

)

}