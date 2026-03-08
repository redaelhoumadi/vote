const API_URL = "http://localhost:3000/api"

export async function getCandidates(){

  const res = await fetch(`${API_URL}/candidates`)

  return res.json()

}

export async function getBureauVotes(bureauId:number){

  const res = await fetch(
    `${API_URL}/bureau-results?bureau=${bureauId}`
  )

  return res.json()

}

export async function updateVote(
  bureau_id:number,
  candidate_id:number,
  votes:number
){

  await fetch(`${API_URL}/update-vote`,{

    method:"POST",

    headers:{
      "Content-Type":"application/json"
    },

    body:JSON.stringify({

      bureau_id,
      candidate_id,
      votes

    })

  })

}

export async function getDashboard(){

  const res = await fetch(`${API_URL}/dashboard`)

  return res.json()

}