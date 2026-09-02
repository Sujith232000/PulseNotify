const request = []
for (let i = 0; i< 5; i++){
    request.push(fetch('http://localhost:3000/preference/test-id-123'))
}
const results = await Promise.all(request)

export {}