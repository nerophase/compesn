# Frontend Architecture Boundaries

- `features/`: domain-specific UI, hooks, and server adapters by product area.
- `components/ui/`: reusable UI primitives and shared form controls.
- `lib/`: infrastructure adapters and external integrations (auth wiring, sockets, database clients).
- `utils/`: tiny pure helpers with no side effects.

## Redundancy Rule

Each concern should have one canonical implementation.  
Do not add wrapper re-exports to preserve old paths. Update imports directly to the canonical module.
