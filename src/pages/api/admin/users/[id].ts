import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ locals, params }) => {
  const { supabase, user } = locals;

  if (!user || user.role !== 'admin') {
    return new Response(
      JSON.stringify({ success: false, error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { id } = params;

    if (!id) {
      return new Response(
        JSON.stringify({ success: false, error: 'User ID required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { data: userData, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !userData) {
      return new Response(
        JSON.stringify({ success: false, error: 'User not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: userData }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching user:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to fetch user' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const PATCH: APIRoute = async ({ locals, params, request }) => {
  const { supabase, user } = locals;

  if (!user || user.role !== 'admin') {
    return new Response(
      JSON.stringify({ success: false, error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { id } = params;

    if (!id) {
      return new Response(
        JSON.stringify({ success: false, error: 'User ID required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const { full_name, role, is_blocked } = body;

    // Prevent admin from blocking themselves
    if (id === user.id && is_blocked === true) {
      return new Response(
        JSON.stringify({ success: false, error: 'Cannot block yourself' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get old values for audit log
    const { data: oldUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    // Update user
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({
        full_name,
        role,
        is_blocked,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Log the action
    await supabase.from('audit_log').insert({
      user_id: user.id,
      action: 'update_user',
      entity_type: 'user',
      entity_id: id,
      old_values: oldUser,
      new_values: updatedUser,
    });

    return new Response(
      JSON.stringify({ success: true, data: updatedUser }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error updating user:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to update user' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
