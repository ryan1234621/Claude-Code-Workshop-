import { redirect } from 'next/navigation';
import { MOCK_CURRENT_ADMIN, hasScope } from '@/app/lib/permissions';

export default function AdminIndex() {
  const admin = MOCK_CURRENT_ADMIN;

  if (hasScope(admin, 'analytics:read')) redirect('/admin/analytics');
  if (hasScope(admin, 'products:read'))  redirect('/admin/products');
  if (hasScope(admin, 'tickets:read'))   redirect('/admin/tickets');
  if (hasScope(admin, 'team:read'))      redirect('/admin/team');

  redirect('/');
}
