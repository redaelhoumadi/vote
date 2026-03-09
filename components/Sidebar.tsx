"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function Sidebar(){

  const [bureaux,setBureaux] = useState<any[]>([])

  useEffect(()=>{

    async function loadBureaux(){

      const { data } = await supabase
        .from("bureaux")
        .select("*")
        .order("id")

      if(data){
        setBureaux(data)
      }

    }

    loadBureaux()

  },[])

  return(

    <div className="w-64 bg-blue-900 text-white min-h-screen p-6 overflow-y-auto">

      <h2 className="text-xl font-bold mb-8">
        Evreux Vote
      </h2>

      <div className="flex flex-col gap-4 mb-8">

        <Link href="/dashboard">
          Dashboard
        </Link>

      </div>

      <div>

        <h3 className="text-sm text-blue-200 mb-4">
          Bureaux
        </h3>

        <div className="flex flex-col gap-2">

          {bureaux.map((b)=>(
            <Link
              key={b.id}
              href={`/bureau?bureau=${b.id}`}
              className="text-sm hover:text-blue-300"
            >
              {b.name}
            </Link>
          ))}

        </div>

      </div>

    </div>

  )

}