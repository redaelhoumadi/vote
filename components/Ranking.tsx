import { Candidate } from "@/types/candidate"

interface Props{

  candidates:Candidate[]

}

export default function Ranking({candidates}:Props){

  const sorted =
  [...candidates]
  .sort((a,b)=>b.votes-a.votes)

  return(

    <div className="bg-white p-6 rounded-xl shadow">

      <h2 className="font-bold mb-4">
        Classement
      </h2>

      {sorted.map((c,i)=>(

        <div
        key={c.id}
        className="flex justify-between py-2"
        >

          <div>
            {i+1}. {c.name}
          </div>

          <div>
            {c.votes}
          </div>

        </div>

      ))}

    </div>

  )

}