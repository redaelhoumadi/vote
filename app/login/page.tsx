"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import Image from "next/image"
import LogoLogin from "@/public/logo_carre.png"

export default function LoginPage(){

  const [email,setEmail] = useState("")
  const [password,setPassword] = useState("")
  const [loading,setLoading] = useState(false)
  const [error,setError] = useState("")

  // ✅ vérifier si déjà connecté
  useEffect(()=>{

    async function checkSession(){

      const { data } = await supabase.auth.getSession()

      const session = data.session

      if(!session) return

      const user = session.user

      const { data:userData } = await supabase
        .from("users")
        .select("*")
        .eq("id",user.id)
        .single()

      if(!userData) return

      if(userData.role === "admin"){
        window.location.href = "/dashboard"
        return
      }

      if(userData.bureau_id){
        window.location.href = `/bureau/${userData.bureau_id}`
        return
      }

    }

    checkSession()

  },[])


  // ✅ fonction login
  async function handleLogin(e:React.FormEvent){

    e.preventDefault()
    setLoading(true)
    setError("")

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

    const { data:userData } = await supabase
      .from("users")
      .select("*")
      .eq("id",user.id)
      .single()

    if(!userData){
      setError("Utilisateur non associé")
      setLoading(false)
      return
    }

    if(userData.role === "admin"){
      window.location.href = "/dashboard"
      return
    }

    if(userData.bureau_id){
      window.location.href = `/bureau/${userData.bureau_id}`
      return
    }

    setLoading(false)

  }

  return(

    <div className="min-h-screen flex items-center justify-center bg-gray-100">

      <div className="bg-white p-20 rounded-xl w-[500px] shadow">

        <Image src={LogoLogin} alt="logologin" />

        <h2 className="text-md font-meduim mt-6 mb-4 text-center">
          Merci d'entrer vos informations de connexion
        </h2>

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