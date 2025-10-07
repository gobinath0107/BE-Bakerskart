const jwt = require('jsonwebtoken')

const auth = async (req, res, next) => {
  // check header
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer')) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  const token = authHeader.split(' ')[1]

  
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    const adminRoles = ["superadmin", "manager", "staff", 'admin']
    const isAdmin = adminRoles.includes(payload.role)
    // attach the user to the job routes
    req.user = { userId: isAdmin ? payload.adminId : payload.userId, name: payload.username, email: payload.email, mobile: payload.mobile, company: payload.company, address: payload.address, city: payload.city, state: payload.state, status: payload.status, role: isAdmin ? 'admin' : 'user' }
    next()
  } catch (error) {
    res.status(401).json({ error: 'Not authorized to access this route' })
  }
}

module.exports = auth
