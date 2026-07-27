import app from './app.js'
import { config } from './config/config.js'

app.listen(config.server.port,() => {
    console.log(`server running on port ${config.server.port}`)
})
