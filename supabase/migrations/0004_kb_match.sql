-- Extend kb_chunks for heading-aware retrieval and ALL-state (nullable) chunks.
alter table public.kb_chunks add column if not exists heading text;
alter table public.kb_chunks alter column state drop not null;

create or replace function public.kb_match(
  query_embedding vector(1024),
  target_state text,
  match_count int default 5
) returns table (
  content text,
  heading text,
  source_url text,
  state text,
  similarity float
)
language sql stable
as $$
  select
    content,
    heading,
    source_url,
    state,
    1 - (embedding <=> query_embedding) as similarity
  from public.kb_chunks
  where (target_state is null or state = target_state or state is null)
  order by embedding <=> query_embedding
  limit match_count;
$$;
