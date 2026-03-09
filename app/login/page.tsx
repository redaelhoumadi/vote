"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"

export default function LoginPage(){

  const [email,setEmail] = useState("")
  const [password,setPassword] = useState("")
  const [loading,setLoading] = useState(false)
  const [error,setError] = useState("")

  async function handleLogin(e:React.FormEvent){

    e.preventDefault()
    setLoading(true)
    setError("")

    try{

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if(error){
        setError(error.message)
        setLoading(false)
        return
      }

      const user = data.user

      if(!user){
        setError("Utilisateur non trouvé")
        setLoading(false)
        return
      }

      const { data:userData, error:userError } = await supabase
        .from("users")
        .select("*")
        .eq("id",user.id)
        .single()

      if(userError){
        setError(userError.message)
        setLoading(false)
        return
      }

      if(!userData){
        setError("Utilisateur non associé")
        setLoading(false)
        return
      }

      // attendre que la session soit enregistrée
      setTimeout(()=>{

        if(userData.role === "admin"){
          window.location.href = "/dashboard"
          return
        }

        if(userData.bureau_id){
          window.location.href = `/bureau/${userData.bureau_id}`
          return
        }

      },200)

    }catch(err:any){

      setError("Erreur de connexion")
      setLoading(false)

    }

  }

  return(

    <div className="min-h-screen flex items-center justify-center bg-gray-200">

      <div className="bg-white p-8 rounded-xl w-[400px] shadow">

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
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
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