const express = require("express");
const { body } = require("express-validator");

const {
  register,
  login,
} = require("../controllers/auth.controller");

const router = express.Router();

const registerValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),

  body("email")
    .trim()
    .isEmail()
    .withMessage("Please provide a valid email"),

  body("password")
    .isLength({ min: 8, max: 128 })
    .withMessage("Password must be between 8 and 128 characters"),
];

const loginValidation = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("Please provide a valid email"),

  body("password")
    .notEmpty()
    .withMessage("Password is required"),
];

router.post("/register", registerValidation, register);

router.post("/login", loginValidation, login);

module.exports = router;