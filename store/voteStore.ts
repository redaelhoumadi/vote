import { create } from "zustand"

interface VoteStore {

round:number
setRound:(r:number)=>void

candidates:any[]
setCandidates:(c:any[])=>void

stats:any
setStats:(s:any)=>void

updateVote:(id:number,votes:number)=>void

}

export const useVoteStore = create<VoteStore>((set)=>({

round:1,

setRound:(r)=>set({round:r}),

candidates:[],

setCandidates:(c)=>set({candidates:c}),

stats:{},

setStats:(s)=>set({stats:s}),

updateVote:(id,votes)=>
set((state:any)=>({

candidates:state.candidates.map((c:any)=>
c.id===id ? {...c,votes} : c
)

}))

}))