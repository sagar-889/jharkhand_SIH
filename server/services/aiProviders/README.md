DeepSeek & AI provider test instructions

Quick test script

- Location: `backend/services/aiProviders/deepseek_test.js`
- Purpose: locally exercise the DeepSeek adapter using your `DEEPSEEK_API_KEY`.

Windows (cmd.exe) example:

1. Open Command Prompt (cmd.exe)
2. Set the API key and run the script:

   set DEEPSEEK_API_KEY=your_real_deepseek_key_here
   node c:\Users\chand\Downloads\jk-sih\jk-sih\backend\services\aiProviders\deepseek_test.js

What to expect:
- If successful, the script prints an object with `text`, `confidence`, and `provider` fields.
- On errors, the script logs helpful diagnostics including HTTP status and a truncated response body.

If you prefer curl, you can instead hit the running backend's `/api/chatbot` endpoints after starting the server with a valid `.env`.
