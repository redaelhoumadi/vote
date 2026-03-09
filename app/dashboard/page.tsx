"use client"

import { useEffect, useState } from "react"
import Sidebar from "@/components/Sidebar"
import { supabase } from "@/lib/supabase"

export default function DashboardPage(){

  const [results,setResults] = useState<any>({})

  useEffect(()=>{

    async function load(){

      const {data} = await supabase
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

  },[])

  return(

    <div className="flex">

      <Sidebar/>

      <div className="flex-1 p-10">

        <h1 className="text-2xl font-bold mb-6">
          Dashboard Élections
        </h1>

        <div className="bg-white p-6 rounded-xl shadow">

          {Object.entries(results).map(([name,votes])=>(
            <div
              key={name}
              className="flex justify-between border-b py-2"
            >

              <div>
                {name}
              </div>

              <div className="font-semibold">
                {votes as number}
              </div>

            </div>
          ))}

        </div>

      </div>

    </div>

  )

}