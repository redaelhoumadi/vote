useEffect(()=>{

let currentUser:any = null

async function init(){

const { data:{user} } = await supabase.auth.getUser()

if(!user){
window.location.href="/login"
return
}

currentUser = user

await loadData(user)
await ping(user)
await checkAccess(user)

}

/* ---------------- charger données ---------------- */

async function loadData(user:any){

setLoading(true)

const { data:userData } = await supabase
.from("users")
.select("*")
.eq("id",user.id)
.single()

if(!userData){
window.location.href="/login"
return
}

if(!userData.access_enabled){
window.location.href="/blocked"
return
}

if(userData.role !== "admin" && userData.bureau_id !== bureauId){
showToast("error","Accès interdit à ce bureau")
window.location.href=`/bureau/${userData.bureau_id}`
return
}

/* bureau */

const { data:bureauData } = await supabase
.from("bureaux")
.select("*")
.eq("id",bureauId)
.single()

if(bureauData){
setBureauName(bureauData.name)
}

/* candidats */

const { data:candidatesData } = await supabase
.from("candidates")
.select("*")

const { data:votesData } = await supabase
.from("votes")
.select("*")
.eq("bureau_id",bureauId)

const { data:statsData } = await supabase
.from("bureau_results")
.select("*")
.eq("bureau_id",bureauId)
.single()

if(statsData){

setStats({
registered:statsData.registered,
voters:statsData.voters,
blank:statsData.blank,
nullVotes:statsData.null_votes
})

setRegisteredInput(statsData.registered)
setVotersInput(statsData.voters)
setBlankInput(statsData.blank)
setNullInput(statsData.null_votes)

}

if(candidatesData){

const expressedVotes = statsData?.expressed || 0

const formatted = candidatesData.map((c:any)=>{

const vote = votesData?.find(
(v:any)=>v.candidate_id === c.id
)

const votes = vote ? vote.votes : 0

const percent =
expressedVotes > 0
? (votes / expressedVotes) * 100
: 0

return{
id:c.id,
name:c.name,
photo:c.photo,
votes,
percent
}

})

setCandidates(formatted)

}

setLoading(false)

}

/* ---------------- ping ---------------- */

async function ping(user:any){

if(!user) return

await supabase
.from("users")
.update({
last_seen:new Date().toISOString()
})
.eq("id",user.id)

}

/* ---------------- vérifier blocage ---------------- */

async function checkAccess(user:any){

if(!user) return

const { data } = await supabase
.from("users")
.select("access_enabled")
.eq("id",user.id)
.single()

if(!data?.access_enabled){
window.location.href="/blocked"
}

}

/* ---------------- lancement ---------------- */

init()

const pingInterval = setInterval(()=>{
if(currentUser) ping(currentUser)
},10000)

const accessInterval = setInterval(()=>{
if(currentUser) checkAccess(currentUser)
},5000)

return ()=>{
clearInterval(pingInterval)
clearInterval(accessInterval)
}

},[bureauId])
