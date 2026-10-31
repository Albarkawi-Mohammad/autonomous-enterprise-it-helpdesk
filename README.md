# Autonomous Enterprise IT Helpdesk & Triage Engine

An AI-assisted IT support project that helps employees describe technical problems, guides them through troubleshooting, and helps support teams decide what should happen next.

The project combines an employee support portal, an IT operations dashboard, and a ticket triage engine. Its central idea is to use AI to understand requests while keeping operational decisions and permitted actions under explicit rules and human oversight.

## What problem does it address?

Service desks handle many repetitive requests, including locked accounts, connection problems, and equipment issues. Tickets often arrive with missing details, which creates extra back-and-forth before support can begin. At the same time, account and access changes need careful handling.

This project explores how guided troubleshooting and controlled automation can reduce that routine work and give support engineers clearer information when an issue needs their attention.

## What does it do?

- **Understands support requests:** Classifies ticket text, extracts relevant information, and supports German and English ticket parsing.
- **Guides employees through troubleshooting:** Provides structured diagnostic conversations for issues such as webcams, displays, docking stations, and VPN connectivity.
- **Routes tickets according to policy:** Evaluates confidence, account context, and risk to determine whether to automate an allowed action, request supervisor review, or escalate to specialist support.
- **Demonstrates controlled account recovery:** Includes a directory-backed account unlock workflow for eligible standard accounts, with checks before execution and verification afterward.
- **Keeps sensitive decisions under human oversight:** Routes password-reset and folder-access requests through approval workflows and escalates privileged-account cases.
- **Gives IT teams visibility:** Provides ticket queues, diagnostic history, decision traces, approval controls, and audit records through an operations dashboard.
- **Supports evaluation:** Includes simulated directory data and test scenarios for exploring normal requests, ambiguous cases, and suspicious input.

## Who is it for?

| Group | How the project can help |
| --- | --- |
| Employees and internal users | Describe problems more easily and follow guided troubleshooting steps. |
| First-line service desk teams | Reduce repetitive information gathering and organize incoming requests. |
| Second-line support engineers and system administrators | Receive escalated cases with diagnostic context and prior actions. |
| IT supervisors and service desk managers | Review requests that need approval and follow ticket progress. |
| Security and IT governance teams | Examine policy decisions, blocked requests, and recorded actions. |
| AI and automation engineers | Explore how AI interpretation can work alongside explicit execution rules. |

## What can it help improve?

The intended benefits are faster initial triage, more consistent troubleshooting, clearer handoffs between support levels, and less time spent collecting the same information repeatedly. Keeping approvals and decision records visible can also help teams understand why a request was automated, paused, or escalated.

These are design goals, rather than measured performance or cost-saving claims.

## Example support journey

1. An employee reports an account lockout or a device problem.
2. The system classifies the request or guides the employee through a diagnostic playbook.
3. The triage workflow checks the applicable policy and available context.
4. An eligible account-unlock request can follow the controlled remediation path; other requests are routed for approval or specialist support.
5. The support team can review the outcome and recorded decision history.

## Project scope

This repository contains the sanitized application source, tests, synthetic demonstration fixtures, and example configuration. Credentials, private configuration, local caches, and internal records are excluded.

The project includes demonstration and simulation workflows. Production deployment would require environment-specific integration, security review, and operational validation. Approval workflows for password resets and folder access should not be read as a claim that every downstream enterprise action is implemented.

## Run the local demonstration

Use Python 3.11 or later. The default configuration uses an in-memory directory, in-memory Redis, and the deterministic fallback parser; no external AI service or enterprise credentials are needed.

```sh
python -m venv .venv
# Windows PowerShell: .\.venv\Scripts\Activate.ps1
# macOS/Linux: source .venv/bin/activate
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Open `http://127.0.0.1:8000/admin` for the operations dashboard or `http://127.0.0.1:8000/user` for the employee portal. Use only the included synthetic accounts and sample tickets. Read [SECURITY.md](SECURITY.md) before running the application.

The optional Next.js frontend is in `frontend/`:

```sh
cd frontend
npm install
npm run dev -- --hostname 127.0.0.1
```

Its API URL defaults to `http://localhost:8000`. An optional local `frontend/.env.local` can set `NEXT_PUBLIC_API_URL` to another local API address. Never put secrets in `NEXT_PUBLIC_` variables.

## Tests and scripted demonstration

```sh
python -m pytest -q
python run_demo.py
```

Both use mock services and a fresh runtime-generated supervisor token. Sample identities, ticket histories, and traces are synthetic demonstration material.

## Optional configuration

Copy `.env.example` to `.env` and set only the values needed locally. To load it when starting the API, add `--env-file .env` to the Uvicorn command above. Generate a fresh supervisor token locally if you need the token-protected API endpoints; there is no default token.

The Docker Compose file is an optional isolated directory/Redis simulation. It requires locally supplied values for `LDAP_BIND_PASSWORD`, `LDAP_CONFIG_PASSWORD`, `LDAP_READONLY_USER_PASSWORD`, `REDIS_PASSWORD`, and `SUPERVISOR_API_KEY`. Its published ports bind to loopback. Run `docker compose up --build` only after configuring those values. The optional Claude provider also needs the `anthropic` Python package, a valid API key, and a model available to your account.

## Source layout

- `app/`: API, ticket triage, diagnostic playbooks, directory integration, audit logic, and built-in HTML interfaces.
- `config/`: environment-based settings and synthetic directory fixtures.
- `frontend/`: Next.js interface and client-side demonstration data.
- `tests/`: parser, schema, policy, directory, and API tests.

Private configuration and generated files are excluded by `.gitignore`. Keep all real credentials and user data outside this repository.
