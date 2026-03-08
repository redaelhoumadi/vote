interface Props{

  title:string
  value:number

}

export default function StatsCard({title,value}:Props){

  return(

    <div className="bg-white rounded-xl shadow p-6">

      <div className="text-gray-500">
        {title}
      </div>

      <div className="text-2xl font-bold">
        {value}
      </div>

    </div>

  )

}