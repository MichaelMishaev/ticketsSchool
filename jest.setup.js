// Jest setup file
// Add any global test setup here

// Load environment variables from .env file
const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '.env') })

// Increase timeout for integration tests
jest.setTimeout(30000)
