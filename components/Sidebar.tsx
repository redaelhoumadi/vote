"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function Sidebar(){

  const [bureaux,setBureaux] = useState<any[]>([])
  const [role,setRole] = useState<string | null>(null)

  useEffect(()=>{

    async function loadUser(){

      const { data:{user} } = await supabase.auth.getUser()

      if(!user) return

      const { data:userData } = await supabase
        .from("users")
        .select("*")
        .eq("id",user.id)
        .single()

      if(!userData) return

      setRole(userData.role)

      // ADMIN → tous les bureaux
      if(userData.role === "admin"){

        const { data } = await supabase
          .from("bureaux")
          .select("*")
          .order("id")

        if(data) setBureaux(data)

      }

      // AGENT → seulement son bureau
      else{

        const { data } = await supabase
          .from("bureaux")
          .select("*")
          .eq("id",userData.bureau_id)

        if(data) setBureaux(data)

      }

    }

    loadUser()

  },[])


  async function handleLogout(){

    await supabase.auth.signOut()

    window.location.href = "/login"

  }


  return(

    <div className="w-64 bg-blue-900 text-white min-h-screen flex flex-col justify-between">

      <div className="p-1">

        <h2 className="text-xl font-bold mb-4 p-4">
          Evreux en mouvement
        </h2>

        {role === "admin" && (
          <div className="flex flex-col gap-4 p-2">
            <Link href="/dashboard" className="text-lg hover:bg-blue-600 hover:rounded-sm">
              📊 Dashboard
            </Link>
          </div>
        )}

        <div className="p-2">

          <h2 className="text-lg mb-4">
            🗳️ Bureaux
          </h2>

          <div className="flex flex-col gap-1">

            {bureaux.map((b)=>(
              <Link
                key={b.id}
                href={`/bureau/${b.id}`}
                className="text-xs hover:text-blue-100 lowercase hover:bg-blue-600 p-1 hover:rounded-sm"
              >
                {b.name}
              </Link>
            ))}

          </div>

        </div>

      </div>


      {/* bouton logout */}

      <button
        onClick={handleLogout}
        className="mt-4 bg-red-500 hover:bg-red-600 text-white py-2 px-4 cursor-pointer"
      >
        Déconnexion
      </button>

    </div>

  )

}