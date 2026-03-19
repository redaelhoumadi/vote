"use client"

import { useState, useEffect } from "react"

interface Props{
id:number
name:string
photo?:string
votes:number
percent:number

/* 🔥 NEW */
firstRoundVotes?:number
firstRoundPercent?:number

onAdd:()=>void
onRemove:()=>void
onSave:(value:number)=>void
}

export default function CandidateCard({
name,
photo,
votes,
percent,
firstRoundVotes,
firstRoundPercent,
onAdd,
onRemove,
onSave
}:Props){

const [value,setValue] = useState(votes)

useEffect(()=>{
setValue(votes)
},[votes])

function handleChange(v:string){
const num = Number(v)
if(isNaN(num) || num < 0){
setValue(0)
}else{
setValue(num)
}
}

return(

<div className="bg-white rounded-xl shadow p-6 text-center">

<img
src={photo || "/candidate.png"}
className="w-20 h-20 rounded-full mx-auto mb-4 object-cover"
/>

<h3 className="font-semibold mb-2">
{name}
</h3>

{/* 🔥 RESULTATS ACTUELS */}

<div className="text-xl text-gray-500 font-bold mb-1 bg-gray-100 mb-3 rounded-xl">
{Number(percent || 0).toFixed(2)} %
</div>

<div className="flex items-center justify-center gap-2 mb-3">

<button
onClick={onRemove}
className="text-red-500 text-lg bg-red-100 px-7 py-1 rounded cursor-pointer"
>
-
</button>

<input
type="number"
min="0"
value={value}
onChange={(e)=>handleChange(e.target.value)}
className="w-20 rounded text-center font-bold bg-gray-100 text-xl py-1 text-gray-600"
/>

<button
onClick={onAdd}
className="text-green-500 text-lg bg-green-100 px-7 py-1 rounded cursor-pointer"
>
+
</button>

</div>

<button
onClick={()=>onSave(value)}
className="w-full bg-blue-600 text-white py-1 rounded hover:bg-blue-700 cursor-pointer"
>
Enregistrer
</button>


{/* 🔥 RESULTATS 1ER TOUR (AFFICHÉ UNIQUEMENT SI EXISTE) */}

{firstRoundVotes !== undefined && (

<div className="bg-blue-50 rounded-lg p-2 mt-4">

<h2 className="text-lg text-black">
Resultat au 1er tour
</h2>
<div className="flex justify-center items-center gap-6">
  <div className="text-md font-semibold text-purple-700">
{firstRoundVotes} votes
</div>
<div className="text-sm text-blue-700 font-bold">
({Number(firstRoundPercent || 0).toFixed(2)} %)
</div>
</div>




</div>

)}
</div>

)

}