"use client"

import { useState, useEffect } from "react"

interface Props{
  id:number
  name:string
  votes:number
  percent:number
  onAdd:()=>void
  onRemove:()=>void
  onSave:(value:number)=>void
}

export default function CandidateCard({
  name,
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

    <div className="bg-white p-4 rounded-xl shadow">

      <h3 className="font-semibold mb-2">
        {name}
      </h3>

      <div className="text-sm text-gray-500 mb-4">
        {percent.toFixed(2)} %
      </div>

      <div className="flex items-center gap-2 mb-3">

        <button
          onClick={onRemove}
          className="bg-gray-200 px-3 py-1 rounded"
        >
          -
        </button>

        <input
          type="number"
          value={value}
          onChange={(e)=>setValue(Number(e.target.value))}
          className="w-20 border rounded text-center"
        />

        <button
          onClick={onAdd}
          className="bg-gray-200 px-3 py-1 rounded"
        >
          +
        </button>

      </div>

      <button
        onClick={()=>onSave(value)}
        className="w-full bg-blue-600 text-white py-1 rounded"
      >
        Enregistrer
      </button>

    </div>

  )

}