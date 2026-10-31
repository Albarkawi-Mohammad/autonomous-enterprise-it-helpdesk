# Security and demonstration boundaries

This is a development and demonstration project. Run it on localhost using synthetic data. It is not a hardened production helpdesk or a complete identity and access management system.

## Public source preparation

- Application credentials are read from environment variables and have no embedded password defaults.
- Example configuration contains blank secret fields. Keep local `.env` files out of version control.
- Directory identities use generic demo accounts. Sample email addresses use the reserved `.test` domain, phone details are omitted, and private IP examples use documentation addresses.
- Runtime logs, uploaded images, local databases, virtual environments, build output, and workstation-specific files are excluded.
- Tests and the command-line demonstration use mock directory/Redis services and generate an ephemeral supervisor token at runtime.

## Known limitations

Several dashboard, simulation, directory, ticket, and approval routes are demonstration endpoints without comprehensive authentication or authorization. The supervisor token on selected routes does not protect the entire application. CORS is permissive. Do not expose the API to the internet or connect this demo to a real enterprise directory.

Some status messages, decision traces, performance values, integrations, and screenshot annotations are simulated. Password-reset and folder-access approvals do not implement all downstream enterprise changes. The audit chain is an in-memory demonstration of tamper detection, not persistent or independently anchored audit storage.

Before a production deployment, implement and validate authentication and role-based authorization on every relevant route, directory permissions and identity verification, TLS, restricted CORS, durable audit storage, secret management, input and upload controls, and environment-specific tests. Review dependency versions and current security advisories.

Do not include credentials, personal records, or unredacted logs in public issues or pull requests. Use GitHub's private vulnerability reporting feature if it is enabled for this repository.
