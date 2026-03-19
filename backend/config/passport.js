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
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/api/auth/google/callback',
    proxy: true
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      console.log('Google profile:', profile);
      
      // Check if user exists
      let user = await User.findOne({ email: profile.emails[0].value });
      
      if (user) {
        // User exists, update Google ID if not set
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
          password: 'oauth_' + Math.random().toString(36).slice(-8) // Random password
        });
        
        await newUser.save();
        return done(null, newUser);
      }
    } catch (error) {
      console.error('Google auth error:', error);
      return done(error, null);
    }
  }));

  // ========== FACEBOOK STRATEGY ==========
  passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: '/api/auth/facebook/callback',
    profileFields: ['id', 'displayName', 'email', 'photos'],
    proxy: true
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      console.log('Facebook profile:', profile);
      
      const email = profile.emails && profile.emails[0] ? 
                    profile.emails[0].value : 
                    `${profile.id}@facebook.com`;
      
      // Check if user exists
      let user = await User.findOne({ email });
      
      if (user) {
        if (!user.facebookId) {
          user.facebookId = profile.id;
          user.isVerified = true;
          await user.save();
        }
        return done(null, user);
      } else {
        // Create new user
        const newUser = new User({
          name: profile.displayName,
          email: email,
          facebookId: profile.id,
          isVerified: true,
          password: 'oauth_' + Math.random().toString(36).slice(-8)
        });
        
        await newUser.save();
        return done(null, newUser);
      }
    } catch (error) {
      console.error('Facebook auth error:', error);
      return done(error, null);
    }
  }));

  // ========== GITHUB STRATEGY ==========
  passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: '/api/auth/github/callback',
    scope: ['user:email'],
    proxy: true
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      console.log('GitHub profile:', profile);
      
      // Get email from profile
      let email = null;
      if (profile.emails && profile.emails.length > 0) {
        email = profile.emails[0].value;
      } else {
        email = `${profile.username}@github.com`;
      }
      
      // Check if user exists
      let user = await User.findOne({ email });
      
      if (user) {
        if (!user.githubId) {
          user.githubId = profile.id;
          user.isVerified = true;
          await user.save();
        }
        return done(null, user);
      } else {
        // Create new user
        const newUser = new User({
          name: profile.displayName || profile.username,
          email: email,
          githubId: profile.id,
          isVerified: true,
          password: 'oauth_' + Math.random().toString(36).slice(-8)
        });
        
        await newUser.save();
        return done(null, newUser);
      }
    } catch (error) {
      console.error('GitHub auth error:', error);
      return done(error, null);
    }
  }));
};