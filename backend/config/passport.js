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

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    console.log('✅ Configuring Google Strategy');
    
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: 'http://localhost:5000/api/auth/google/callback',
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        console.log('📧 Google email:', email);
        
        // Check if user exists
        let user = await User.findOne({ email });
        
        if (user) {
          console.log('👤 Existing user found');
          // Update googleId if not set
          if (!user.googleId) {
            user.googleId = profile.id;
            user.isVerified = true;
            await user.save();
            console.log('✅ Updated user with Google ID');
          }
          return done(null, user);
        } else {
          console.log('👤 Creating new user from Google');
          // Create new user WITHOUT password
          const newUser = new User({
            name: profile.displayName,
            email: email,
            googleId: profile.id,
            isVerified: true, // Google users are pre-verified
            // No password field for OAuth users
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
  }
};