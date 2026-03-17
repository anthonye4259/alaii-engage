Alaii MCP — Demo

Purpose: minimal sandbox demo showing comment listing and reply for connected accounts.

Quick start (local)
1. Copy your tokens into a .env file at the repo root (see .env.example)
2. cd projects/alaii/alaii-mcp/demo/server
3. npm install
4. npm start
5. Open projects/alaii/alaii-mcp/demo/frontend/index.html in a browser and point to the server (defaults to http://localhost:3000)

Security
- Do not commit real tokens. The demo is for sandbox/testing only. Use test pages/accounts.

Files
- server/index.js — minimal Express server implementing the basic endpoints from the OpenAPI (list comments, reply)
- frontend/index.html — minimal UI that lists comments and allows replies
- .env.example — env var examples
