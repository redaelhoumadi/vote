"use client"

import { useState, useEffect } from "react"

interface Props{
  id:number
  name:string
  photo?:string
  votes:number
  percent:number
  onAdd:()=>void
  onRemove:()=>void
  onSave:(value:number)=>void
}

export default function CandidateCard({
  name,
  photo,
  votes,
  percent,
  onAdd,
  onRemove,
  onSave
}:Props){

  const [value,setValue] = useState(votes)

  useEffect(()=>{
    setValue(votes)
  },[votes])

  return(

    <div className="bg-white rounded-xl shadow p-6 text-center">

      <img
        src={photo || "/candidate.png"}
        className="w-20 h-20 rounded-full mx-auto mb-4 object-cover"
      />

      <h3 className="font-semibold mb-2">
        {name}
      </h3>

      <div className="text-xl text-gray-500 font-bold mb-3 bg-gray-100 rounded-xl">
        {percent.toFixed(2)} %
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
          value={value}
          onChange={(e)=>setValue(Number(e.target.value))}
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

    </div>

  )

}