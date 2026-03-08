import Link from "next/link"

export default function Sidebar(){

  return(

    <div className="w-64 bg-blue-900 text-white min-h-screen p-6">

      <h2 className="text-xl font-bold mb-8">
        Evreux Vote
      </h2>

      <div className="flex flex-col gap-4">

        <Link href="/bureau">
          Bureau
        </Link>

        <Link href="/dashboard">
          Dashboard
        </Link>

      </div>

    </div>

  )

}