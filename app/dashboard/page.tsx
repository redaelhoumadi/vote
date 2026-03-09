"use client"

import { useEffect, useState } from "react"
import Sidebar from "@/components/Sidebar"
import { supabase } from "@/lib/supabase"

export default function DashboardPage(){

  const [results,setResults] = useState<any>({})

  useEffect(()=>{

    async function load(){

      // 🔐 vérifier utilisateur connecté
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

      // 🔐 seuls les admins peuvent accéder au dashboard
      if(userData.role !== "admin"){

        window.location.href = `/bureau/${userData.bureau_id}`
        return

      }

      // charger les résultats
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