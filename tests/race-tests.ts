const request = []
for (let i = 0; i < 110; i++) {
    const uuid = crypto.randomUUID()
    request.push(fetch('http://localhost:3000/notification', {
             method: "POST",
             headers: {
                        'Authorization': 'Bearer key_dev_local_123',
                        'Content-Type': 'application/json',
                        'idempotency-Key': uuid
              }, 
              body: JSON.stringify({

                                    "userId": 1,
                                    "receiverId": "test-receiver-001",
                                    "message": "hello",
                                    "channel": "email",
                                    "type": "like",
                                    "priority": "batching"
                 })
         }))
}
const result = await Promise.all(request)

const statusCounts: Record<number, number> = {}
for (const r of result) {
  statusCounts[r.status] = (statusCounts[r.status] || 0) + 1
}
console.log(statusCounts)

let successCount = 0
let rejectCount = 0 
for(let i=0; i<110; i++){
    if(result[i].status === 202){
        successCount++
    }
    if(result[i].status === 429){
        rejectCount++
    }
}

if(successCount <=100 &&  successCount>= 95) {
    console.log(`success your rate limit passed ${successCount}`)
}

console.log(rejectCount)


//test b

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

console.log("waiting for tokens to refill...")
await sleep(3000)

const refillCheck = await fetch('http://localhost:3000/notification', {
    method: "POST",
    headers: {
        'Authorization': 'Bearer key_dev_local_123',
        'Content-Type': 'application/json',
        'idempotency-Key': crypto.randomUUID()
    },
    body: JSON.stringify({
        "userId": 1,
        "receiverId": "test-receiver-001",
        "message": "hello",
        "channel": "email",
        "type": "like",
        "priority": "batching"
    })
})

console.log(`refill test status: ${refillCheck.status}`)
if (refillCheck.status === 202) {
    console.log("refill confirmed — token bucket is working correctly")
} else {
    console.log("refill check unexpected — got", refillCheck.status)
}

export{}
