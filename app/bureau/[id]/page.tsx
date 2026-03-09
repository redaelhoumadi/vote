"use client"

import { useEffect } from "react"
import { useParams } from "next/navigation"
import Sidebar from "@/components/Sidebar"
import CandidateCard from "@/components/CandidateCard"
import Ranking from "@/components/Ranking"
import { useVoteStore } from "@/store/voteStore"
import { supabase } from "@/lib/supabase"

export default function BureauPage(){

  const params = useParams()
  const bureauId = Number(params.id)

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

    // récupérer utilisateur connecté
    const { data:{user} } = await supabase.auth.getUser()

    if(!user) return

    const { data:userData } = await supabase
      .from("users")
      .select("*")
      .eq("id",user.id)
      .single()

    if(!userData) return

    // 🔐 sécurité accès bureau
    if(userData.role !== "admin" && userData.bureau_id !== bureauId){

      alert("Accès interdit à ce bureau")
      window.location.href = `/bureau/${userData.bureau_id}`
      return

    }

    // charger candidats
    const { data: candidatesData } = await supabase
      .from("candidates")
      .select("*")

    // charger votes
    const { data: votesData } = await supabase
      .from("votes")
      .select("*")
      .eq("bureau_id",bureauId)

    // charger stats bureau
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

    await supabase
      .from("votes")
      .upsert({
        bureau_id:bureauId,
        candidate_id:id,
        votes:newVotes
      })

  }


  return(

    <div className="flex">

      <Sidebar/>

      <div className="flex-1 p-10">

        <h1 className="text-2xl font-bold mb-6">
          Bureau {bureauId}
        </h1>

        <div className="grid grid-cols-5 gap-4 mb-8">

          <div className="bg-white p-4 rounded shadow">
            Inscrits : {registered}
          </div>

          <div className="bg-white p-4 rounded shadow">
            Votants : {voters}
            <div className="text-sm text-gray-500">
              {participation} %
            </div>
          </div>

          <div className="bg-white p-4 rounded shadow">
            Blancs : {blank}
          </div>

          <div className="bg-white p-4 rounded shadow">
            Nuls : {nullVotes}
          </div>

          <div className="bg-white p-4 rounded shadow">
            Exprimés : {expressed}
            <div className="text-sm text-gray-500">
              {expressedRate} %
            </div>
          </div>

        </div>

        <div className="grid grid-cols-4 gap-6">

          <div className="col-span-3 grid grid-cols-4 gap-6">

            {candidates.map(c=>(
              <CandidateCard
                key={c.id}
                {...c}
                onAdd={()=>handleVote(c.id,c.votes+1)}
                onRemove={()=>handleVote(c.id,Math.max(0,c.votes-1))}
              />
            ))}

          </div>

          <Ranking candidates={candidates}/>

        </div>

      </div>

    </div>

  )

}