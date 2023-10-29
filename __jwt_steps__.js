/**
 * install jsonwebtoken
 * jwt.sing(payload, secret, {expiresIn: })
 * token to client
 * 
 */



/**
 * How to store token in the client side
 * 1. memory --> ok type (react state)
 * 2. local storage --> ok type (XSS -> Cross Site Scripting)
 * 3. cookies --> http only
 */



/**
 * 1. set cookies with http only. for development -> secure: false
 * 
 * 2. cors settings
 * app.use(cors({
    origin: ['http://localhost:5173/'],
    credentials: true
}))
 * 
 * 3. set cookie to client side with credential using axios setting
 * in axios set {withCredentials: true} as last parameter
 */


/**
 * 1. to send cookies from the client make sure you added { withCredentials: true } for the api call using axios
 * 2. use cookies parser as middleware in server side
 */