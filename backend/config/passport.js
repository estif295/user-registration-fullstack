const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const GitHubStrategy = require('passport-github').Strategy;
const User = require('../models/User');

module.exports = function(passport) {
  
  // Serialize user
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // Deserialize user
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  // ========== GOOGLE STRATEGY ==========
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    console.log('✅ Configuring Google Strategy');
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/api/auth/google/callback',
      proxy: true
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        console.log('Google profile received:', profile.displayName);
        
        // Find or create user
        let user = await User.findOne({ email: profile.emails[0].value });
        
        if (user) {
          // Update Google ID if not set
          if (!user.googleId) {
            user.googleId = profile.id;
            user.isVerified = true;
            await user.save();
          }
          return done(null, user);
        } else {
          // Create new user
          const newUser = new User({
            name: profile.displayName,
            email: profile.emails[0].value,
            googleId: profile.id,
            isVerified: true,
            password: 'google_' + Math.random().toString(36).slice(-8)
          });
          await newUser.save();
          return done(null, newUser);
        }
      } catch (error) {
        console.error('Google strategy error:', error);
        return done(error, null);
      }
    }));
  } else {
    console.log('⚠️ Google OAuth credentials not found, skipping Google strategy');
  }

  // ========== FACEBOOK STRATEGY ==========
  if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
    console.log('✅ Configuring Facebook Strategy');
    passport.use(new FacebookStrategy({
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: '/api/auth/facebook/callback',
      profileFields: ['id', 'displayName', 'email'],
      proxy: true
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        console.log('Facebook profile received:', profile.displayName);
        
        const email = profile.emails && profile.emails[0] ? 
                      profile.emails[0].value : 
                      `${profile.id}@facebook.com`;
        
        let user = await User.findOne({ email });
        
        if (user) {
          if (!user.facebookId) {
            user.facebookId = profile.id;
            user.isVerified = true;
            await user.save();
          }
          return done(null, user);
        } else {
          const newUser = new User({
            name: profile.displayName,
            email: email,
            facebookId: profile.id,
            isVerified: true,
            password: 'facebook_' + Math.random().toString(36).slice(-8)
          });
          await newUser.save();
          return done(null, newUser);
        }
      } catch (error) {
        console.error('Facebook strategy error:', error);
        return done(error, null);
      }
    }));
  } else {
    console.log('⚠️ Facebook OAuth credentials not found, skipping Facebook strategy');
  }

  // ========== GITHUB STRATEGY ==========
  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    console.log('✅ Configuring GitHub Strategy');
    passport.use(new GitHubStrategy({
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: '/api/auth/github/callback',
      scope: ['user:email'],
      proxy: true
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        console.log('GitHub profile received:', profile.displayName || profile.username);
        
        // Get email from profile
        let email = null;
        if (profile.emails && profile.emails.length > 0) {
          email = profile.emails[0].value;
        } else {
          email = `${profile.username}@github.com`;
        }
        
        let user = await User.findOne({ email });
        
        if (user) {
          if (!user.githubId) {
            user.githubId = profile.id;
            user.isVerified = true;
            await user.save();
          }
          return done(null, user);
        } else {
          const newUser = new User({
            name: profile.displayName || profile.username,
            email: email,
            githubId: profile.id,
            isVerified: true,
            password: 'github_' + Math.random().toString(36).slice(-8)
          });
          await newUser.save();
          return done(null, newUser);
        }
      } catch (error) {
        console.error('GitHub strategy error:', error);
        return done(error, null);
      }
    }));
  } else {
    console.log('⚠️ GitHub OAuth credentials not found, skipping GitHub strategy');
  }
};