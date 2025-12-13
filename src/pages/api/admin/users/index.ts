import type { APIRoute } from 'astro';
import type { UserFilters } from '@/types';

export const GET: APIRoute = async ({ locals, url }) => {
  const { supabase, user } = locals;

  if (!user || user.role !== 'admin') {
    return new Response(
      JSON.stringify({ success: false, error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Parse query parameters
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const role = url.searchParams.get('role') as UserFilters['role'];
    const search = url.searchParams.get('search') || '';
    const isBlocked = url.searchParams.get('is_blocked');

    const offset = (page - 1) * limit;

    // Build query
    let query = supabase.from('users').select('*', { count: 'exact' });

    // Apply filters
    if (role) {
      query = query.eq('role', role);
    }

    if (isBlocked !== null && isBlocked !== undefined && isBlocked !== '') {
      query = query.eq('is_blocked', isBlocked === 'true');
    }

    if (search) {
      query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
    }

    // Apply pagination
    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data: users, error, count } = await query;

    if (error) {
      throw error;
    }

    const totalPages = count ? Math.ceil(count / limit) : 0;

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          data: users || [],
          total: count || 0,
          page,
          limit,
          total_pages: totalPages,
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching users:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to fetch users' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
