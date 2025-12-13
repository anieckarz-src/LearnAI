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
    const courseId = url.searchParams.get('course_id');

    if (!courseId) {
      return new Response(
        JSON.stringify({ success: false, error: 'course_id is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { data: lessons, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index');

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({ success: true, data: lessons || [] }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching lessons:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to fetch lessons' }),
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
    const { course_id, title, content, order_index } = body;

    if (!course_id || !title) {
      return new Response(
        JSON.stringify({ success: false, error: 'course_id and title are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { data: lesson, error } = await supabase
      .from('lessons')
      .insert({
        course_id,
        title,
        content,
        order_index: order_index || 0,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Log the action
    await supabase.from('audit_log').insert({
      user_id: user.id,
      action: 'create_lesson',
      entity_type: 'lesson',
      entity_id: lesson.id,
      new_values: lesson,
    });

    return new Response(
      JSON.stringify({ success: true, data: lesson }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error creating lesson:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to create lesson' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
