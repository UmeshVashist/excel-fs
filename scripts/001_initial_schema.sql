-- Profiles table for extended user data
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  email text unique,
  updated_at timestamp with time zone default now()
);

-- Formulas table
create table if not exists public.formulas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text,
  formula text not null,
  is_favorite boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Shortcut keys table
create table if not exists public.shortcuts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text,
  shortcut text not null,
  is_favorite boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.formulas enable row level security;
alter table public.shortcuts enable row level security;

-- Policies for profiles
create policy "Users can view their own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update their own profile" on public.profiles for update using (auth.uid() = id);

-- Policies for formulas
create policy "Users can view their own formulas" on public.formulas for select using (auth.uid() = user_id);
create policy "Users can insert their own formulas" on public.formulas for insert with check (auth.uid() = user_id);
create policy "Users can update their own formulas" on public.formulas for update using (auth.uid() = user_id);
create policy "Users can delete their own formulas" on public.formulas for delete using (auth.uid() = user_id);

-- Policies for shortcuts
create policy "Users can view their own shortcuts" on public.shortcuts for select using (auth.uid() = user_id);
create policy "Users can insert their own shortcuts" on public.shortcuts for insert with check (auth.uid() = user_id);
create policy "Users can update their own shortcuts" on public.shortcuts for update using (auth.uid() = user_id);
create policy "Users can delete their own shortcuts" on public.shortcuts for delete using (auth.uid() = user_id);

-- Trigger to create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, email)
  values (new.id, new.raw_user_meta_data->>'username', new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
