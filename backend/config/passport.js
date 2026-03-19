const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

module.exports = function(passport) {
  
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  // ========== ONLY GOOGLE STRATEGY ==========
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    console.log('✅ Configuring Google Strategy');
    
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: 'http://localhost:5000/api/auth/google/callback'
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        console.log('📧 Google email:', email);
        
        let user = await User.findOne({ email });
        
        if (user) {
          console.log('👤 Existing user found');
          if (!user.googleId) {
            user.googleId = profile.id;
            user.isVerified = true;
            await user.save();
          }
          return done(null, user);
        } else {
          console.log('👤 Creating new user from Google');
          const newUser = new User({
            name: profile.displayName,
            email: email,
            googleId: profile.id,
            isVerified: true
          });
          await newUser.save();
          console.log('✅ New user created:', newUser.email);
          return done(null, newUser);
        }
      } catch (error) {
        console.error('❌ Google strategy error:', error);
        return done(error, null);
      }
    }));
  } else {
    console.log('⚠️ Google credentials missing - skipping Google strategy');
  }

  console.log('✅ Passport configured with Google strategy only');
};