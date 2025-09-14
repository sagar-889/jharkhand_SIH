/**
 * Simple test script to call the DeepSeek provider function locally.
 * Usage (Windows cmd.exe):
 *   set DEEPSEEK_API_KEY=your_key_here
 *   node deepseek_test.js
 *
 * Or set the env var inline with PowerShell (if execution policy allows):
 *   $env:DEEPSEEK_API_KEY="your_key_here"; node deepseek_test.js
 */

const { generateDeepSeekResponse } = require('./deepSeekService');

async function run() {
  if (!process.env.DEEPSEEK_API_KEY) {
    console.error('Please set DEEPSEEK_API_KEY environment variable');
    process.exit(1);
  }

  const message = 'Tell me about the major tourist attractions in Jharkhand and travel tips for each.';
  const language = 'en';

  try {
    const resp = await generateDeepSeekResponse(message, language);
    console.log('DeepSeek response:', resp);
  } catch (err) {
    console.error('Test failed:', err);
  }
}

run();
