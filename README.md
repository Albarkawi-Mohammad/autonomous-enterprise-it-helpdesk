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

This repository is a public project overview. It contains documentation only; it does not distribute the application, deployment configuration, credentials, internal records, or user data.

The project includes demonstration and simulation workflows. Production deployment would require environment-specific integration, security review, and operational validation. Approval workflows for password resets and folder access should not be read as a claim that every downstream enterprise action is implemented.
