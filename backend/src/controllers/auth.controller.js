const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { validationResult } = require('express-validator')

const User = require('../models/User')
const Wallet = require('../models/Wallet')

const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    {
      expiresIn: '7d',
    }
  )
}

// -----------------------------------------
// Register
// -----------------------------------------

const register = async (req, res) => {
  try {
    const errors =
      validationResult(req)

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      })
    }

    const {
      name,
      email,
      password,
    } = req.body

    const normalizedEmail =
      email.toLowerCase().trim()

    const existingUser =
      await User.findOne({
        email: normalizedEmail,
      })

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          'Email already registered',
      })
    }

    const passwordHash =
      await bcrypt.hash(password, 12)

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
    })

    // Create wallet for new user
    await Wallet.create({
      userId: user._id,
      gems: 0,
    })

    const token =
      generateToken(
        user._id.toString()
      )

    return res.status(201).json({
      success: true,
      message:
        'Registration successful',

      token,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    })
  } catch (error) {
    console.error(
      'Register error:',
      error
    )

    return res.status(500).json({
      success: false,
      message: 'Server error',
    })
  }
}

// -----------------------------------------
// Login
// -----------------------------------------

const login = async (req, res) => {
  try {
    const errors =
      validationResult(req)

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      })
    }

    const {
      email,
      password,
    } = req.body

    const normalizedEmail =
      email.toLowerCase().trim()

    const user =
      await User.findOne({
        email: normalizedEmail,
      })

    if (!user) {
      return res.status(401).json({
        success: false,
        message:
          'Invalid email or password',
      })
    }

    const isPasswordValid =
      await bcrypt.compare(
        password,
        user.passwordHash
      )

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message:
          'Invalid email or password',
      })
    }

    /*
      Ensure existing users also have a wallet.

      This is useful for accounts that were
      created before Wallet integration.
    */

    await Wallet.findOneAndUpdate(
      {
        userId: user._id,
      },
      {
        $setOnInsert: {
          userId: user._id,
          gems: 0,
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    )

    const token =
      generateToken(
        user._id.toString()
      )

    return res.status(200).json({
      success: true,
      message: 'Login successful',

      token,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    })
  } catch (error) {
    console.error(
      'Login error:',
      error
    )

    return res.status(500).json({
      success: false,
      message: 'Server error',
    })
  }
}

module.exports = {
  register,
  login,
}