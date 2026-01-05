#!/usr/bin/env node
import { execSync } from 'child_process'

// Read the input from stdin
let input = ''
process.stdin.on('data', (chunk) => {
  input += chunk
})

process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input)
    const filePath = data.tool_input?.file_path

    // Check if the file is a markdown file
    if (filePath && filePath.endsWith('.md')) {
      try {
        // Run textlint --fix on the markdown file
        execSync(`npx --yes textlint --fix "${filePath}"`, {
          stdio: 'ignore',
        })
      } catch (_error) {
        // Silently ignore errors to not break the workflow
      }
    }
  } catch (_error) {
    // Silently ignore JSON parsing errors
  }

  // Always exit successfully
  process.exit(0)
})
