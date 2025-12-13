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

    const { data: quiz, error } = await supabase
      .from('quizzes')
      .select(`
        *,
        lesson:lessons(
          id,
          title,
          course:courses(id, title)
        )
      `)
      .eq('id', id)
      .single();

    if (error || !quiz) {
      return new Response(
        JSON.stringify({ success: false, error: 'Quiz not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get quiz attempts stats
    const { data: attempts } = await supabase
      .from('quiz_attempts')
      .select('score')
      .eq('quiz_id', id);

    const stats = attempts && attempts.length > 0
      ? {
          total_attempts: attempts.length,
          avg_score: attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length,
        }
      : { total_attempts: 0, avg_score: 0 };

    return new Response(
      JSON.stringify({ success: true, data: { ...quiz, stats } }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching quiz:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to fetch quiz' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const DELETE: APIRoute = async ({ locals, params }) => {
  const { supabase, user } = locals;

  if (!user || user.role !== 'admin') {
    return new Response(
      JSON.stringify({ success: false, error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { id } = params;

    const { error } = await supabase.from('quizzes').delete().eq('id', id);

    if (error) {
      throw error;
    }

    // Log the action
    await supabase.from('audit_log').insert({
      user_id: user.id,
      action: 'delete_quiz',
      entity_type: 'quiz',
      entity_id: id,
    });

    return new Response(
      JSON.stringify({ success: true, message: 'Quiz deleted successfully' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error deleting quiz:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to delete quiz' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
