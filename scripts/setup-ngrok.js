#!/usr/bin/env node

/**
 * This script automatically sets up ngrok for development.
 * It:
 * 1. Starts ngrok to tunnel to localhost:3001
 * 2. Gets the public HTTPS URL via ngrok's API
 * 3. Updates the appview .env file with the ngrok URL
 * 4. Starts both the API server and client app
 */

const { execSync, spawn } = require('child_process')
const fs = require('fs')
const path = require('path')
const http = require('http')
const { URL } = require('url')

const appviewEnvPath = path.join(__dirname, '..', 'packages', 'appview', '.env')
const clientEnvPath = path.join(__dirname, '..', 'packages', 'client', '.env')

// Check if ngrok is installed
try {
  execSync('ngrok --version', { stdio: 'ignore' })
} catch (error) {
  console.error('❌ ngrok is not installed or not in your PATH.')
  console.error('Please install ngrok from https://ngrok.com/download')
  process.exit(1)
}

// Kill any existing ngrok processes
try {
  if (process.platform === 'win32') {
    execSync('taskkill /f /im ngrok.exe', { stdio: 'ignore' })
  } else {
    execSync('pkill -f ngrok', { stdio: 'ignore' })
  }
  // Wait for processes to terminate
  try {
    execSync('sleep 1')
  } catch (e) {}
} catch (error) {
  // If no process was found, it will throw an error, which we can ignore
}

console.log('🚀 Starting ngrok...')

// Start ngrok process - now we're exposing the client (3000) instead of the API (3001)
// This way the whole app will be served through ngrok
const ngrokProcess = spawn('ngrok', ['http', '3000'], {
  stdio: ['ignore', 'pipe', 'pipe'], // Allow stdout, stderr
})

let devProcesses = null

// Helper function to update .env files
function updateEnvFile(filePath, ngrokUrl) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, '')
  }

  const content = fs.readFileSync(filePath, 'utf8')

  if (filePath.includes('appview')) {
    // Update NGROK_URL in the appview package
    const varName = 'NGROK_URL'
    const publicUrlName = 'PUBLIC_URL'
    const regex = new RegExp(`^${varName}=.*$`, 'm')
    const publicUrlRegex = new RegExp(`^${publicUrlName}=.*$`, 'm')

    // Update content
    let updatedContent = content

    // Update or add NGROK_URL
    if (regex.test(updatedContent)) {
      updatedContent = updatedContent.replace(regex, `${varName}=${ngrokUrl}`)
    } else {
      updatedContent = `${updatedContent}\n${varName}=${ngrokUrl}\n`
    }

    // Update or add PUBLIC_URL - set it to the ngrok URL too
    if (publicUrlRegex.test(updatedContent)) {
      updatedContent = updatedContent.replace(
        publicUrlRegex,
        `${publicUrlName}=${ngrokUrl}`,
      )
    } else {
      updatedContent = `${updatedContent}\n${publicUrlName}=${ngrokUrl}\n`
    }

    fs.writeFileSync(filePath, updatedContent)
    console.log(
      `✅ Updated ${path.basename(filePath)} with ${varName}=${ngrokUrl} and ${publicUrlName}=${ngrokUrl}`,
    )
  } else if (filePath.includes('client')) {
    // For client, set VITE_API_URL to "/api" - this ensures it uses the proxy setup
    const varName = 'VITE_API_URL'
    const regex = new RegExp(`^${varName}=.*$`, 'm')

    let updatedContent
    if (regex.test(content)) {
      // Update existing variable
      updatedContent = content.replace(regex, `${varName}=/api`)
    } else {
      // Add new variable
      updatedContent = `${content}\n${varName}=/api\n`
    }

    fs.writeFileSync(filePath, updatedContent)
    console.log(
      `✅ Updated ${path.basename(filePath)} with ${varName}=/api (proxy to API server)`,
    )
  }
}

// Function to start the development servers
function startDevServers() {
  console.log('🚀 Starting development servers...')

  // Free port 3001 if it's in use
  try {
    if (process.platform !== 'win32') {
      // Kill any process using port 3001
      execSync('kill $(lsof -t -i:3001 2>/dev/null) 2>/dev/null || true')
      // Wait for port to be released
      execSync('sleep 1')
    }
  } catch (error) {
    // Ignore errors
  }

  // Start both servers
  devProcesses = spawn('pnpm', ['--filter', '@statusphere/appview', 'dev'], {
    stdio: 'inherit',
    detached: false,
  })

  const clientProcess = spawn(
    'pnpm',
    ['--filter', '@statusphere/client', 'dev'],
    {
      stdio: 'inherit',
      detached: false,
    },
  )

  devProcesses.on('close', (code) => {
    console.log(`API server exited with code ${code}`)
    killAllProcesses()
  })

  clientProcess.on('close', (code) => {
    console.log(`Client app exited with code ${code}`)
    killAllProcesses()
  })
}

// Function to get the ngrok URL from its API
function getNgrokUrl() {
  return new Promise((resolve, reject) => {
    // Wait a bit for ngrok to start its API server
    setTimeout(() => {
      http
        .get('http://localhost:4040/api/tunnels', (res) => {
          let data = ''

          res.on('data', (chunk) => {
            data += chunk
          })

          res.on('end', () => {
            try {
              const tunnels = JSON.parse(data).tunnels
              if (tunnels && tunnels.length > 0) {
                // Find HTTPS tunnel
                const httpsTunnel = tunnels.find((t) => t.proto === 'https')
                if (httpsTunnel) {
                  resolve(httpsTunnel.public_url)
                } else {
                  reject(new Error('No HTTPS tunnel found'))
                }
              } else {
                reject(new Error('No tunnels found'))
              }
            } catch (error) {
              reject(error)
            }
          })
        })
        .on('error', (err) => {
          reject(err)
        })
    }, 2000) // Give ngrok a couple seconds to start
  })
}

// Poll the ngrok API until we get a URL
function pollNgrokApi() {
  getNgrokUrl()
    .then((ngrokUrl) => {
      console.log(`🌍 ngrok URL: ${ngrokUrl}`)

      // Update .env files with the ngrok URL
      updateEnvFile(appviewEnvPath, ngrokUrl)
      // We'll still call this but it will be skipped per our updated logic
      updateEnvFile(clientEnvPath, ngrokUrl)

      // Start development servers
      startDevServers()
    })
    .catch(() => {
      // Try again in 1 second
      setTimeout(pollNgrokApi, 1000)
    })
}

// Start polling after a short delay
setTimeout(pollNgrokApi, 1000)

// Handle errors
ngrokProcess.stderr.on('data', (data) => {
  console.error('------- NGROK ERROR -------')
  console.error(data.toString())
  console.error('---------------------------')
})

// Handle ngrok process exit
ngrokProcess.on('close', (code) => {
  console.log(`ngrok process exited with code ${code}`)
  // Call our kill function to ensure everything is properly cleaned up
  killAllProcesses()
})

// Function to properly terminate all child processes
function killAllProcesses() {
  console.log('\nShutting down development environment...')

  // Get ngrok process PID for force kill if needed
  const ngrokPid = ngrokProcess.pid

  // Kill main processes with a normal signal first
  if (devProcesses) {
    try {
      devProcesses.kill()
    } catch (e) {}
  }

  try {
    ngrokProcess.kill()
  } catch (e) {}

  // Force kill ngrok if normal kill fails
  try {
    if (process.platform === 'win32') {
      execSync(`taskkill /F /PID ${ngrokPid} 2>nul`, { stdio: 'ignore' })
    } else {
      execSync(`kill -9 ${ngrokPid} 2>/dev/null || true`, { stdio: 'ignore' })
      // Also kill any remaining ngrok processes
      execSync('pkill -9 -f ngrok 2>/dev/null || true', { stdio: 'ignore' })
    }
  } catch (e) {
    // Ignore errors if processes are already gone
  }

  // Kill any process on port 3001 to ensure clean exit
  try {
    if (process.platform !== 'win32') {
      execSync('kill $(lsof -t -i:3001 2>/dev/null) 2>/dev/null || true', {
        stdio: 'ignore',
      })
    }
  } catch (e) {
    // Ignore errors
  }

  process.exit(0)
}

// Handle various termination signals
process.on('SIGINT', killAllProcesses) // Ctrl+C
process.on('SIGTERM', killAllProcesses) // Kill command
process.on('SIGHUP', killAllProcesses) // Terminal closed
