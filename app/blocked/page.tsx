"use client"

import { useEffect } from "react"
import { supabase } from "@/lib/supabase"

export default function BlockedPage(){

useEffect(()=>{

async function checkAccess(){

const { data:{user} } = await supabase.auth.getUser()

if(!user) return

const { data:userData } = await supabase
.from("users")
.select("access_enabled, bureau_id")
.eq("id",user.id)
.single()

if(userData?.access_enabled){

window.location.href=`/bureau/${userData.bureau_id}`

}

}

const interval = setInterval(checkAccess,3000)

return ()=>clearInterval(interval)

},[])

return(

<div className="flex items-center justify-center min-h-screen bg-gray-100">

<div className="bg-white p-10 rounded-xl shadow text-center">

<h1 className="text-3xl font-bold text-blue-600 mb-4">
🛠️ Application en maintenance
</h1>

<p className="text-gray-600">

</p>

</div>

</div>

)

}