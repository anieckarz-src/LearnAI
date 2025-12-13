import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ locals, url }) => {
  const { supabase, user } = locals;

  if (!user || user.role !== 'admin') {
    return new Response(
      JSON.stringify({ success: false, error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const lessonId = url.searchParams.get('lesson_id');

    const offset = (page - 1) * limit;

    let query = supabase
      .from('quizzes')
      .select(`
        *,
        lesson:lessons(
          id,
          title,
          course:courses(id, title)
        )
      `, { count: 'exact' });

    if (lessonId) {
      query = query.eq('lesson_id', lessonId);
    }

    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data: quizzes, error, count } = await query;

    if (error) {
      throw error;
    }

    const totalPages = count ? Math.ceil(count / limit) : 0;

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          data: quizzes || [],
          total: count || 0,
          page,
          limit,
          total_pages: totalPages,
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to fetch quizzes' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const POST: APIRoute = async ({ locals, request }) => {
  const { supabase, user } = locals;

  if (!user || user.role !== 'admin') {
    return new Response(
      JSON.stringify({ success: false, error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await request.json();
    const { lesson_id, title, questions, ai_generated } = body;

    if (!lesson_id || !title || !questions) {
      return new Response(
        JSON.stringify({ success: false, error: 'lesson_id, title, and questions are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { data: quiz, error } = await supabase
      .from('quizzes')
      .insert({
        lesson_id,
        title,
        questions,
        ai_generated: ai_generated || false,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Log the action
    await supabase.from('audit_log').insert({
      user_id: user.id,
      action: 'create_quiz',
      entity_type: 'quiz',
      entity_id: quiz.id,
      new_values: quiz,
    });

    return new Response(
      JSON.stringify({ success: true, data: quiz }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error creating quiz:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to create quiz' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
