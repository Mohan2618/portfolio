-- Portfolio security policies
-- Run this migration in the Supabase SQL Editor for your project.
-- Public visitors can read portfolio data.
-- Only users listed in admin_users can write portfolio data.

create or replace function public.is_portfolio_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users where user_id = auth.uid()
  );
$$;

revoke all on function public.is_portfolio_admin() from public;
grant execute on function public.is_portfolio_admin() to anon, authenticated;

alter table public.admin_users enable row level security;

drop policy if exists "Admin users can read their own admin record" on public.admin_users;
create policy "Admin users can read their own admin record"
on public.admin_users
for select to authenticated
using (user_id = auth.uid());

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'profiles','skills','projects','experience',
    'education','certifications','social_links','site_settings'
  ]
  loop
    execute format('alter table public.%I enable row level security', table_name);

    execute format('drop policy if exists "Public can view %s" on public.%I', table_name, table_name);
    execute format(
      'create policy "Public can view %s" on public.%I for select to anon, authenticated using (true)',
      table_name, table_name
    );

    execute format('drop policy if exists "Portfolio admin can insert %s" on public.%I', table_name, table_name);
    execute format(
      'create policy "Portfolio admin can insert %s" on public.%I for insert to authenticated with check (public.is_portfolio_admin())',
      table_name, table_name
    );

    execute format('drop policy if exists "Portfolio admin can update %s" on public.%I', table_name, table_name);
    execute format(
      'create policy "Portfolio admin can update %s" on public.%I for update to authenticated using (public.is_portfolio_admin()) with check (public.is_portfolio_admin())',
      table_name, table_name
    );

    execute format('drop policy if exists "Portfolio admin can delete %s" on public.%I', table_name, table_name);
    execute format(
      'create policy "Portfolio admin can delete %s" on public.%I for delete to authenticated using (public.is_portfolio_admin())',
      table_name, table_name
    );
  end loop;
end
$$;

drop policy if exists "Portfolio admin can update profiles" on public.profiles;
create policy "Portfolio admin can update profiles"
on public.profiles
for update to authenticated
using (public.is_portfolio_admin())
with check (id = auth.uid() and public.is_portfolio_admin());

drop policy if exists "Portfolio admin can insert site_settings" on public.site_settings;
create policy "Portfolio admin can insert site_settings"
on public.site_settings
for insert to authenticated
with check (id = 1 and public.is_portfolio_admin());

drop policy if exists "Portfolio admin can update site_settings" on public.site_settings;
create policy "Portfolio admin can update site_settings"
on public.site_settings
for update to authenticated
using (id = 1 and public.is_portfolio_admin())
with check (id = 1 and public.is_portfolio_admin());

drop policy if exists "Portfolio admin can delete site_settings" on public.site_settings;
create policy "Portfolio admin can delete site_settings"
on public.site_settings
for delete to authenticated
using (id = 1 and public.is_portfolio_admin());
