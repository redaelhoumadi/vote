"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { supabase } from "@/lib/supabase"

export default function LoginPage(){

  const router = useRouter()

  const [email,setEmail] = useState("")
  const [password,setPassword] = useState("")
  const [loading,setLoading] = useState(false)
  const [error,setError] = useState("")

  async function handleLogin(e:React.FormEvent){

    e.preventDefault()

    setLoading(true)
    setError("")

    const { data, error } = await supabase.auth.signInWithPassword({

      email,
      password

    })

    if(error){

      setError("Email ou mot de passe incorrect")
      setLoading(false)
      return

    }

    const user = data.user

    if(!user){
      setError("Utilisateur introuvable")
      setLoading(false)
      return
    }

    // récupérer le rôle et bureau de l'utilisateur

    const { data: userData } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single()

    if(!userData){

      setError("Utilisateur non associé à un bureau")
      setLoading(false)
      return

    }

    // redirection selon le rôle

    if(userData.role === "admin"){

      router.push("/dashboard")

    }else{

      router.push(`/bureau?bureau=${userData.bureau_id}`)

    }

  }

  return(

    <div className="min-h-screen flex items-center justify-center bg-gray-200">

      <div className="bg-white p-8 rounded-xl w-[400px]">

        <h1 className="text-xl font-bold mb-6 text-center">
          Connexion
        </h1>

        <form
        onSubmit={handleLogin}
        className="space-y-4"
        >

          <input
          type="email"
          placeholder="Email"
          className="w-full border p-2 rounded"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
          required
          />

          <input
          type="password"
          placeholder="Mot de passe"
          className="w-full border p-2 rounded"
          value={password}
          onChange={(e)=>setPassword(e.target.value)}
          required
          />

          {error && (

            <div className="text-red-500 text-sm">
              {error}
            </div>

          )}

          <button
          className="w-full bg-blue-600 text-white py-2 rounded"
          type="submit"
          disabled={loading}
          >

            {loading ? "Connexion..." : "Se connecter"}

          </button>

        </form>

      </div>

    </div>

  )

}