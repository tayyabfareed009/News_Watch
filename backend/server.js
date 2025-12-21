// backend/server.js - FIXED VERSION
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
require("dotenv").config();

const app = express();

// ==================== SIMPLE CORS CONFIGURATION ====================
// Use simple CORS - this is enough
app.use(cors());

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ==================== MONGODB CONNECTION ====================
// ==================== SIMPLE MONGODB CONNECTION ====================
const MONGO_URI = process.env.MONGODB_URI;
let dbConnected = false;

// Simple connection - no complex error handling
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected Successfully");
    dbConnected = true;
  })
  .catch(err => {
    console.log("❌ MongoDB Connection Failed:", err.message);
    dbConnected = false;
  });

// Simple checkDB middleware
const checkDB = async (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: "Database temporarily unavailable"
    });
  }
  next();
};

// ==================== SCHEMAS & MODELS ====================
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    trim: true
  },
  profileImage: {
    type: String,
    default: "https://via.placeholder.com/150"
  },
  location: {
    type: String,
    default: ""
  },
  role: {
    type: String,
    enum: ['visitor', 'reporter', 'admin'],
    default: 'visitor'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  bio: String,
  socialLinks: {
    twitter: String,
    facebook: String,
    instagram: String,
    linkedin: String
  },
  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'News'
  }]
}, { timestamps: true });

const newsSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  excerpt: {
    type: String,
    trim: true
  },
  images: [{
    url: String,
    caption: String
  }],
  videoLink: {
    type: String,
    default: ""
  },
  category: {
    type: String,
    required: true
  },
  tags: [String],
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  authorName: String,
  location: {
    type: String,
    default: ""
  },
  views: {
    type: Number,
    default: 0
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  likesCount: {
    type: Number,
    default: 0
  },
  commentsCount: {
    type: Number,
    default: 0
  },
  isBreaking: {
    type: Boolean,
    default: false
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'published'
  }
}, { timestamps: true });

const commentSchema = new mongoose.Schema({
  news: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'News',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: String,
  userImage: String,
  content: {
    type: String,
    required: true,
    trim: true
  },
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  },
  replies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }]
}, { timestamps: true });

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  description: String,
  icon: String,
  color: String,
  newsCount: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

const locationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  country: String,
  state: String,
  newsCount: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

const User = mongoose.model("User", userSchema);
const News = mongoose.model("News", newsSchema);
const Comment = mongoose.model("Comment", commentSchema);
const Category = mongoose.model("Category", categorySchema);
const Location = mongoose.model("Location", locationSchema);

// Auto convert _id → id
[userSchema, newsSchema, commentSchema, categorySchema, locationSchema].forEach(schema => {
  schema.set("toJSON", {
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  });
});

// ==================== TOKEN VERIFICATION MIDDLEWARE ====================
const verifyToken = (allowedRoles = []) => (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ 
    success: false,
    message: "Access denied. No token provided." 
  });

  jwt.verify(token, process.env.JWT_SECRET || "newswatch_secret_key", (err, decoded) => {
    if (err) return res.status(401).json({ 
      success: false,
      message: "Invalid token" 
    });
    
    if (allowedRoles.length > 0 && !allowedRoles.includes(decoded.role)) {
      return res.status(403).json({ 
        success: false,
        message: "Access denied. Not authorized." 
      });
    }
    
    req.user = decoded;
    next();
  });
};

// ==================== ROUTES ====================

// Health Check
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "NewsWatch API",
    version: "1.0.0",
    status: "online",
    database: dbConnected ? "connected" : "disconnected",
    mongodbState: mongoose.connection.readyState
  });
});

app.get("/health", (req, res) => {
  res.json({
    success: true,
    status: "healthy",
    database: dbConnected ? "connected" : "disconnected",
    mongodbState: mongoose.connection.readyState,
    uptime: process.uptime()
  });
});

// Test database connection
app.get("/api/test-db", async (req, res) => {
  try {
    if (dbConnected) {
      const userCount = await User.countDocuments();
      res.json({
        success: true,
        message: "Database connection successful",
        userCount,
        state: mongoose.connection.readyState
      });
    } else {
      res.status(503).json({
        success: false,
        message: "Database not connected",
        state: mongoose.connection.readyState
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Database query failed",
      error: error.message
    });
  }
});

// ==================== OTP SCHEMA ====================
const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  otp: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['verification', 'reset_password'],
    default: 'verification'
  },
  expiresAt: {
    type: Date,
    required: true
  },
  attempts: {
    type: Number,
    default: 0
  },
  verified: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Auto delete expired OTPs after 10 minutes
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 600 });

const OTP = mongoose.model("OTP", otpSchema);

// ==================== OTP UTILITY FUNCTIONS ====================
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// For development - just log OTP to console
const sendOTPEmail = async (email, otp, type = 'verification') => {
  console.log(`📧 [DEV] ${type.toUpperCase()} OTP for ${email}: ${otp}`);
  console.log(`⏰ OTP expires in 10 minutes`);
  return true;
};

// Store OTPs in memory for easy testing (optional)
const otpStore = new Map();

// ==================== OTP ROUTES ====================

// Send OTP for email verification
app.post("/api/auth/send-verification", checkDB, async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: "Email is required" 
      });
    }

    const normalizedEmail = email.toLowerCase();

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete any existing OTPs for this email
    await OTP.deleteMany({ 
      email: normalizedEmail, 
      type: 'verification',
      verified: false 
    });

    // Save OTP to database
    const otpRecord = await OTP.create({
      email: normalizedEmail,
      otp,
      type: 'verification',
      expiresAt
    });

    // Also store in memory for easy testing
    otpStore.set(normalizedEmail, {
      otp,
      expiresAt,
      type: 'verification'
    });

    // Log OTP to console (for development)
    console.log(`\n🔐 [DEV MODE] Verification OTP for ${email}: ${otp}`);
    console.log(`⏰ Expires at: ${expiresAt.toLocaleTimeString()}`);

    res.json({
      success: true,
      message: "Verification code generated",
      otp: otp, // Send OTP in response for development
      expiresIn: 600, // 10 minutes in seconds
      note: "DEV MODE: OTP shown in response"
    });

  } catch (error) {
    console.error("Send verification error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to generate verification code" 
    });
  }
});
// Add this in your backend routes section (around line 300)
app.get("/api/auth/verify", verifyToken(), async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    // Check if token is about to expire (within 1 hour)
    const tokenExp = req.user.exp * 1000;
    const oneHour = 60 * 60 * 1000;
    const needsRefresh = (tokenExp - Date.now()) < oneHour;

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
        isVerified: user.isVerified
      },
      tokenInfo: {
        expiresAt: tokenExp,
        needsRefresh,
        role: req.user.role
      }
    });

  } catch (error) {
    console.error("Token verification error:", error);
    res.status(401).json({ 
      success: false,
      message: "Invalid token" 
    });
  }
});

// Add token refresh endpoint
app.post("/api/auth/refresh", verifyToken(), async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    // Generate new token
    const newToken = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET || "newswatch_secret_key",
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token: newToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
        isVerified: user.isVerified
      }
    });

  } catch (error) {
    console.error("Token refresh error:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to refresh token" 
    });
  }
});
// Verify OTP
app.post("/api/auth/verify-otp", checkDB, async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    if (!email || !otp) {
      return res.status(400).json({ 
        success: false, 
        message: "Email and OTP are required" 
      });
    }

    const normalizedEmail = email.toLowerCase();

    // Try memory store first (for testing)
    const memoryOtp = otpStore.get(normalizedEmail);
    if (memoryOtp && memoryOtp.otp === otp && memoryOtp.expiresAt > new Date()) {
      // OTP valid from memory store
      otpStore.delete(normalizedEmail);
      
      // Find or create user
      let user = await User.findOne({ email: normalizedEmail });
      
      if (user) {
        // Update user verification status
        user.isVerified = true;
        await user.save();
        
        // Generate token
        const token = jwt.sign(
          { 
            id: user.id, 
            email: user.email, 
            role: user.role 
          },
          process.env.JWT_SECRET || "newswatch_secret_key",
          { expiresIn: '7d' }
        );

        return res.json({
          success: true,
          message: "Email verified successfully",
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            profileImage: user.profileImage,
            isVerified: true
          }
        });
      } else {
        // User not found (shouldn't happen in normal flow)
        return res.json({
          success: true,
          message: "OTP verified successfully",
          email: normalizedEmail,
          requiresSignup: true
        });
      }
    }

    // Check database OTP
    const otpRecord = await OTP.findOne({ 
      email: normalizedEmail, 
      otp, 
      type: 'verification',
      verified: false
    });

    if (!otpRecord) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid or expired OTP" 
      });
    }

    // Check if OTP is expired
    if (otpRecord.expiresAt < new Date()) {
      return res.status(400).json({ 
        success: false, 
        message: "OTP has expired" 
      });
    }

    // Mark OTP as verified
    otpRecord.verified = true;
    await otpRecord.save();

    // Find user
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    // Update user verification status
    user.isVerified = true;
    await user.save();

    // Generate token
    const token = jwt.sign(
  { id: user._id, role: user.role },
  process.env.JWT_SECRET_NEWS,
  { expiresIn: "1d" }
);


    res.json({
      success: true,
      message: "Email verified successfully",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
        isVerified: true
      }
    });

  } catch (error) {
    console.error("Verify OTP error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to verify OTP" 
    });
  }
});

// Resend OTP
app.post("/api/auth/resend-otp", checkDB, async (req, res) => {
  try {
    const { email, type = 'verification' } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: "Email is required" 
      });
    }

    const normalizedEmail = email.toLowerCase();

    // Generate new OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete any existing OTPs
    await OTP.deleteMany({ 
      email: normalizedEmail, 
      type,
      verified: false 
    });

    // Save new OTP
    await OTP.create({
      email: normalizedEmail,
      otp,
      type,
      expiresAt
    });

    // Update memory store
    otpStore.set(normalizedEmail, {
      otp,
      expiresAt,
      type
    });

    console.log(`\n🔐 [DEV MODE] New ${type} OTP for ${email}: ${otp}`);

    res.json({
      success: true,
      message: "New verification code generated",
      otp: otp, // Send in response for development
      expiresIn: 600,
      note: "DEV MODE: OTP shown in response"
    });

  } catch (error) {
    console.error("Resend OTP error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to generate new code" 
    });
  }
});

// ==================== FORGOT PASSWORD ====================

// Request password reset OTP
app.post("/api/auth/forgot-password", checkDB, async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: "Email is required" 
      });
    }

    const normalizedEmail = email.toLowerCase();

    // Check if user exists
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      // For security, don't reveal if user exists
      return res.json({
        success: true,
        message: "If an account exists with this email, a reset code will be generated"
      });
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Delete any existing reset OTPs
    await OTP.deleteMany({ 
      email: normalizedEmail, 
      type: 'reset_password' 
    });

    // Save new OTP
    await OTP.create({
      email: normalizedEmail,
      otp,
      type: 'reset_password',
      expiresAt
    });

    // Update memory store
    otpStore.set(normalizedEmail, {
      otp,
      expiresAt,
      type: 'reset_password'
    });

    console.log(`\n🔐 [DEV MODE] Password Reset OTP for ${email}: ${otp}`);

    res.json({
      success: true,
      message: "Password reset code generated",
      otp: otp, // Send in response for development
      expiresIn: 600,
      note: "DEV MODE: OTP shown in response"
    });

  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to generate reset code" 
    });
  }
});

// Reset password with OTP
app.post("/api/auth/reset-password", checkDB, async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: "Email, OTP and new password are required" 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: "Password must be at least 6 characters" 
      });
    }

    const normalizedEmail = email.toLowerCase();

    // Try memory store
    const memoryOtp = otpStore.get(normalizedEmail);
    if (memoryOtp && memoryOtp.type === 'reset_password' && memoryOtp.otp === otp) {
      if (memoryOtp.expiresAt > new Date()) {
        // Valid OTP from memory
        otpStore.delete(normalizedEmail);
        
        // Update user password
        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
          return res.status(404).json({ 
            success: false, 
            message: "User not found" 
          });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        return res.json({
          success: true,
          message: "Password reset successfully"
        });
      }
    }

    // Check database OTP
    const otpRecord = await OTP.findOne({ 
      email: normalizedEmail, 
      otp, 
      type: 'reset_password',
      verified: false
    });

    if (!otpRecord) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid or expired reset code" 
      });
    }

    if (otpRecord.expiresAt < new Date()) {
      return res.status(400).json({ 
        success: false, 
        message: "Reset code has expired" 
      });
    }

    // Mark OTP as verified
    otpRecord.verified = true;
    await otpRecord.save();

    // Update user password
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({
      success: true,
      message: "Password reset successfully"
    });

  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to reset password" 
    });
  }
});

// ==================== TEST ENDPOINTS ====================

// Get all OTPs for testing (development only)
app.get("/api/test/otps", async (req, res) => {
  try {
    const otps = await OTP.find();
    const memoryOtps = Array.from(otpStore.entries()).map(([email, data]) => ({
      email,
      ...data
    }));

    res.json({
      success: true,
      databaseOtps: otps,
      memoryOtps: memoryOtps,
      total: otps.length + memoryOtps.length
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Clear all OTPs (development only)
app.delete("/api/test/clear-otps", async (req, res) => {
  try {
    await OTP.deleteMany({});
    otpStore.clear();
    res.json({
      success: true,
      message: "All OTPs cleared"
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== AUTH ROUTES ====================

// Register user directly (no OTP required for now)
app.post("/api/auth/register", checkDB, [
  body('name').notEmpty().withMessage('Name is required').trim(),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').optional().trim(),
  body('role').optional().isIn(['visitor', 'reporter']).withMessage('Invalid role')
], async (req, res) => {
  try {
    console.log('📝 [Register] New registration attempt:', {
      email: req.body.email,
      name: req.body.name,
      role: req.body.role
    });

    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ [Register] Validation errors:', errors.array());
      return res.status(400).json({ 
        success: false,
        message: "Validation failed",
        errors: errors.array().map(err => ({
          field: err.path,
          message: err.msg
        }))
      });
    }

    const { name, email, password, phone, role = 'visitor' } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    console.log('🔍 [Register] Checking if user exists:', normalizedEmail);
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      console.log('❌ [Register] Email already registered:', normalizedEmail);
      return res.status(400).json({ 
        success: false,
        message: "This email is already registered. Please login instead.",
        code: "EMAIL_EXISTS"
      });
    }

    console.log('✅ [Register] Creating new user...');

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      phone: (phone || "").trim(),
      role: role,
      isVerified: true // Auto-verify for simplicity
    });

    console.log('✅ [Register] User created successfully:', {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    });

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET || "newswatch_secret_key",
      { expiresIn: '7d' }
    );

    console.log('✅ [Register] Token generated, sending response');

    res.status(201).json({
      success: true,
      message: "Registration successful! You can now login.",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
        phone: user.phone,
        isVerified: true
      }
    });

  } catch (error) {
    console.error('❌ [Register] Server error:', error);
    res.status(500).json({ 
      success: false,
      message: "Registration failed. Please try again.",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: "SERVER_ERROR"
    });
  }
});

// Login with detailed logging
app.post("/api/auth/login", checkDB, [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res) => {
  console.log('🔐 [Login] Login attempt started');
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ [Login] Validation errors:', errors.array());
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }

    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase();
    
    console.log('📧 [Login] Looking for user with email:', normalizedEmail);

    const user = await User.findOne({ email: normalizedEmail });
    
    if (!user) {
      console.log('❌ [Login] User not found:', normalizedEmail);
      return res.status(401).json({ 
        success: false,
        message: "Invalid credentials" 
      });
    }

    console.log('✅ [Login] User found:', {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified
    });

    console.log('🔑 [Login] Comparing passwords...');
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('🔑 [Login] Password comparison result:', isPasswordValid);

    if (!isPasswordValid) {
      console.log('❌ [Login] Password incorrect for user:', user.email);
      return res.status(401).json({ 
        success: false,
        message: "Invalid credentials" 
      });
    }

    console.log('✅ [Login] Password correct, generating token...');

    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET || "newswatch_secret_key",
      { expiresIn: '7d' }
    );

    console.log('✅ [Login] Token generated successfully');
    console.log('✅ [Login] Sending successful response for:', user.email);

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
        location: user.location,
        bio: user.bio,
        isVerified: user.isVerified
      }
    });

  } catch (error) {
    console.error('❌ [Login] Server error:', error);
    res.status(500).json({ 
      success: false,
      message: "Server error",
      error: error.message 
    });
  }
});

// Get user profile
app.get("/api/user/profile", checkDB, verifyToken(), async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password');
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    res.json({
      success: true,
      user
    });

  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error",
      error: error.message 
    });
  }
});

// Update user profile
app.put("/api/user/profile", checkDB, verifyToken(), async (req, res) => {
  try {
    const updates = req.body;
    delete updates.password;
    delete updates.email;
    delete updates.role;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: "Profile updated successfully",
      user
    });

  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error",
      error: error.message 
    });
  }
});

// ==================== NEWS ROUTES ====================

// Get all news
app.get("/api/news", checkDB, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      category, 
      location, 
      search,
      breaking,
      featured 
    } = req.query;

    const query = { status: 'published' };
    
    if (category) query.category = category;
    if (location) query.location = location;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }
    if (breaking === 'true') query.isBreaking = true;
    if (featured === 'true') query.isFeatured = true;

    const skip = (page - 1) * limit;

    const news = await News.find(query)
      .populate('author', 'name profileImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await News.countDocuments(query);

    res.json({
      success: true,
      news,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error("Get news error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error",
      error: error.message 
    });
  }
});

// Get breaking news
app.get("/api/news/breaking", checkDB, async (req, res) => {
  try {
    const breakingNews = await News.find({ 
      status: 'published', 
      isBreaking: true 
    })
      .populate('author', 'name profileImage')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    res.json({
      success: true,
      news: breakingNews
    });

  } catch (error) {
    console.error("Get breaking news error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error",
      error: error.message 
    });
  }
});

// Get featured news
app.get("/api/news/featured", checkDB, async (req, res) => {
  try {
    const featuredNews = await News.find({ 
      status: 'published', 
      isFeatured: true 
    })
      .populate('author', 'name profileImage')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    res.json({
      success: true,
      news: featuredNews
    });

  } catch (error) {
    console.error("Get featured news error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error",
      error: error.message 
    });
  }
});

// Get single news by ID
app.get("/api/news/:id", checkDB, async (req, res) => {
  try {
    const news = await News.findById(req.params.id)
      .populate('author', 'name profileImage bio')
      .lean();

    if (!news || news.status !== 'published') {
      return res.status(404).json({ 
        success: false,
        message: "News not found" 
      });
    }

    await News.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });

    res.json({
      success: true,
      news
    });

  } catch (error) {
    console.error("Get news by ID error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error",
      error: error.message 
    });
  }
});

// Create news (Reporter/Admin only) - CLOUDINARY COMPATIBLE
app.post("/api/news", checkDB, verifyToken(['reporter', 'admin']), async (req, res) => {
  try {
    const { 
      title, 
      content, 
      category, 
      tags, 
      videoLink, 
      images, // ✅ This will receive Cloudinary URLs from frontend
      isBreaking, 
      isFeatured,
      location 
    } = req.body;

    if (!title || !content || !category) {
      return res.status(400).json({ 
        success: false,
        message: "Title, content, and category are required" 
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    // Optional: Validate Cloudinary URLs format
    if (images && Array.isArray(images)) {
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        if (!img.url || typeof img.url !== 'string') {
          return res.status(400).json({
            success: false,
            message: `Image at index ${i} must have a valid URL string`
          });
        }
      }
    }

    const news = await News.create({
      title,
      content,
      excerpt: content.substring(0, 200) + (content.length > 200 ? '...' : ''),
      category,
      tags: tags || [],
      videoLink: videoLink || '',
      images: images || [], // ✅ Cloudinary URLs stored directly
      author: req.user.id,
      authorName: user.name,
      location: location || user.location || '',
      isBreaking: isBreaking || false,
      isFeatured: isFeatured || false,
      status: 'published'
    });

    console.log(`✅ News created with ${news.images.length} Cloudinary images`);

    res.status(201).json({
      success: true,
      message: "News published successfully",
      news
    });

  } catch (error) {
    console.error("Create news error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error",
      error: error.message 
    });
  }
});

// Update news
app.put("/api/news/:id", checkDB, verifyToken(['reporter', 'admin']), async (req, res) => {
  try {
    const news = await News.findById(req.params.id);
    
    if (!news) {
      return res.status(404).json({ 
        success: false,
        message: "News not found" 
      });
    }

    if (news.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: "Not authorized to update this news" 
      });
    }

    const updates = req.body;
    delete updates.author;

    const updatedNews = await News.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('author', 'name profileImage');

    res.json({
      success: true,
      message: "News updated successfully",
      news: updatedNews
    });

  } catch (error) {
    console.error("Update news error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error",
      error: error.message 
    });
  }
});

// Delete news
app.delete("/api/news/:id", checkDB, verifyToken(['reporter', 'admin']), async (req, res) => {
  try {
    const news = await News.findById(req.params.id);
    
    if (!news) {
      return res.status(404).json({ 
        success: false,
        message: "News not found" 
      });
    }

    if (news.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: "Not authorized to delete this news" 
      });
    }

    await News.findByIdAndDelete(req.params.id);
    await Comment.deleteMany({ news: req.params.id });

    res.json({
      success: true,
      message: "News deleted successfully"
    });

  } catch (error) {
    console.error("Delete news error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error",
      error: error.message 
    });
  }
});

// Like/Unlike news
app.post("/api/news/:id/like", checkDB, verifyToken(), async (req, res) => {
  try {
    const news = await News.findById(req.params.id);
    if (!news) {
      return res.status(404).json({ 
        success: false,
        message: "News not found" 
      });
    }

    const userId = req.user.id;
    const hasLiked = news.likes.includes(userId);

    if (hasLiked) {
      news.likes.pull(userId);
      news.likesCount = Math.max(0, news.likesCount - 1);
    } else {
      news.likes.push(userId);
      news.likesCount += 1;
    }

    await news.save();

    res.json({
      success: true,
      message: hasLiked ? "News unliked" : "News liked",
      likesCount: news.likesCount,
      hasLiked: !hasLiked
    });

  } catch (error) {
    console.error("Like news error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error",
      error: error.message 
    });
  }
});

// Add to favorites
app.post("/api/news/:id/favorite", checkDB, verifyToken(), async (req, res) => {
  try {
    const news = await News.findById(req.params.id);
    if (!news) {
      return res.status(404).json({ 
        success: false,
        message: "News not found" 
      });
    }

    const user = await User.findById(req.user.id);
    const isFavorited = user.favorites.includes(req.params.id);

    if (isFavorited) {
      user.favorites.pull(req.params.id);
    } else {
      user.favorites.push(req.params.id);
    }

    await user.save();

    res.json({
      success: true,
      message: isFavorited ? "Removed from favorites" : "Added to favorites",
      isFavorited: !isFavorited
    });

  } catch (error) {
    console.error("Favorite news error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error",
      error: error.message 
    });
  }
});

// Get user's favorite news
app.get("/api/user/favorites", checkDB, verifyToken(), async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: 'favorites',
      populate: {
        path: 'author',
        select: 'name profileImage'
      }
    });

    res.json({
      success: true,
      favorites: user.favorites || []
    });

  } catch (error) {
    console.error("Get favorites error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error",
      error: error.message 
    });
  }
});

// ==================== COMMENT ROUTES ====================

// Get comments for news
app.get("/api/news/:id/comments", checkDB, async (req, res) => {
  try {
    const comments = await Comment.find({ 
      news: req.params.id,
      parentComment: null 
    })
      .populate('user', 'name profileImage')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      comments
    });

  } catch (error) {
    console.error("Get comments error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error",
      error: error.message 
    });
  }
});

// Add comment
app.post("/api/news/:id/comments", checkDB, verifyToken(), async (req, res) => {
  try {
    const { content, parentComment } = req.body;

    if (!content || content.trim() === '') {
      return res.status(400).json({ 
        success: false,
        message: "Comment content is required" 
      });
    }

    const news = await News.findById(req.params.id);
    if (!news) {
      return res.status(404).json({ 
        success: false,
        message: "News not found" 
      });
    }

    const user = await User.findById(req.user.id);

    const comment = await Comment.create({
      news: req.params.id,
      user: req.user.id,
      userName: user.name,
      userImage: user.profileImage,
      content: content.trim(),
      parentComment: parentComment || null
    });

    news.commentsCount += 1;
    await news.save();

    res.status(201).json({
      success: true,
      message: "Comment added",
      comment: {
        ...comment.toJSON(),
        user: {
          id: user.id,
          name: user.name,
          profileImage: user.profileImage
        }
      }
    });

  } catch (error) {
    console.error("Add comment error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error",
      error: error.message 
    });
  }
});

// Delete comment
app.delete("/api/comments/:id", checkDB, verifyToken(), async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    
    if (!comment) {
      return res.status(404).json({ 
        success: false,
        message: "Comment not found" 
      });
    }

    if (comment.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: "Not authorized to delete this comment" 
      });
    }

    await Comment.findByIdAndDelete(req.params.id);
    await News.findByIdAndUpdate(comment.news, { $inc: { commentsCount: -1 } });

    res.json({
      success: true,
      message: "Comment deleted successfully"
    });

  } catch (error) {
    console.error("Delete comment error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error",
      error: error.message 
    });
  }
});

// ==================== CATEGORY ROUTES ====================

// Get all categories
app.get("/api/categories", checkDB, async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    
    res.json({
      success: true,
      categories
    });

  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error",
      error: error.message 
    });
  }
});

// Get news by category
app.get("/api/categories/:category/news", checkDB, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const news = await News.find({ 
      category: req.params.category,
      status: 'published'
    })
      .populate('author', 'name profileImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await News.countDocuments({ 
      category: req.params.category,
      status: 'published'
    });

    res.json({
      success: true,
      news,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error("Get news by category error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error",
      error: error.message 
    });
  }
});

// ==================== LOCATION ROUTES ====================

// Get all locations
app.get("/api/locations", checkDB, async (req, res) => {
  try {
    const locations = await Location.find().sort({ name: 1 });
    
    res.json({
      success: true,
      locations
    });

  } catch (error) {
    console.error("Get locations error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error",
      error: error.message 
    });
  }
});

// Get news by location
app.get("/api/locations/:location/news", checkDB, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const news = await News.find({ 
      location: req.params.location,
      status: 'published'
    })
      .populate('author', 'name profileImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await News.countDocuments({ 
      location: req.params.location,
      status: 'published'
    });

    res.json({
      success: true,
      news,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error("Get news by location error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error",
      error: error.message 
    });
  }
});

// Set user location
app.post("/api/user/location", checkDB, verifyToken(), async (req, res) => {
  try {
    const { location } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { location },
      { new: true }
    ).select('-password');

    res.json({
      success: true,
      message: "Location updated",
      user
    });

  } catch (error) {
    console.error("Set location error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error",
      error: error.message 
    });
  }
});

// ==================== REPORTER ROUTES ====================

// Get reporter's news
app.get("/api/reporter/news", checkDB, verifyToken(['reporter', 'admin']), async (req, res) => {
  try {
    const news = await News.find({ author: req.user.id })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      news,
      count: news.length
    });

  } catch (error) {
    console.error("Get reporter news error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error",
      error: error.message 
    });
  }
});

// Get reporter stats
app.get("/api/reporter/stats", checkDB, verifyToken(['reporter', 'admin']), async (req, res) => {
  try {
    const totalNews = await News.countDocuments({ author: req.user.id });
    const totalViews = await News.aggregate([
      { $match: { author: new mongoose.Types.ObjectId(req.user.id) } },
      { $group: { _id: null, totalViews: { $sum: "$views" } } }
    ]);
    const totalLikes = await News.aggregate([
      { $match: { author: new mongoose.Types.ObjectId(req.user.id) } },
      { $group: { _id: null, totalLikes: { $sum: "$likesCount" } } }
    ]);

    res.json({
      success: true,
      stats: {
        totalNews,
        totalViews: totalViews[0]?.totalViews || 0,
        totalLikes: totalLikes[0]?.totalLikes || 0,
        engagementRate: totalNews > 0 ? ((totalLikes[0]?.totalLikes || 0) / totalNews).toFixed(2) : 0
      }
    });

  } catch (error) {
    console.error("Get reporter stats error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error",
      error: error.message 
    });
  }
});

// ==================== ADMIN ROUTES ====================

// Get all users (Admin only)
app.get("/api/admin/users", checkDB, verifyToken(['admin']), async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    
    res.json({
      success: true,
      users,
      count: users.length
    });

  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error",
      error: error.message 
    });
  }
});

// Update user role (Admin only)
app.put("/api/admin/users/:id/role", checkDB, verifyToken(['admin']), async (req, res) => {
  try {
    const { role } = req.body;
    
    if (!['visitor', 'reporter', 'admin'].includes(role)) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid role" 
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    res.json({
      success: true,
      message: "User role updated",
      user
    });

  } catch (error) {
    console.error("Update user role error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error",
      error: error.message 
    });
  }
});

// Get system stats (Admin only)
app.get("/api/admin/stats", checkDB, verifyToken(['admin']), async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalNews = await News.countDocuments();
    const totalComments = await Comment.countDocuments();
    
    const recentNews = await News.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('author', 'name')
      .lean();

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalNews,
        totalComments,
        visitors: totalUsers - await User.countDocuments({ role: { $in: ['reporter', 'admin'] } }),
        reporters: await User.countDocuments({ role: 'reporter' }),
        admins: await User.countDocuments({ role: 'admin' })
      },
      recentNews
    });

  } catch (error) {
    console.error("Get admin stats error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error",
      error: error.message 
    });
  }
});

// ==================== SEARCH ROUTES ====================

// Search news
app.get("/api/search", checkDB, async (req, res) => {
  try {
    const { q, category, location, page = 1, limit = 20 } = req.query;

    if (!q && !category && !location) {
      return res.status(400).json({ 
        success: false,
        message: "Search query, category, or location is required" 
      });
    }

    const query = { status: 'published' };
    const searchConditions = [];

    if (q) {
      searchConditions.push(
        { title: { $regex: q, $options: 'i' } },
        { content: { $regex: q, $options: 'i' } },
        { tags: { $regex: q, $options: 'i' } }
      );
    }

    if (category) {
      query.category = category;
    }

    if (location) {
      query.location = location;
    }

    if (searchConditions.length > 0) {
      query.$or = searchConditions;
    }

    const skip = (page - 1) * limit;

    const news = await News.find(query)
      .populate('author', 'name profileImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await News.countDocuments(query);

    res.json({
      success: true,
      query: {
        q: q || '',
        category: category || '',
        location: location || ''
      },
      news,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error",
      error: error.message 
    });
  }
});

// ==================== ERROR HANDLING ====================
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    message: "API endpoint not found" 
  });
});

app.use((err, req, res, next) => {
  console.error("Global error:", err);
  res.status(500).json({ 
    success: false,
    message: "Internal server error",
    error: process.env.NODE_ENV === 'production' ? undefined : err.message
  });
});

// ==================== START SERVER ====================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 NewsWatch Server running on http://localhost:${PORT}`);
  console.log(`✅ Ready for Cloudinary image URLs from frontend`);
});