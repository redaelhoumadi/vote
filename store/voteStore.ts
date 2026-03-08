import { create } from "zustand"
import { Candidate } from "@/types/candidate"
import { supabase } from "@/lib/supabase"

interface VoteState {

  candidates: Candidate[]

  registered:number
  voters:number
  blank:number
  nullVotes:number

  expressed:number

  setCandidates:(c:Candidate[])=>void

  updateVote:(id:number,votes:number)=>void

  setStats:(stats:{
    registered:number
    voters:number
    blank:number
    nullVotes:number
  })=>void

}

export const useVoteStore = create<VoteState>((set,get)=>({

  candidates:[],

  registered:0,
  voters:0,
  blank:0,
  nullVotes:0,

  expressed:0,

  setCandidates:(candidates)=>{

    set({candidates})

  },

  setStats:(stats)=>{

    const expressed =
      stats.voters -
      stats.blank -
      stats.nullVotes

    set({
      ...stats,
      expressed
    })

  },

  updateVote: async (id,votes)=>{

  const bureauId = 101

  await supabase
  .from("votes")
  .upsert({

    bureau_id:bureauId,
    candidate_id:id,
    votes

  })

  const updated = get().candidates.map(c=>
    c.id===id
    ? {...c,votes}
    : c
  )

  const total =
  updated.reduce((a,c)=>a+c.votes,0)

  const withPercent =
  updated.map(c=>({

    ...c,
    percent: total===0 ? 0 : (c.votes/total)*100

  }))

  set({candidates:withPercent})

}

}))