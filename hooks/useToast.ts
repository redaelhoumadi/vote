"use client"

import { useState } from "react"

export function useToast(){

const [toast,setToast] = useState<{
type:"success"|"error"|"warning"
message:string
}|null>(null)

function showToast(type:"success"|"error"|"warning",message:string){

setToast({type,message})

setTimeout(()=>{

setToast(null)

},3000)

}

return {toast,showToast}

}