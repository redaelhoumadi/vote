"use client"

import Image from "next/image"
import banier from "@/public/banniere.jpg"
import { supabase } from "@/lib/supabase"

export default function BlockedPage(){

async function logout(){

await supabase.auth.signOut()
window.location.href="/login"

}

return(

<div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">

<div className="bg-white rounded-xl shadow-lg p-10 max-w-xl text-center">

<h1 className="text-3xl font-bold text-red-600 mb-4">
🚫 Accès bloqué
</h1>

<p className="text-gray-600 mb-6">
Votre accès à ce bureau a été suspendu par l'administrateur.
</p>

<p className="text-gray-500 mb-8 text-sm">
Veuillez contacter l'administration si vous pensez qu'il s'agit d'une erreur.
</p>

<button
onClick={logout}
className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
>
Retour à la connexion
</button>

</div>

<div className="max-w-3xl mt-10">
<Image
src={banier}
alt="elections"
className="rounded-xl shadow"
/>
</div>

</div>

)

}