"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import Image from "next/image"
import Logo from "@/public/LOGO-CARRE-BLANC 1.png"

export default function Sidebar(){

const [bureaux,setBureaux] = useState<any[]>([])
const [role,setRole] = useState<string | null>(null)
const [open,setOpen] = useState(false)

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

if(userData.role === "admin"){

const { data } = await supabase
.from("bureaux")
.select("*")
.order("id")

if(data) setBureaux(data)

}else{

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
window.location.href="/login"

}

return(

<>

{/* bouton menu mobile */}

<button
onClick={()=>setOpen(!open)}
className="fixed top-4 right-4 z-50 bg-blue-900 text-white p-2 shadow rounded-md md:hidden"
>
☰
</button>

{/* overlay mobile */}

{open && (
<div
onClick={()=>setOpen(false)}
className="fixed inset-0 bg-black/40 z-40 md:hidden"
/>
)}

{/* sidebar */}

<div className={`
fixed md:relative
top-0 left-0
w-64
bg-blue-900 text-white
transform transition-transform duration-300
z-50
overflow-y-auto
${open ? "translate-x-0" : "-translate-x-full"}
md:translate-x-0
`}>

<div className="flex flex-col xl:h-full h-screen">

{/* logo */}

<div className="">

<Image src={Logo} alt="logo" className="p-4"/>

{role === "admin" && (
<div className="flex flex-col gap-4 p-2">

<Link
href="/dashboard"
onClick={()=>setOpen(false)}
className="text-lg hover:bg-blue-600 hover:rounded-sm p-2"
>

📊 Dashboard

</Link>

</div>
)}

<div className="flex flex-col gap-4 p-2">

<Link
href="/bureaux"
onClick={()=>setOpen(false)}
className="text-lg hover:bg-blue-600 hover:rounded-sm p-2"
>

🗳️ Bureaux

</Link>

</div>

{/* liste bureaux */}

<div className="flex flex-col gap-1 pl-4">

{bureaux.map((b)=>(

<Link
key={b.id}
href={`/bureau/${b.id}`}
onClick={()=>setOpen(false)}
className="text-xs hover:text-blue-100 lowercase hover:bg-blue-600 p-1 rounded-sm"
>

{b.name}

</Link>

))}

</div>

</div>

{/* logout */}

<div className="mt-auto p-4">

<button
onClick={handleLogout}
className="bg-red-500 hover:bg-red-600 w-full text-white py-2 rounded cursor-pointer"
>

Déconnexion

</button>

</div>

</div>

</div>

</>

)

}