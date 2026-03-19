"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import Image from "next/image"
import Logo from "@/public/LOGO-CARRE-BLANC 1.png"

/* Plages fixes des groupes */
const GROUPS = [
  { label: "De 101 à 114", min: 1,  max: 14 },
  { label: "De 201 à 212", min: 15, max: 26 },
  { label: "De 301 à 306", min: 27, max: 32 },
]

export default function Sidebar() {
  const [bureaux, setBureaux] = useState<any[]>([])
  const [role, setRole] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [openGroups, setOpenGroups] = useState<any>({
    0: true,
    1: true,
    2: true,
  })

  function toggleGroup(index: number) {
    setOpenGroups((prev: any) => ({
      ...prev,
      [index]: !prev[index],
    }))
  }

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: userData } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single()

      if (!userData) return

      setRole(userData.role)

      if (userData.role === "admin") {
        const { data } = await supabase
          .from("bureaux")
          .select("*")
          .order("id")
        if (data) setBureaux(data)
      } else {
        const { data } = await supabase
          .from("bureaux")
          .select("*")
          .eq("id", userData.bureau_id)
        if (data) setBureaux(data)
      }
    }

    loadUser()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = "/login"
  }

  return (
    <>
      {/* Bouton menu mobile */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed top-4 right-4 z-50 bg-blue-900 text-white p-2 shadow rounded-md md:hidden"
      >
        ☰
      </button>

      {/* Overlay mobile */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed md:relative
          top-0 left-0
          w-64
          bg-blue-900 text-white
          transform transition-transform duration-300
          z-50
          overflow-y-auto
          ${open ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
      >
        <div className="flex flex-col xl:h-full h-screen">

          {/* Logo */}
          <div>
            <Image src={Logo} alt="logo" className="p-4" />

            {role === "admin" && (
              <div className="flex flex-col gap-4 p-2">
                <Link
                  href="/dashboard"
                  onClick={() => setOpen(false)}
                  className="text-lg hover:bg-blue-600 hover:rounded-sm p-2"
                >
                  📊 Dashboard
                </Link>
              </div>
            )}

            <div className="flex flex-col gap-4 p-2">
              <Link
                href="/bureaux"
                onClick={() => setOpen(false)}
                className="text-lg hover:bg-blue-600 hover:rounded-sm p-2"
              >
                🗳️ Bureaux
              </Link>
            </div>
          </div>

          {/* Liste groupée par plages fixes */}
          <div className="flex flex-col pl-2 pr-1 pb-4 px-4">
            {GROUPS.map((group, index) => {

              const bureauxInGroup = bureaux.filter(
                (b) => b.id >= group.min && b.id <= group.max
              )

              if (bureauxInGroup.length === 0) return null

              return (
                <div key={index} className="">

                  {/* Header du groupe */}
                  <button
                    onClick={() => toggleGroup(index)}
                    className="cursor-pointer p-1 w-full text-left text-sm font-bold text-yellow-300 bg-blue-800 hover:bg-blue-700 rounded flex justify-between items-center"
                  >
                    <span>{group.label}</span>
                    <span className="text-xs">
                      {openGroups[index] ? "▼" : "▶"}
                    </span>
                  </button>

                  {/* Contenu du groupe */}
                  {openGroups[index] && (
                    <div className="flex flex-col mt-0.5 border-l-2 border-blue-600 ml-2">
                      {bureauxInGroup.map((b: any) => (
                        <Link
                          key={b.id}
                          href={`/bureau/${b.id}`}
                          onClick={() => setOpen(false)}
                          className="text-xs py-1 hover:bg-blue-700 hover:text-white text-blue-100 rounded-sm lowercase transition-colors"
                        >
                          {b.name}
                        </Link>
                      ))}
                    </div>
                  )}

                </div>
              )
            })}
          </div>

          {/* Logout */}
          <div className="mt-auto p-4">
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 w-full text-white py-2 rounded cursor-pointer"
            >
              Déconnexion
            </button>
          </div>

        </div>
      </div>
    </>
  )
}