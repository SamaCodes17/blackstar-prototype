# ADR 001 — TypeScript modular monolith and SQLite

**Decision:** React UI, Node local HTTP API, built-in SQLite, pure TypeScript model and solver modules. Vite and tsx handle development. Keep the user's supplied logo unchanged.

**Alternatives:** Python API plus React; distributed per-layer services; a browser-only application. Python adds a second runtime for the simulator interface. Distributed services add unnecessary deployment/configuration work. Browser-only storage cannot safely own private service keys or a persistent scheduler.

| Criterion   | Decision evidence                                                                                      |
| ----------- | ------------------------------------------------------------------------------------------------------ |
| Novelty     | Infrastructure is intentionally ordinary; the inspectable risk/game workflow carries the product idea. |
| Feasibility | One process and one local database; no cloud subscription or agent install.                            |
| Scalability | Pure contracts can move behind workers later; this is not a production scale claim.                    |
| Impact      | Fast local iteration makes assumption changes and budget decisions interactive.                        |
| Benefit     | The developer maintains one language and a small dependency tree.                                      |
| Innovation  | Numerical modules and provenance share typed contracts.                                                |
| Uniqueness  | No claim that this stack itself is novel or exclusive.                                                 |

**Consequences:** Requires modern Node with SQLite. Loopback-only operation is deliberate until authentication and authorization are added. SQLite operations are transactional. Export reads persisted output without introducing figures.
