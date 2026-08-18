const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let token;

  /*
   * ============================================================
   * BEARER TOKEN
   * ============================================================
   */

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.query.token) {

  /*
   * ============================================================
   * QUERY TOKEN
   * ============================================================
   *
   * Kept for compatibility with existing Libro functionality.
   */
    token = req.query.token;
  }

  /*
   * ============================================================
   * NO TOKEN
   * ============================================================
   */

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorized, no token.",
    });
  }

  try {
    /*
     * ==========================================================
     * VERIFY JWT
     * ==========================================================
     */

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    /*
     * ==========================================================
     * FIND CURRENT USER
     * ==========================================================
     *
     * Always read the current user from MongoDB rather than
     * trusting role/account-status information stored in the JWT.
     */

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User account no longer exists.",
      });
    }

    /*
     * ==========================================================
     * ACCOUNT STATUS
     * ==========================================================
     */

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "This account is inactive.",
      });
    }

    /*
     * ==========================================================
     * AUTHENTICATED USER
     * ==========================================================
     */

    req.user = user;

    return next();
  } catch (error) {
    console.error("Authentication error:", error.message);

    return res.status(401).json({
      success: false,
      message: "Not authorized, token failed.",
    });
  }
};

/*
 * ==============================================================
 * ROLE AUTHORIZATION
 * ==============================================================
 *
 * Example:
 *
 * authorize("librarian")
 *
 * or:
 *
 * authorize("student")
 *
 */

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized.",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role ${req.user.role} is not authorized to access this route.`,
      });
    }

    return next();
  };
};

module.exports = {
  protect,
  authorize,
};
