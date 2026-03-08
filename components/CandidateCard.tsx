"use client"

interface Props{

  id:number
  name:string
  votes:number
  percent:number

  onAdd:()=>void
  onRemove:()=>void

}

export default function CandidateCard({

  name,
  votes,
  percent,
  onAdd,
  onRemove

}:Props){

  return(

    <div className="bg-white rounded-xl p-6 shadow flex flex-col items-center gap-3">

      <div className="font-semibold text-center">
        {name}
      </div>

      <div className="flex items-center gap-4">

        <button
        onClick={onRemove}
        className="text-red-500 text-xl"
        >
          -
        </button>

        <div className="bg-gray-100 px-4 py-1 rounded">
          {votes}
        </div>

        <button
        onClick={onAdd}
        className="text-green-500 text-xl"
        >
          +
        </button>

      </div>

      <div className="text-lg font-bold">

        {percent.toFixed(2)} %

      </div>

    </div>

  )

}