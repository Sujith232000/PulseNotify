import type {Request, Response, NextFunction} from 'express'
export function authenticate (req: Request, res: Response, next: NextFunction){
       const auth = req.headers.authorization
       if(auth){
        const parts = auth.split(' ')
        const token = parts[1]
        const validkeys = process.env.API_KEYS?.split(',')
        if((parts.length!== 2 || parts[0]!== 'Bearer' || !token) || !validkeys?.includes(token) ){
            return res.status(401).json({message:"Invalid authentication token"})
        }
        req.token = token 
        next()
    }
            
       else{
         return res.status(401).json({message:"No header provided"})
       }
}