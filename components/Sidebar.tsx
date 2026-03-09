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

    <div className="w-64 bg-blue-900 text-white min-h-screen p-6 flex flex-col justify-between">

      <div>

        <h2 className="text-xl font-bold mb-8">
          Evreux Vote
        </h2>

        {role === "admin" && (
          <div className="flex flex-col gap-4 mb-8">
            <Link href="/dashboard">
              Dashboard
            </Link>
          </div>
        )}

        <div>

          <h3 className="text-sm text-blue-200 mb-4">
            Bureaux
          </h3>

          <div className="flex flex-col gap-2">

            {bureaux.map((b)=>(
              <Link
                key={b.id}
                href={`/bureau/${b.id}`}
                className="text-sm hover:text-blue-300"
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
        className="mt-8 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded cursor-pointer"
      >
        Déconnexion
      </button>

    </div>

  )

}