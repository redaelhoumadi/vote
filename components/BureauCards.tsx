"use client"

export default function BureauCards({ bureaux, colors }:any){

return(

<div className="mb-10">


<div className="grid grid-cols-4 gap-6">

{bureaux.map((b:any)=>{

const voteRate =
b.registered > 0
? ((b.voters / b.registered)*100).toFixed(2)
: "0"

return(

<div
key={`bureau-${b.bureau_id}`}
className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition"
>

{/* HEADER */}
<div className="flex justify-between items-center mb-4">

<div className="font-bold text-sm">
🏫 {b.bureaux?.name}
</div>

</div>

{/* TAUX VOTE */}
<div className="mb-1 flex items-center gap-1">

<div className="text-sm text-gray-500">
Taux de vote :
</div>

<div className="text-sm font-bold text-gray-800">
{voteRate} %
</div>

</div>

<div className="w-full mb-3 bg-gray-200 rounded h-2">

<div
className="bg-blue-600 h-2 rounded"
style={{width:`${voteRate}%`}}
/>

</div>

{/* TOP 3 */}
<div className="mb-4">

<div className="text-sm font-semibold mb-2">
🥇 Top candidats
</div>

{b.top3?.map((c:any,i:number)=>{

const percent =
b.expressed > 0
? ((c[1] / b.expressed)*100).toFixed(1)
: "0"

return(

<div
key={`bureau-${b.bureau_id}-candidate-${c[0]}`}
className="flex justify-between text-sm"
>

<div>
{i+1}. {c[0]}
</div>

<div className="font-semibold">
{c[1]} — {percent}%
</div>

</div>

)

})}

</div>

{/* GAGNANT */}
<div className="flex justify-between items-center">

<div className="text-sm text-gray-500">
🏆 Gagnant
</div>

<span className={`px-3 py-1 rounded text-sm font-semibold ${colors[b.winner] || "bg-gray-100"}`}>
{b.winner}
</span>

</div>

</div>

)

})}

</div>

</div>

)

}