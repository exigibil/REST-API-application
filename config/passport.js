const passportJWT = require("passport-jwt");
const User = require("../models/Users");
require("dotenv").config();

const ExtractJWT = passportJWT.ExtractJwt;
const Strategy = passportJWT.Strategy;

const params = {
  secretOrKey: process.env.JWT_SECRET,
  jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
};

module.exports = (passport) => {
  passport.use(
    new Strategy(params, async (payload, done) => {
      try {
        const user = await User.findById(payload.id);
        if (user) {
          return done(null, user);
        } else {
          return done(null, false, { message: "User not found" });
        }
      } catch (err) {
        console.error("Passport JWT strategy error:", err.message);
        return done(err, false);
      }
    })
  );
};
