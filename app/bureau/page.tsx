"use client"

import { useEffect } from "react"
import Sidebar from "@/components/Sidebar"
import CandidateCard from "@/components/CandidateCard"
import Ranking from "@/components/Ranking"
import { useVoteStore } from "@/store/voteStore"
import { supabase } from "@/lib/supabase"

export default function BureauPage(){

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

useEffect(()=>{

async function loadVotes(){

const {data} = await supabase

.from("votes")

.select("*")

.eq("bureau_id",101)

const candidates = [

{ id:1,name:"Samuel Brigantino",votes:0,percent:0 },
{ id:2,name:"Guy Lefrand",votes:0,percent:0 },
{ id:3,name:"Eugénie Petitjean",votes:0,percent:0 },
{ id:4,name:"Jean Messiha",votes:0,percent:0 },
{ id:5,name:"Mélanie Peyraud",votes:0,percent:0 },
{ id:6,name:"Gérard Silighini",votes:0,percent:0 },
{ id:7,name:"Nathalie Chartier",votes:0,percent:0 },
{ id:8,name:"Michel Champredon",votes:0,percent:0 }

]

if(data){

data.forEach(v=>{

const c = candidates.find(x=>x.id===v.candidate_id)

if(c){

c.votes = v.votes

}

})

}

setCandidates(candidates)

}

loadVotes()

},[])

  return(

    <div className="flex">

      <Sidebar/>

      <div className="flex-1 p-10">

        <h1 className="text-2xl font-bold mb-6">
          Bureau de vote
        </h1>

        {/* stats */}

        <div className="grid grid-cols-5 gap-4 mb-8">

          <input
          type="number"
          placeholder="Inscrits"
          className="border p-2 rounded"
          value={registered}
          onChange={e=>
            setStats({
              registered:+e.target.value,
              voters,
              blank,
              nullVotes
            })
          }
          />

          <input
          type="number"
          placeholder="Votants"
          className="border p-2 rounded"
          value={voters}
          onChange={e=>
            setStats({
              registered,
              voters:+e.target.value,
              blank,
              nullVotes
            })
          }
          />

          <input
          type="number"
          placeholder="Blancs"
          className="border p-2 rounded"
          value={blank}
          onChange={e=>
            setStats({
              registered,
              voters,
              blank:+e.target.value,
              nullVotes
            })
          }
          />

          <input
          type="number"
          placeholder="Nuls"
          className="border p-2 rounded"
          value={nullVotes}
          onChange={e=>
            setStats({
              registered,
              voters,
              blank,
              nullVotes:+e.target.value
            })
          }
          />

          <div className="bg-white p-2 rounded shadow">

            Exprimés : {expressed}

          </div>

        </div>

        <div className="grid grid-cols-4 gap-6">

          <div className="col-span-3 grid grid-cols-4 gap-6">

            {candidates.map(c=>(

              <CandidateCard

                key={c.id}

                {...c}

                onAdd={()=>
                  updateVote(c.id,c.votes+1)
                }

                onRemove={()=>
                  updateVote(c.id,Math.max(0,c.votes-1))
                }

              />

            ))}

          </div>

          <Ranking candidates={candidates}/>

        </div>

      </div>

    </div>

  )

}