create table messages (
  id uuid primary key default uuid_generate_v4(),
  username text not null,
  content text not null,
  created_at timestamp default now()
);

alter table messages enable row level security;

create policy "read all" on messages for select using (true);
create policy "insert all" on messages for insert with check (true);
