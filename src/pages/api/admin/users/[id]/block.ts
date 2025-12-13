import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ locals, params }) => {
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

    // Prevent admin from blocking themselves
    if (id === user.id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Cannot block yourself' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get current user state
    const { data: targetUser } = await supabase
      .from('users')
      .select('is_blocked')
      .eq('id', id)
      .single();

    const newBlockedState = !targetUser?.is_blocked;

    // Update user
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({ is_blocked: newBlockedState })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Log the action
    await supabase.from('audit_log').insert({
      user_id: user.id,
      action: newBlockedState ? 'block_user' : 'unblock_user',
      entity_type: 'user',
      entity_id: id,
      new_values: { is_blocked: newBlockedState },
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: updatedUser,
        message: newBlockedState ? 'User blocked successfully' : 'User unblocked successfully',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error toggling user block:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to toggle user block' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
