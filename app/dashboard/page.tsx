"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function Dashboard(){

  const [results,setResults] = useState<any>({})

  useEffect(()=>{

    async function load(){

      const { data } = await supabase
        .from("votes")
        .select(`
          votes,
          candidate_id,
          candidates(name)
        `)

      const totals:any = {}

      data?.forEach((v:any)=>{

        const name = v.candidates.name

        if(!totals[name]) totals[name] = 0

        totals[name] += v.votes

      })

      setResults(totals)

    }

    load()

    const interval = setInterval(load,2000)

    return ()=>clearInterval(interval)

  },[])

  return(

    <div className="p-10">

      <h1 className="text-2xl font-bold mb-8">
        Dashboard Élections
      </h1>

      <div className="grid grid-cols-4 gap-6">

        {Object.entries(results).map(([name,votes])=>(
          
          <div
          key={name}
          className="bg-white p-6 rounded-xl shadow"
          >

            <div className="font-semibold">
              {name}
            </div>

            <div className="text-xl mt-2">
              {votes as number}
            </div>

          </div>

        ))}

      </div>

    </div>

  )

}