
"use client"

interface Props{
type:"success"|"error"|"warning"
message:string
}

export default function Toast({type,message}:Props){

const colors = {
success:"bg-green-500",
error:"bg-red-500",
warning:"bg-orange-500"
}

return(

<div className={`
fixed top-6 right-6 z-50
text-white px-5 py-3 rounded-lg shadow-lg
animate-slide
${colors[type]}
`}>

{message}

</div>

)

}