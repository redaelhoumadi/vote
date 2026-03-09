"use client"

import { useEffect, useState } from "react"

export default function Clock(){

  const [time,setTime] = useState("")

  useEffect(()=>{

    function updateClock(){

      const now = new Date()

      const formatted =
      now.toLocaleTimeString("fr-FR",{
        hour:"2-digit",
        minute:"2-digit",
        second:"2-digit"
      })

      setTime(formatted)

    }

    updateClock()

    const interval = setInterval(updateClock,1000)

    return ()=>clearInterval(interval)

  },[])

  return(

    <div className="bg-white rounded-xl shadow px-4 py-2 text-center">

      <div className="text-sm text-gray-500">
        Heure
      </div>

      <div className="text-xl font-bold">
        {time}
      </div>

    </div>

  )

}