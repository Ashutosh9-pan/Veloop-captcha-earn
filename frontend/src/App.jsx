import { useEffect, useState } from 'react'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

const wait = (ms) =>
  new Promise((resolve) =>
    setTimeout(resolve, ms)
  )

const formatGemAmount = (amount) => {
  const value = Number(amount) || 0

  return `${value} Gem${value === 1 ? '' : 's'}`
}

function App() {
  // -----------------------------------------
  // Authentication
  // -----------------------------------------

  const [showLogin, setShowLogin] =
    useState(false)

  const [authMode, setAuthMode] =
    useState('login')

  const [registerName, setRegisterName] =
    useState('')

  const [confirmPassword, setConfirmPassword] =
    useState('')

  const [isLoggedIn, setIsLoggedIn] =
    useState(
      Boolean(
        sessionStorage.getItem(
          'veloop_token'
        )
      )
    )

  const [user, setUser] =
    useState(null)

  const [email, setEmail] =
    useState('')

  const [password, setPassword] =
    useState('')

  // -----------------------------------------
  // General loading states
  // -----------------------------------------

  const [loading, setLoading] =
    useState(false)

  const [challengeLoading, setChallengeLoading] =
    useState(false)

  const [submitLoading, setSubmitLoading] =
    useState(false)

  const [claimLoading, setClaimLoading] =
    useState(false)

  // -----------------------------------------
  // Messages
  // -----------------------------------------

  const [error, setError] =
    useState('')

  const [success, setSuccess] =
    useState('')

  // -----------------------------------------
  // CAPTCHA
  // -----------------------------------------

  const [challengeStarted, setChallengeStarted] =
    useState(false)

  const [captcha, setCaptcha] =
    useState(null)

  const [selectedOption, setSelectedOption] =
    useState('')

  // -----------------------------------------
  // Verification state
  // -----------------------------------------

  const [verificationState, setVerificationState] =
    useState('idle')
  // idle
  // checking
  // result

  // -----------------------------------------
  // Claim state
  // -----------------------------------------

  const [claimPhase, setClaimPhase] =
    useState('idle')

  // idle
  // preparing
  // mock-ad
  // completed

  // -----------------------------------------
  // Server-authoritative wallet
  // -----------------------------------------

  const [reward, setReward] =
    useState(0)

  // -----------------------------------------
  // Last CAPTCHA result
  // -----------------------------------------

  const [lastResult, setLastResult] =
    useState(null)

  // -----------------------------------------
  // Wallet transaction history
  // -----------------------------------------

  const [transactions, setTransactions] =
    useState([])

  const [transactionLoading, setTransactionLoading] =
    useState(false)

  // -----------------------------------------
  // Fetch wallet balance
  // -----------------------------------------

  const fetchWalletBalance =
    async () => {
      const token =
        sessionStorage.getItem(
          'veloop_token'
        )

      if (!token) {
        setReward(0)
        return
      }

      try {
        const response =
          await fetch(
            `${API_URL}/wallet/gems`,
            {
              method: 'GET',
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          )

        const data =
          await response.json()

        if (
          response.status === 401 ||
          response.status === 403
        ) {
          sessionStorage.removeItem(
            'veloop_token'
          )

          setIsLoggedIn(false)
          setUser(null)
          setReward(0)

          return
        }

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
              'Unable to fetch wallet balance.'
          )
        }

        const gems =
          Number(
            data.data?.gems ?? 0
          )

        setReward(gems)
      } catch (walletError) {
        console.error(
          'Wallet balance error:',
          walletError
        )
      }
    }

  // -----------------------------------------
  // Fetch wallet transaction history
  // -----------------------------------------

  const fetchWalletTransactions = async () => {
    const token =
      sessionStorage.getItem(
        'veloop_token'
      )

    if (!token) {
      setTransactions([])
      return
    }

    try {
      setTransactionLoading(true)

      const response =
        await fetch(
          `${API_URL}/wallet/transactions?limit=20`,
          {
            method: 'GET',
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
            cache: 'no-store',
          }
        )

      const data =
        await response.json()

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        sessionStorage.removeItem(
          'veloop_token'
        )

        setIsLoggedIn(false)
        setUser(null)
        setReward(0)
        setTransactions([])

        return
      }

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            'Unable to fetch transaction history.'
        )
      }

      const history =
        Array.isArray(
          data.data?.transactions
        )
          ? data.data.transactions
          : []

      setTransactions(history)
    } catch (transactionError) {
      console.error(
        'Transaction history error:',
        transactionError
      )
    } finally {
      setTransactionLoading(false)
    }
  }

  // -----------------------------------------
  // Load wallet when authenticated
  // -----------------------------------------

  useEffect(() => {
    if (isLoggedIn) {
      fetchWalletBalance()
      fetchWalletTransactions()
    } else {
      setReward(0)
      setTransactions([])
    }
  }, [isLoggedIn])

  // -----------------------------------------
  // Revoke old CAPTCHA image object URL
  // -----------------------------------------

  useEffect(() => {
    return () => {
      if (captcha?.captchaImage) {
        URL.revokeObjectURL(
          captcha.captchaImage
        )
      }
    }
  }, [captcha?.captchaImage])

  // -----------------------------------------
  // Open login
  // -----------------------------------------

  const openLogin = () => {
    setError('')
    setSuccess('')
    setAuthMode('login')
    setRegisterName('')
    setConfirmPassword('')
    setShowLogin(true)
  }

  // -----------------------------------------
  // Open register
  // -----------------------------------------

  const openRegister = () => {
    setError('')
    setSuccess('')
    setAuthMode('register')
    setShowLogin(true)
  }

  // -----------------------------------------
  // Close authentication modal
  // -----------------------------------------

  const closeLogin = () => {
    if (!loading) {
      setShowLogin(false)
      setError('')
      setSuccess('')
      setAuthMode('login')
      setRegisterName('')
      setConfirmPassword('')
      setEmail('')
      setPassword('')
    }
  }

  // -----------------------------------------
  // Switch authentication mode
  // -----------------------------------------

  const switchToLogin = () => {
    if (loading) {
      return
    }

    setError('')
    setSuccess('')
    setAuthMode('login')
    setConfirmPassword('')
  }

  const switchToRegister = () => {
    if (loading) {
      return
    }

    setError('')
    setSuccess('')
    setAuthMode('register')
    setPassword('')
    setConfirmPassword('')
  }

  // -----------------------------------------
  // Login
  // -----------------------------------------

  const handleLogin = async (
    event
  ) => {
    event.preventDefault()

    setError('')
    setSuccess('')

    if (
      !email.trim() ||
      !password
    ) {
      setError(
        'Please enter your email and password.'
      )

      return
    }

    try {
      setLoading(true)

      const response =
        await fetch(
          `${API_URL}/auth/login`,
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',
            },

            body: JSON.stringify({
              email:
                email.trim(),
              password,
            }),
          }
        )

      const data =
        await response.json()

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            'Login failed.'
        )
      }

      sessionStorage.setItem(
        'veloop_token',
        data.token
      )

      setUser(
        data.user || null
      )

      setIsLoggedIn(true)

      setSuccess(
        'Login successful!'
      )

      setTimeout(() => {
        setShowLogin(false)
        setSuccess('')

        setEmail('')
        setPassword('')
      }, 700)
    } catch (loginError) {
      console.error(
        'Login error:',
        loginError
      )

      setError(
        loginError.message ||
          'Unable to connect to the server. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  // -----------------------------------------
  // Register account
  // -----------------------------------------

  const handleRegister = async (event) => {
    event.preventDefault()

    setError('')
    setSuccess('')

    if (!registerName.trim() || !email.trim() || !password) {
      setError(
        'Please enter your name, email and password.'
      )
      return
    }

    if (password.length < 8) {
      setError(
        'Password must contain at least 8 characters.'
      )
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    try {
      setLoading(true)

      const response =
        await fetch(
          `${API_URL}/auth/register`,
          {
            method: 'POST',
            headers: {
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify({
              name: registerName.trim(),
              email: email.trim(),
              password,
            }),
          }
        )

      const data =
        await response.json()

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            'Unable to create your account.'
        )
      }

      setAuthMode('login')
      setRegisterName('')
      setConfirmPassword('')
      setPassword('')

      setSuccess(
        data.message ||
          'Account created successfully. You can now log in.'
      )
    } catch (registerError) {
      console.error(
        'Registration error:',
        registerError
      )

      setError(
        registerError.message ||
          'Unable to create your account.'
      )
    } finally {
      setLoading(false)
    }
  }

  // -----------------------------------------
  // Logout
  // -----------------------------------------

  const handleLogout = () => {
    sessionStorage.removeItem(
      'veloop_token'
    )

    setIsLoggedIn(false)
    setUser(null)

    setChallengeStarted(false)
    setCaptcha(null)

    setSelectedOption('')

    setVerificationState(
      'idle'
    )

    setClaimPhase('idle')

    setReward(0)

    setTransactions([])

    setLastResult(null)

    setError('')
    setSuccess('')
  }

  // -----------------------------------------
  // Start / New CAPTCHA challenge
  // -----------------------------------------

  const startChallenge =
    async () => {
      if (!isLoggedIn) {
        openLogin()
        return
      }

      const token =
        sessionStorage.getItem(
          'veloop_token'
        )

      if (!token) {
        setIsLoggedIn(false)
        openLogin()
        return
      }

      try {
        setChallengeLoading(true)

        setError('')
        setSuccess('')

        setSelectedOption('')

        setLastResult(null)

        setVerificationState(
          'idle'
        )

        setClaimPhase('idle')

        setChallengeStarted(false)

        // -----------------------------------
        // Generate challenge
        // -----------------------------------

        const response =
          await fetch(
            `${API_URL}/captcha/generate`,
            {
              method: 'GET',

              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          )

        const data =
          await response.json()

        if (
          response.status === 401 ||
          response.status === 403
        ) {
          sessionStorage.removeItem(
            'veloop_token'
          )

          setIsLoggedIn(false)
          setUser(null)

          openLogin()

          throw new Error(
            'Your session has expired. Please login again.'
          )
        }

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
              'Unable to start CAPTCHA challenge.'
          )
        }

        const challengeData =
          data.data ||
          data.challenge ||
          data.captcha ||
          data

        if (
          !challengeData.challengeId ||
          !Array.isArray(
            challengeData.options
          ) ||
          challengeData.options
            .length !== 4
        ) {
          throw new Error(
            'Invalid CAPTCHA challenge received from server.'
          )
        }

        // -----------------------------------
        // Fetch visual CAPTCHA image
        // -----------------------------------

        const imageResponse =
          await fetch(
            `${API_URL}/captcha/image/${encodeURIComponent(
              challengeData.challengeId
            )}`,
            {
              method: 'GET',

              headers: {
                Authorization:
                  `Bearer ${token}`,
              },

              cache: 'no-store',
            }
          )

        if (
          imageResponse.status ===
            401 ||
          imageResponse.status ===
            403
        ) {
          sessionStorage.removeItem(
            'veloop_token'
          )

          setIsLoggedIn(false)
          setUser(null)

          openLogin()

          throw new Error(
            'Your session has expired. Please login again.'
          )
        }

        if (
          !imageResponse.ok
        ) {
          let imageErrorMessage =
            'Unable to load CAPTCHA image.'

          try {
            const imageError =
              await imageResponse.json()

            imageErrorMessage =
              imageError.message ||
              imageErrorMessage
          } catch {
            // Keep default message
          }

          throw new Error(
            imageErrorMessage
          )
        }

        const imageBlob =
          await imageResponse.blob()

        const imageUrl =
          URL.createObjectURL(
            imageBlob
          )

        // -----------------------------------
        // Store safe challenge data
        // -----------------------------------

        setCaptcha({
          ...challengeData,
          captchaImage:
            imageUrl,
        })

        setChallengeStarted(
          true
        )
      } catch (challengeError) {
        console.error(
          'Challenge error:',
          challengeError
        )

        setError(
          challengeError.message ||
            'Unable to start the CAPTCHA challenge.'
        )
      } finally {
        setChallengeLoading(
          false
        )
      }
    }

  // -----------------------------------------
  // Verify CAPTCHA
  // -----------------------------------------

  const submitCaptcha =
    async (option) => {
      if (!isLoggedIn) {
        openLogin()
        return
      }

      if (
        !captcha?.challengeId
      ) {
        setError(
          'Please start a CAPTCHA challenge first.'
        )

        return
      }

      if (!option) {
        setError(
          'Please select one option.'
        )

        return
      }

      const token =
        sessionStorage.getItem(
          'veloop_token'
        )

      if (!token) {
        setIsLoggedIn(false)
        openLogin()
        return
      }

      try {
        setSubmitLoading(true)

        setError('')
        setSuccess('')

        const response =
          await fetch(
            `${API_URL}/captcha/submit`,
            {
              method: 'POST',

              headers: {
                'Content-Type':
                  'application/json',

                Authorization:
                  `Bearer ${token}`,
              },

              body: JSON.stringify({
                challengeId:
                  captcha.challengeId,

                selectedOption:
                  option,
              }),
            }
          )

        const data =
          await response.json()

        if (
          response.status === 401 ||
          response.status === 403
        ) {
          sessionStorage.removeItem(
            'veloop_token'
          )

          setIsLoggedIn(false)
          setUser(null)
          setReward(0)

          openLogin()

          throw new Error(
            'Your session has expired. Please login again.'
          )
        }

        if (
          !response.ok
        ) {
          throw new Error(
            data.message ||
              'Unable to verify CAPTCHA.'
          )
        }

        // -----------------------------------
        // Backend determines reward
        // -----------------------------------

        const earned =
          Number(
            data.reward?.amount ??
              data.rewardAmount ??
              0
          )

        const isCorrect =
          Boolean(
            data.correct
          )

        // -----------------------------------
        // IMPORTANT:
        // Wallet is NOT updated here.
        //
        // Reward is pending until CLAIM.
        // -----------------------------------

        setLastResult({
          challengeId:
            data.challengeId ||
            captcha.challengeId,

          correct:
            isCorrect,

          rewardAmount:
            earned,

          result:
            data.result,

          rewardStatus:
            'pending',
        })

        setVerificationState(
          'result'
        )

        setChallengeStarted(
          false
        )

        if (isCorrect) {
          setSuccess(
            'CAPTCHA verified successfully. Your reward is ready to claim.'
          )
        } else {
          setSuccess(
            'Answer verified. Your reward is ready to claim.'
          )
        }
      } catch (submitError) {
        console.error(
          'Submit CAPTCHA error:',
          submitError
        )

        setVerificationState(
          'idle'
        )

        setError(
          submitError.message ||
            'Unable to verify CAPTCHA.'
        )
      } finally {
        setSubmitLoading(
          false
        )
      }
    }

  // -----------------------------------------
  // Automatic option selection
  // -----------------------------------------

  const handleOptionSelect =
    async (option) => {
      if (
        submitLoading ||
        challengeLoading ||
        claimLoading ||
        !challengeStarted
      ) {
        return
      }

      // Lock immediately
      setSelectedOption(
        option
      )

      setError('')
      setSuccess('')

      setLastResult(null)

      setVerificationState(
        'checking'
      )

      // -----------------------------------
      // UI-only verification animation
      // ~0.5 seconds
      // -----------------------------------

      await wait(500)

      // -----------------------------------
      // Actual result comes from backend
      // -----------------------------------

      await submitCaptcha(option)
    }

  // -----------------------------------------
  // Claim reward
  // -----------------------------------------

  const handleClaim =
    async () => {
      if (
        !lastResult?.challengeId ||
        claimLoading
      ) {
        return
      }

      const token =
        sessionStorage.getItem(
          'veloop_token'
        )

      if (!token) {
        setIsLoggedIn(false)
        openLogin()
        return
      }

      try {
        setClaimLoading(true)

        setError('')
        setSuccess('')

        // -----------------------------------
        // Preparing reward
        // -----------------------------------

        setClaimPhase(
          'preparing'
        )

        await wait(650)

        // -----------------------------------
        // Mock rewarded ad
        // -----------------------------------

        setClaimPhase(
          'mock-ad'
        )

        await wait(1000)

        // -----------------------------------
        // Backend claim
        // -----------------------------------

        setClaimPhase(
          'claiming'
        )

        const response =
          await fetch(
            `${API_URL}/captcha/claim`,
            {
              method: 'POST',

              headers: {
                'Content-Type':
                  'application/json',

                Authorization:
                  `Bearer ${token}`,
              },

              body: JSON.stringify({
                challengeId:
                  lastResult.challengeId,
              }),
            }
          )

        const data =
          await response.json()

        if (
          response.status === 401 ||
          response.status === 403
        ) {
          sessionStorage.removeItem(
            'veloop_token'
          )

          setIsLoggedIn(false)
          setUser(null)
          setReward(0)

          openLogin()

          throw new Error(
            'Your session has expired. Please login again.'
          )
        }

        if (
          response.status ===
          409
        ) {
          throw new Error(
            data.message ||
              'This reward has already been claimed.'
          )
        }

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
              'Unable to claim reward.'
          )
        }

        // -----------------------------------
        // Claim successful
        // -----------------------------------

        setClaimPhase(
          'completed'
        )

        // -----------------------------------
        // Server-authoritative wallet refresh
        // -----------------------------------

        await fetchWalletBalance()
        await fetchWalletTransactions()

        const claimedAmount =
          Number(
            data.reward?.amount ??
              lastResult.rewardAmount ??
              0
          )

        setLastResult(
          (previous) =>
            previous
              ? {
                  ...previous,

                  rewardAmount:
                    claimedAmount,

                  rewardStatus:
                    'claimed',
                }
              : previous
        )

        setSuccess(
          `${formatGemAmount(
            claimedAmount
          )} claimed successfully.`
        )

        // -----------------------------------
        // New CAPTCHA after claim
        // -----------------------------------

        await wait(900)

        setLastResult(null)
        setSelectedOption('')

        setVerificationState(
          'idle'
        )

        setClaimPhase('idle')

        setCaptcha(null)

        await startChallenge()
      } catch (claimError) {
        console.error(
          'Claim reward error:',
          claimError
        )

        setClaimPhase(
          'idle'
        )

        setError(
          claimError.message ||
            'Unable to claim reward.'
        )
      } finally {
        setClaimLoading(
          false
        )
      }
    }

  // -----------------------------------------
  // No Thanks
  // -----------------------------------------

  const handleNoThanks =
    async () => {
      if (
        !lastResult?.challengeId ||
        claimLoading
      ) {
        return
      }

      const token =
        sessionStorage.getItem(
          'veloop_token'
        )

      if (!token) {
        setIsLoggedIn(false)
        openLogin()
        return
      }

      try {
        setClaimLoading(true)

        setError('')
        setSuccess('')

        // -----------------------------------
        // Tell backend that current challenge
        // is being skipped.
        // -----------------------------------

        const response =
          await fetch(
            `${API_URL}/captcha/skip`,
            {
              method: 'POST',

              headers: {
                'Content-Type':
                  'application/json',

                Authorization:
                  `Bearer ${token}`,
              },

              body: JSON.stringify({
                challengeId:
                  lastResult.challengeId,
              }),
            }
          )

        const data =
          await response.json()

        /*
          The current backend may return a
          conflict for an already-completed
          challenge because its skip filter
          currently targets active challenges.

          The completed challenge can never be
          submitted again, so we continue to
          a fresh challenge here.
        */

        if (
          response.status === 401 ||
          response.status === 403
        ) {
          sessionStorage.removeItem(
            'veloop_token'
          )

          setIsLoggedIn(false)
          setUser(null)
          setReward(0)

          openLogin()

          throw new Error(
            'Your session has expired. Please login again.'
          )
        }

        if (
          !response.ok &&
          response.status !== 409
        ) {
          throw new Error(
            data.message ||
              'Unable to continue with a new CAPTCHA.'
          )
        }

        // -----------------------------------
        // Move to new challenge
        // -----------------------------------

        setLastResult(null)
        setSelectedOption('')

        setVerificationState(
          'idle'
        )

        setClaimPhase('idle')

        setCaptcha(null)

        await startChallenge()
      } catch (skipError) {
        console.error(
          'No Thanks error:',
          skipError
        )

        setError(
          skipError.message ||
            'Unable to load a new CAPTCHA.'
        )
      } finally {
        setClaimLoading(
          false
        )
      }
    }

  // -----------------------------------------
  // Render
  // -----------------------------------------

  return (
    <div className="app">

      {/* ================================= */}
      {/* NAVBAR */}
      {/* ================================= */}

      <nav className="navbar">

        <div className="logo">

          <span className="logo-mark">
            V
          </span>

          <span>
            VELoop
          </span>

        </div>

        <div className="nav-links">

          <a href="#home">
            Home
          </a>

          <a href="#how-it-works">
            How It Works
          </a>

          <a href="#rewards">
            Rewards
          </a>

          {isLoggedIn && (
            <a href="#wallet-history">
              History
            </a>
          )}

          {isLoggedIn ? (
            <button
              className="login-btn"
              onClick={
                handleLogout
              }
              type="button"
              disabled={
                challengeLoading ||
                submitLoading ||
                claimLoading
              }
            >
              Logout
            </button>
          ) : (
            <>
              <button
                className="login-btn"
                onClick={
                  openLogin
                }
                type="button"
              >
                Login
              </button>

              <button
                type="button"
                onClick={
                  openRegister
                }
                style={{
                  marginLeft: '10px',
                  padding: '10px 16px',
                  borderRadius: '10px',
                  border: '1px solid rgba(139,92,246,0.45)',
                  background: 'rgba(139,92,246,0.10)',
                  color: '#e9ddff',
                  fontWeight: '700',
                  cursor: 'pointer',
                }}
              >
                Create Account
              </button>
            </>
          )}

        </div>

      </nav>

      {/* ================================= */}
      {/* HERO */}
      {/* ================================= */}

      <main
        id="home"
        className="hero-section"
      >

        {/* ================================= */}
        {/* HERO CONTENT */}
        {/* ================================= */}

        <div className="hero-content">

          <span className="badge">
            ⚡ CAPTCHA • EARN • REPEAT
          </span>

          <h1>
            Solve CAPTCHAs.
            <br />

            <span>
              Earn Rewards.
            </span>
          </h1>

          <p>
            Turn your spare time into
            rewards by solving simple
            CAPTCHA challenges on VELoop.
          </p>

          <div className="hero-actions">

            <button
              className="primary-btn"
              type="button"
              onClick={
                startChallenge
              }
              disabled={
                challengeLoading ||
                submitLoading ||
                claimLoading
              }
            >
              {challengeLoading
                ? 'Generating...'
                : isLoggedIn
                ? 'Start Earning'
                : 'Get Started'}
            </button>

            <a
              href="#how-it-works"
              className="secondary-btn"
            >
              Learn More
            </a>

          </div>

          {/* User */}

          {isLoggedIn && (
            <div
              style={{
                marginTop:
                  '20px',
                color:
                  '#9ca7bb',
                fontSize:
                  '14px',
              }}
            >

              Welcome back
              {user?.name
                ? ', '
                : ' '}

              <strong
                style={{
                  color:
                    '#ffffff',
                }}
              >
                {user?.name ||
                  'VELoop User'}
              </strong>

            </div>
          )}

          {/* Wallet */}

          {isLoggedIn && (
            <div
              style={{
                marginTop:
                  '12px',
                color:
                  '#c4b5fd',
                fontSize:
                  '14px',
              }}
            >

              Gems Balance:{' '}

              <strong>
                {reward.toFixed(1)}
              </strong>

            </div>
          )}

        </div>

        {/* ================================= */}
        {/* CAPTCHA CARD */}
        {/* ================================= */}

        <div className="hero-card">

          {/* Header */}

          <div className="card-header">

            <span>
              CAPTCHA Challenge
            </span>

            <span className="status">
              ●{' '}
              {claimLoading
                ? 'Processing'
                : verificationState ===
                  'checking'
                ? 'Verifying'
                : 'Active'}
            </span>

          </div>

          <div className="captcha-box">

            {/* ================================= */}
            {/* CAPTCHA IMAGE */}
            {/* ================================= */}

            <div
              style={{
                width:
                  '100%',
                marginBottom:
                  '16px',
                borderRadius:
                  '14px',
                overflow:
                  'hidden',
                background:
                  '#0b0f1a',
                border:
                  '1px solid rgba(255,255,255,0.08)',
                minHeight:
                  '130px',
                display:
                  'flex',
                alignItems:
                  'center',
                justifyContent:
                  'center',
              }}
            >

              {captcha?.captchaImage ? (
                <img
                  src={
                    captcha.captchaImage
                  }
                  alt="CAPTCHA challenge"
                  style={{
                    display:
                      'block',
                    width:
                      '100%',
                    height:
                      'auto',
                    minHeight:
                      '130px',
                    objectFit:
                      'cover',
                  }}
                />
              ) : (
                <div
                  style={{
                    color:
                      '#8d98ac',
                    fontSize:
                      '14px',
                    padding:
                      '20px',
                    textAlign:
                      'center',
                  }}
                >
                  {challengeLoading
                    ? 'Generating secure CAPTCHA...'
                    : isLoggedIn
                    ? 'Click Start Earning to generate a CAPTCHA.'
                    : 'Login to start a CAPTCHA challenge.'}
                </div>
              )}

            </div>

            {/* ================================= */}
            {/* EXPIRY */}
            {/* ================================= */}

            {captcha?.expiresAt && (
              <div
                style={{
                  display:
                    'flex',
                  justifyContent:
                    'space-between',
                  alignItems:
                    'center',
                  marginBottom:
                    '12px',
                  color:
                    '#77839a',
                  fontSize:
                    '11px',
                }}
              >

                <span>
                  Secure server challenge
                </span>

                <span>
                  Expires:{' '}
                  {new Date(
                    captcha.expiresAt
                  ).toLocaleTimeString(
                    [],
                    {
                      hour:
                        '2-digit',
                      minute:
                        '2-digit',
                    }
                  )}
                </span>

              </div>
            )}

            {/* ================================= */}
            {/* INSTRUCTION */}
            {/* ================================= */}

            <p
              style={{
                marginBottom:
                  '14px',
              }}
            >
              {verificationState ===
              'checking'
                ? 'Checking your answer...'
                : lastResult
                ? 'Verification complete.'
                : 'Select the option that matches the CAPTCHA above.'}
            </p>

            {/* ================================= */}
            {/* OPTIONS */}
            {/* ================================= */}

            <div
              style={{
                display:
                  'grid',
                gridTemplateColumns:
                  'repeat(2, minmax(0, 1fr))',
                gap:
                  '10px',
                marginBottom:
                  '16px',
              }}
            >

              {captcha?.options?.map(
                (
                  option,
                  index
                ) => {

                  const isSelected =
                    selectedOption ===
                    option

                  const isLocked =
                    submitLoading ||
                    claimLoading ||
                    verificationState ===
                      'checking' ||
                    !challengeStarted

                  return (
                    <button
                      key={`${option}-${index}`}
                      type="button"
                      onClick={() =>
                        handleOptionSelect(
                          option
                        )
                      }
                      disabled={
                        isLocked
                      }
                      style={{
                        minHeight:
                          '52px',

                        padding:
                          '10px 12px',

                        borderRadius:
                          '10px',

                        border:
                          isSelected
                            ? '2px solid #8b5cf6'
                            : '1px solid #263044',

                        background:
                          isSelected
                            ? 'rgba(124,58,237,0.18)'
                            : '#0b0f1a',

                        color:
                          '#ffffff',

                        fontWeight:
                          '700',

                        fontSize:
                          '14px',

                        cursor:
                          isLocked
                            ? 'not-allowed'
                            : 'pointer',

                        transition:
                          'all 0.2s ease',

                        opacity:
                          isLocked &&
                          !isSelected
                            ? 0.65
                            : 1,

                        boxShadow:
                          isSelected
                            ? '0 0 0 1px rgba(139,92,246,0.15), 0 8px 24px rgba(124,58,237,0.12)'
                            : 'none',
                      }}
                    >

                      {isSelected &&
                      verificationState ===
                        'checking'
                        ? '◉ '
                        : ''}

                      {option}

                    </button>
                  )
                }
              )}

            </div>

            {/* ================================= */}
            {/* CHECKING STATE */}
            {/* ================================= */}

            {verificationState ===
              'checking' && (
              <div
                style={{
                  marginTop:
                    '12px',
                  padding:
                    '18px 14px',
                  borderRadius:
                    '12px',
                  background:
                    'rgba(124,58,237,0.08)',
                  border:
                    '1px solid rgba(139,92,246,0.22)',
                  textAlign:
                    'center',
                }}
              >

                <div
                  style={{
                    width:
                      '28px',
                    height:
                      '28px',
                    margin:
                      '0 auto 10px',
                    border:
                      '3px solid rgba(139,92,246,0.25)',
                    borderTopColor:
                      '#a78bfa',
                    borderRadius:
                      '50%',
                    animation:
                      'spin 0.8s linear infinite',
                  }}
                />

                <div
                  style={{
                    color:
                      '#e9ddff',
                    fontWeight:
                      '700',
                    fontSize:
                      '14px',
                  }}
                >
                  Checking your answer...
                </div>

                <div
                  style={{
                    marginTop:
                      '5px',
                    color:
                      '#8d98ac',
                    fontSize:
                      '12px',
                  }}
                >
                  Securely verifying with VELoop.
                </div>

              </div>
            )}

            {/* ================================= */}
            {/* RESULT STATE */}
            {/* ================================= */}

            {lastResult &&
              verificationState ===
                'result' && (
              <div
                style={{
                  marginTop:
                    '14px',
                  padding:
                    '16px',
                  borderRadius:
                    '12px',
                  background:
                    lastResult.correct
                      ? 'rgba(74,222,128,0.08)'
                      : 'rgba(251,191,36,0.08)',
                  border:
                    lastResult.correct
                      ? '1px solid rgba(74,222,128,0.28)'
                      : '1px solid rgba(251,191,36,0.28)',
                }}
              >

                <div
                  style={{
                    textAlign:
                      'center',
                  }}
                >

                  <div
                    style={{
                      fontSize:
                        '26px',
                      marginBottom:
                        '5px',
                    }}
                  >
                    {lastResult.correct
                      ? '✓'
                      : '✕'}
                  </div>

                  <div
                    style={{
                      color:
                        lastResult.correct
                          ? '#86efac'
                          : '#fcd34d',

                      fontWeight:
                        '800',

                      fontSize:
                        '16px',
                    }}
                  >
                    {lastResult.correct
                      ? 'CAPTCHA Verified'
                      : 'Verification Complete'}
                  </div>

                  <div
                    style={{
                      marginTop:
                        '6px',

                      color:
                        '#b8c2d2',

                      fontSize:
                        '12px',
                    }}
                  >
                    {lastResult.correct
                      ? 'Your answer was correct.'
                      : 'That answer was not correct.'}
                  </div>

                  <div
                    style={{
                      marginTop:
                        '12px',

                      fontSize:
                        '20px',

                      fontWeight:
                        '800',

                      color:
                        '#ffffff',
                    }}
                  >
                    +
                    {lastResult.rewardAmount}{' '}
                    {formatGemAmount(
                      lastResult.rewardAmount
                    ).replace(
                      `${lastResult.rewardAmount} `,
                      ''
                    )}
                  </div>

                  {lastResult.rewardStatus ===
                    'pending' && (
                    <div
                      style={{
                        marginTop:
                          '5px',

                        color:
                          '#8d98ac',

                        fontSize:
                          '11px',
                      }}
                    >
                      Reward pending claim
                    </div>
                  )}

                  {lastResult.rewardStatus ===
                    'claimed' && (
                    <div
                      style={{
                        marginTop:
                          '5px',

                        color:
                          '#86efac',

                        fontSize:
                          '11px',
                      }}
                    >
                      Reward claimed successfully
                    </div>
                  )}

                </div>

                {/* ================================= */}
                {/* CLAIM / NO THANKS */}
                {/* ================================= */}

                {lastResult.rewardStatus ===
                  'pending' && (
                  <div
                    style={{
                      display:
                        'grid',
                      gridTemplateColumns:
                        '1fr 1fr',
                      gap:
                        '10px',
                      marginTop:
                        '16px',
                    }}
                  >

                    <button
                      type="button"
                      onClick={
                        handleClaim
                      }
                      disabled={
                        claimLoading
                      }
                      style={{
                        minHeight:
                          '46px',

                        border:
                          'none',

                        borderRadius:
                          '10px',

                        background:
                          claimLoading
                            ? '#374151'
                            : 'linear-gradient(135deg,#10b981,#059669)',

                        color:
                          '#ffffff',

                        fontWeight:
                          '800',

                        cursor:
                          claimLoading
                            ? 'not-allowed'
                            : 'pointer',

                        boxShadow:
                          claimLoading
                            ? 'none'
                            : '0 8px 22px rgba(16,185,129,0.18)',
                      }}
                    >
                      {claimLoading
                        ? 'Processing...'
                        : 'Claim'}
                    </button>

                    <button
                      type="button"
                      onClick={
                        handleNoThanks
                      }
                      disabled={
                        claimLoading
                      }
                      style={{
                        minHeight:
                          '46px',

                        border:
                          '1px solid #303a52',

                        borderRadius:
                          '10px',

                        background:
                          'rgba(255,255,255,0.04)',

                        color:
                          '#dbe4f0',

                        fontWeight:
                          '700',

                        cursor:
                          claimLoading
                            ? 'not-allowed'
                            : 'pointer',
                      }}
                    >
                      No Thanks
                    </button>

                  </div>
                )}

              </div>
            )}

            {/* ================================= */}
            {/* CLAIM FLOW */}
            {/* ================================= */}

            {claimLoading && (
              <div
                style={{
                  marginTop:
                    '14px',

                  padding:
                    '18px 14px',

                  borderRadius:
                    '12px',

                  background:
                    'rgba(99,102,241,0.08)',

                  border:
                    '1px solid rgba(99,102,241,0.22)',

                  textAlign:
                    'center',
                }}
              >

                <div
                  style={{
                    fontSize:
                      '24px',
                    marginBottom:
                      '8px',
                  }}
                >
                  {claimPhase ===
                  'preparing'
                    ? '⏳'
                    : claimPhase ===
                      'mock-ad'
                    ? '▶'
                    : claimPhase ===
                      'claiming'
                    ? '🔐'
                    : '✓'}
                </div>

                <div
                  style={{
                    color:
                      '#ffffff',
                    fontWeight:
                      '800',
                    fontSize:
                      '14px',
                  }}
                >
                  {claimPhase ===
                    'preparing' &&
                    'Preparing reward...'}

                  {claimPhase ===
                    'mock-ad' &&
                    'Mock Rewarded Ad'}

                  {claimPhase ===
                    'claiming' &&
                    'Finalizing reward...'}

                  {claimPhase ===
                    'completed' &&
                    'Reward completed'}
                </div>

                <div
                  style={{
                    marginTop:
                      '6px',
                    color:
                      '#8d98ac',
                    fontSize:
                      '11px',
                  }}
                >
                  Development/demo reward flow
                </div>

              </div>
            )}

            {/* ================================= */}
            {/* ERROR */}
            {/* ================================= */}

            {error && (
              <div
                style={{
                  marginTop:
                    '14px',
                  padding:
                    '12px 14px',
                  borderRadius:
                    '10px',
                  background:
                    'rgba(239,68,68,0.10)',
                  border:
                    '1px solid rgba(239,68,68,0.25)',
                  color:
                    '#fca5a5',
                  fontSize:
                    '13px',
                }}
              >
                {error}
              </div>
            )}

            {/* ================================= */}
            {/* SUCCESS */}
            {/* ================================= */}

            {success && (
              <div
                style={{
                  marginTop:
                    '14px',
                  padding:
                    '12px 14px',
                  borderRadius:
                    '10px',
                  background:
                    'rgba(74,222,128,0.10)',
                  border:
                    '1px solid rgba(74,222,128,0.25)',
                  color:
                    '#86efac',
                  fontSize:
                    '13px',
                }}
              >
                {success}
              </div>
            )}

            {/* ================================= */}
            {/* NEW CHALLENGE */}
            {/* ================================= */}

            {!lastResult &&
              !challengeStarted && (
              <button
                type="button"
                onClick={
                  startChallenge
                }
                disabled={
                  challengeLoading ||
                  submitLoading ||
                  claimLoading
                }
                style={{
                  width:
                    '100%',
                  marginTop:
                    '10px',
                  padding:
                    '11px',
                  borderRadius:
                    '10px',
                  border:
                    '1px solid #303a52',
                  background:
                    'rgba(255,255,255,0.04)',
                  color:
                    '#dbe4f0',
                  fontWeight:
                    '700',
                  cursor:
                    challengeLoading ||
                    claimLoading
                      ? 'not-allowed'
                      : 'pointer',
                }}
              >
                {challengeLoading
                  ? 'Generating...'
                  : 'New Challenge'}
              </button>
            )}

          </div>

          {/* ================================= */}
          {/* REWARD FOOTER */}
          {/* ================================= */}

          <div className="reward">

            <span>
              Reward
            </span>

            <strong>
              {lastResult
                ? `+${lastResult.rewardAmount} ${formatGemAmount(
                    lastResult.rewardAmount
                  ).replace(
                    `${lastResult.rewardAmount} `,
                    ''
                  )}`
                : 'Earn Gems'}
            </strong>

          </div>

        </div>
      </main>

      {/* ================================= */}
      {/* FEATURES */}
      {/* ================================= */}

      <section
        id="how-it-works"
        className="features"
      >

        <div className="feature">

          <div className="feature-icon">
            🎯
          </div>

          <h3>
            Solve CAPTCHA
          </h3>

          <p>
            Complete simple CAPTCHA
            challenges quickly and easily.
          </p>

        </div>

        <div className="feature">

          <div className="feature-icon">
            💰
          </div>

          <h3>
            Earn Gems
          </h3>

          <p>
            Earn Gems after successful
            backend verification and claim.
          </p>

        </div>

        <div
          className="feature"
          id="rewards"
        >

          <div className="feature-icon">
            🎁
          </div>

          <h3>
            Claim Rewards
          </h3>

          <p>
            Claim verified rewards securely
            through the VELoop backend.
          </p>

        </div>

      </section>

      {/* ================================= */}
      {/* TRANSACTION HISTORY */}
      {/* ================================= */}

      {isLoggedIn && (
        <section
          id="wallet-history"
          style={{
            width: '100%',
            maxWidth: '1100px',
            margin: '10px auto 70px',
            padding: '0 24px',
            boxSizing: 'border-box',
          }}
        >

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              marginBottom: '18px',
              flexWrap: 'wrap',
            }}
          >

            <div>
              <div
                style={{
                  color: '#ffffff',
                  fontSize: '24px',
                  fontWeight: '800',
                }}
              >
                Gem Transaction History
              </div>

              <div
                style={{
                  marginTop: '6px',
                  color: '#8d98ac',
                  fontSize: '13px',
                }}
              >
                Your reward activity comes directly from the VELoop API.
              </div>
            </div>

            <button
              type="button"
              onClick={fetchWalletTransactions}
              disabled={transactionLoading}
              style={{
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid #303a52',
                background: 'rgba(255,255,255,0.04)',
                color: '#dbe4f0',
                fontWeight: '700',
                cursor: transactionLoading
                  ? 'not-allowed'
                  : 'pointer',
                opacity: transactionLoading ? 0.65 : 1,
              }}
            >
              {transactionLoading ? 'Refreshing...' : 'Refresh History'}
            </button>

          </div>

          <div
            style={{
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '18px',
              background: '#0f1522',
              overflow: 'hidden',
              boxShadow: '0 18px 50px rgba(0,0,0,0.18)',
            }}
          >

            {transactionLoading && transactions.length === 0 ? (
              <div
                style={{
                  padding: '28px 20px',
                  textAlign: 'center',
                  color: '#8d98ac',
                  fontSize: '14px',
                }}
              >
                Loading transaction history...
              </div>
            ) : transactions.length === 0 ? (
              <div
                style={{
                  padding: '28px 20px',
                  textAlign: 'center',
                  color: '#8d98ac',
                  fontSize: '14px',
                }}
              >
                No GEM transactions found yet.
              </div>
            ) : (
              <div
                style={{
                  width: '100%',
                  overflowX: 'auto',
                }}
              >

                <table
                  style={{
                    width: '100%',
                    minWidth: '760px',
                    borderCollapse: 'collapse',
                  }}
                >

                  <thead>
                    <tr>
                      {[
                        'Date',
                        'Type',
                        'Amount',
                        'Before',
                        'After',
                        'Status',
                        'Reference',
                      ].map((heading) => (
                        <th
                          key={heading}
                          style={{
                            padding: '15px 14px',
                            textAlign: 'left',
                            color: '#8d98ac',
                            fontSize: '11px',
                            fontWeight: '800',
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                            borderBottom:
                              '1px solid rgba(255,255,255,0.08)',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {transactions.map((transaction) => {
                      const amount = Number(transaction.amount) || 0
                      const before = Number(transaction.balanceBefore) || 0
                      const after = Number(transaction.balanceAfter) || 0

                      return (
                        <tr
                          key={
                            transaction.transactionId ||
                            transaction.referenceId
                          }
                        >

                          <td
                            style={{
                              padding: '16px 14px',
                              borderBottom:
                                '1px solid rgba(255,255,255,0.05)',
                              color: '#cbd5e1',
                              fontSize: '12px',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {transaction.createdAt
                              ? new Date(
                                  transaction.createdAt
                                ).toLocaleString([], {
                                  dateStyle: 'medium',
                                  timeStyle: 'short',
                                })
                              : '-'}
                          </td>

                          <td
                            style={{
                              padding: '16px 14px',
                              borderBottom:
                                '1px solid rgba(255,255,255,0.05)',
                              color: '#ffffff',
                              fontSize: '12px',
                              fontWeight: '700',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {transaction.type || 'GEM TRANSACTION'}
                          </td>

                          <td
                            style={{
                              padding: '16px 14px',
                              borderBottom:
                                '1px solid rgba(255,255,255,0.05)',
                              color: '#86efac',
                              fontSize: '13px',
                              fontWeight: '800',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            +{amount} GEM
                          </td>

                          <td
                            style={{
                              padding: '16px 14px',
                              borderBottom:
                                '1px solid rgba(255,255,255,0.05)',
                              color: '#cbd5e1',
                              fontSize: '12px',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {before.toFixed(1)}
                          </td>

                          <td
                            style={{
                              padding: '16px 14px',
                              borderBottom:
                                '1px solid rgba(255,255,255,0.05)',
                              color: '#ffffff',
                              fontSize: '12px',
                              fontWeight: '700',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {after.toFixed(1)}
                          </td>

                          <td
                            style={{
                              padding: '16px 14px',
                              borderBottom:
                                '1px solid rgba(255,255,255,0.05)',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '5px 8px',
                                borderRadius: '999px',
                                background:
                                  'rgba(74,222,128,0.10)',
                                border:
                                  '1px solid rgba(74,222,128,0.22)',
                                color: '#86efac',
                                fontSize: '10px',
                                fontWeight: '800',
                              }}
                            >
                              {transaction.status || 'COMPLETED'}
                            </span>
                          </td>

                          <td
                            style={{
                              padding: '16px 14px',
                              borderBottom:
                                '1px solid rgba(255,255,255,0.05)',
                              color: '#8d98ac',
                              fontSize: '11px',
                              fontFamily:
                                'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                              maxWidth: '180px',
                            }}
                          >
                            <span
                              title={
                                transaction.referenceId || ''
                              }
                            >
                              {(transaction.referenceId || '-').length > 18
                                ? `${transaction.referenceId.slice(0, 18)}...`
                                : transaction.referenceId || '-'}
                            </span>
                          </td>

                        </tr>
                      )
                    })}
                  </tbody>

                </table>

              </div>
            )}

          </div>

        </section>
      )}

      {/* ================================= */}
      {/* AUTHENTICATION MODAL */}
      {/* ================================= */}

      {showLogin && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-title"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            background: 'rgba(0,0,0,0.72)',
            backdropFilter: 'blur(8px)',
          }}
        >

          <div
            style={{
              width: '100%',
              maxWidth: authMode === 'register' ? '460px' : '420px',
              padding: '30px',
              borderRadius: '20px',
              border: '1px solid rgba(255,255,255,0.1)',
              background: '#111726',
              boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
            }}
          >

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '24px',
              }}
            >

              <div>
                <div
                  id="auth-title"
                  style={{
                    fontSize: '24px',
                    fontWeight: '800',
                    color: '#ffffff',
                  }}
                >
                  {authMode === 'register'
                    ? 'Create your account'
                    : 'Welcome back'}
                </div>

                <div
                  style={{
                    marginTop: '6px',
                    color: '#8d98ac',
                    fontSize: '14px',
                  }}
                >
                  {authMode === 'register'
                    ? 'Join VELoop and start earning Gems.'
                    : 'Login to continue earning Gems.'}
                </div>
              </div>

              <button
                type="button"
                onClick={closeLogin}
                disabled={loading}
                aria-label="Close authentication modal"
                style={{
                  width: '34px',
                  height: '34px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '9px',
                  background: 'rgba(255,255,255,0.04)',
                  color: '#ffffff',
                  fontSize: '18px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                ×
              </button>

            </div>

            {authMode === 'register' ? (
              <form onSubmit={handleRegister}>

                {/* Name */}
                <label
                  htmlFor="register-name"
                  style={{
                    display: 'block',
                    marginBottom: '8px',
                    color: '#dbe4f0',
                    fontSize: '13px',
                    fontWeight: '600',
                  }}
                >
                  Full Name
                </label>

                <input
                  id="register-name"
                  type="text"
                  placeholder="Enter your name"
                  value={registerName}
                  onChange={(event) =>
                    setRegisterName(event.target.value)
                  }
                  autoComplete="name"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '13px 14px',
                    marginBottom: '18px',
                    borderRadius: '10px',
                    border: '1px solid #263044',
                    background: '#0b0f1a',
                    color: '#ffffff',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />

                {/* Email */}
                <label
                  htmlFor="register-email"
                  style={{
                    display: 'block',
                    marginBottom: '8px',
                    color: '#dbe4f0',
                    fontSize: '13px',
                    fontWeight: '600',
                  }}
                >
                  Email
                </label>

                <input
                  id="register-email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  autoComplete="email"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '13px 14px',
                    marginBottom: '18px',
                    borderRadius: '10px',
                    border: '1px solid #263044',
                    background: '#0b0f1a',
                    color: '#ffffff',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />

                {/* Password */}
                <label
                  htmlFor="register-password"
                  style={{
                    display: 'block',
                    marginBottom: '8px',
                    color: '#dbe4f0',
                    fontSize: '13px',
                    fontWeight: '600',
                  }}
                >
                  Password
                </label>

                <input
                  id="register-password"
                  type="password"
                  placeholder="Create a password (8+ characters)"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  autoComplete="new-password"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '13px 14px',
                    marginBottom: '18px',
                    borderRadius: '10px',
                    border: '1px solid #263044',
                    background: '#0b0f1a',
                    color: '#ffffff',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />

                {/* Confirm Password */}
                <label
                  htmlFor="register-confirm-password"
                  style={{
                    display: 'block',
                    marginBottom: '8px',
                    color: '#dbe4f0',
                    fontSize: '13px',
                    fontWeight: '600',
                  }}
                >
                  Confirm Password
                </label>

                <input
                  id="register-confirm-password"
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(event.target.value)
                  }
                  autoComplete="new-password"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '13px 14px',
                    marginBottom: '18px',
                    borderRadius: '10px',
                    border: '1px solid #263044',
                    background: '#0b0f1a',
                    color: '#ffffff',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />

                {error && (
                  <div
                    style={{
                      marginBottom: '16px',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      background: 'rgba(239,68,68,0.1)',
                      border: '1px solid rgba(239,68,68,0.25)',
                      color: '#fca5a5',
                      fontSize: '13px',
                    }}
                  >
                    {error}
                  </div>
                )}

                {success && (
                  <div
                    style={{
                      marginBottom: '16px',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      background: 'rgba(74,222,128,0.1)',
                      border: '1px solid rgba(74,222,128,0.25)',
                      color: '#86efac',
                      fontSize: '13px',
                    }}
                  >
                    {success}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '14px',
                    border: 'none',
                    borderRadius: '10px',
                    color: '#ffffff',
                    fontWeight: '700',
                    background: loading
                      ? '#4c1d95'
                      : 'linear-gradient(135deg,#7c3aed,#6366f1)',
                    opacity: loading ? 0.75 : 1,
                    cursor: loading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {loading
                    ? 'Creating account...'
                    : 'Create Account'}
                </button>

                <div
                  style={{
                    marginTop: '18px',
                    textAlign: 'center',
                    color: '#8d98ac',
                    fontSize: '13px',
                  }}
                >
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={switchToLogin}
                    disabled={loading}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      padding: 0,
                      color: '#c4b5fd',
                      fontWeight: '700',
                      cursor: loading ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Login
                  </button>
                </div>

              </form>
            ) : (
              <form onSubmit={handleLogin}>

                {/* Email */}
                <label
                  htmlFor="login-email"
                  style={{
                    display: 'block',
                    marginBottom: '8px',
                    color: '#dbe4f0',
                    fontSize: '13px',
                    fontWeight: '600',
                  }}
                >
                  Email
                </label>

                <input
                  id="login-email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  autoComplete="email"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '13px 14px',
                    marginBottom: '18px',
                    borderRadius: '10px',
                    border: '1px solid #263044',
                    background: '#0b0f1a',
                    color: '#ffffff',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />

                {/* Password */}
                <label
                  htmlFor="login-password"
                  style={{
                    display: 'block',
                    marginBottom: '8px',
                    color: '#dbe4f0',
                    fontSize: '13px',
                    fontWeight: '600',
                  }}
                >
                  Password
                </label>

                <input
                  id="login-password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  autoComplete="current-password"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '13px 14px',
                    marginBottom: '18px',
                    borderRadius: '10px',
                    border: '1px solid #263044',
                    background: '#0b0f1a',
                    color: '#ffffff',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />

                {error && (
                  <div
                    style={{
                      marginBottom: '16px',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      background: 'rgba(239,68,68,0.1)',
                      border: '1px solid rgba(239,68,68,0.25)',
                      color: '#fca5a5',
                      fontSize: '13px',
                    }}
                  >
                    {error}
                  </div>
                )}

                {success && (
                  <div
                    style={{
                      marginBottom: '16px',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      background: 'rgba(74,222,128,0.1)',
                      border: '1px solid rgba(74,222,128,0.25)',
                      color: '#86efac',
                      fontSize: '13px',
                    }}
                  >
                    {success}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '14px',
                    border: 'none',
                    borderRadius: '10px',
                    color: '#ffffff',
                    fontWeight: '700',
                    background: loading
                      ? '#4c1d95'
                      : 'linear-gradient(135deg,#7c3aed,#6366f1)',
                    opacity: loading ? 0.75 : 1,
                    cursor: loading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {loading ? 'Signing in...' : 'Login'}
                </button>

                <div
                  style={{
                    marginTop: '18px',
                    textAlign: 'center',
                    color: '#8d98ac',
                    fontSize: '13px',
                  }}
                >
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={switchToRegister}
                    disabled={loading}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      padding: 0,
                      color: '#c4b5fd',
                      fontWeight: '700',
                      cursor: loading ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Create Account
                  </button>
                </div>

              </form>
            )}

          </div>

        </div>
      )}

      {/* ================================= */}
      {/* Small verification spinner animation */}
      {/* ================================= */}

      <style>
        {`
          @keyframes spin {
            from {
              transform: rotate(0deg);
            }

            to {
              transform: rotate(360deg);
            }
          }
        `}
      </style>

    </div>
  )
}

export default App