-- ERC-8004 agent identifiers can be composite strings (for example chain:registry:tokenId).
-- Keep them as text rather than numeric so we preserve the canonical identifier from the indexer.
alter table public.agents
  alter column agent_id type text using agent_id::text;

comment on column public.agents.agent_id is 'Canonical ERC-8004 agent identifier; may be a numeric token ID or composite registry identifier.';
