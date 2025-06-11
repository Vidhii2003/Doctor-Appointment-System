import jwt from 'jsonwebtoken'

const authUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Unauthorized. Please login again.' })
    }

    const token = authHeader.split(' ')[1]
    const token_decode = jwt.verify(token, process.env.JWT_SECRET)

    req.userId = token_decode.id 

    next()
  } catch (error) {
    console.log(error)
    res.status(401).json({ success: false, message: 'Invalid or expired token. Please login again.' })
  }
}

export default authUser
