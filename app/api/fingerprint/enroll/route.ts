import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const {
      userId,
      fingerPosition,
      templateData,
      qualityScore,
      deviceType
    } = await request.json();

    // Validate userId is provided
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Validate device type
    if (!['MFS100', 'MFS110'].includes(deviceType)) {
      return NextResponse.json(
        { error: 'Unsupported device type' },
        { status: 400 }
      );
    }

    // Validate quality score
    if (qualityScore < 60) {
      return NextResponse.json(
        { 
          error: 'Fingerprint quality too low',
          message: 'Please try again with better finger contact'
        },
        { status: 400 }
      );
    }

    // Validate finger position
    const validPositions = [
      'thumb_right', 'index_right', 'middle_right', 'ring_right', 'pinky_right',
      'thumb_left', 'index_left', 'middle_left', 'ring_left', 'pinky_left'
    ];
    if (!validPositions.includes(fingerPosition)) {
      return NextResponse.json(
        { error: 'Invalid finger position' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Ensure user profile exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (!existingProfile) {
      console.log('[v0] Creating profile for user:', userId);
      await supabase
        .from('profiles')
        .insert([
          {
            id: userId,
            fingerprint_enabled: false,
            fingerprint_enrolled_at: null,
            last_fingerprint_auth: null
          }
        ])
        .select();
    }

    // Store fingerprint template
    const { data, error } = await supabase
      .from('fingerprint_data')
      .upsert({
        user_id: userId,
        finger_position: fingerPosition,
        template_data: templateData,
        quality_score: qualityScore,
        device_type: deviceType,
        is_active: true
      }, {
        onConflict: 'user_id,finger_position'
      })
      .select()
      .single();

    if (error) {
      console.error('[v0] Fingerprint enrollment error:', error);
      return NextResponse.json(
        { error: 'Failed to store fingerprint' },
        { status: 500 }
      );
    }

    // Check if all 5 fingers are enrolled
    const { data: enrolledFingers, error: countError } = await supabase
      .from('fingerprint_data')
      .select('finger_position')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (countError) {
      console.error('[v0] Count enrolled fingers error:', countError);
    }

    const fingersEnrolled = enrolledFingers?.length || 0;
    const allFingersEnrolled = fingersEnrolled >= 5;

    // Update profiles table if all fingers enrolled
    if (allFingersEnrolled) {
      await supabase
        .from('profiles')
        .update({
          fingerprint_enabled: true,
          fingerprint_enrolled_at: new Date().toISOString()
        })
        .eq('id', userId);
    }

    return NextResponse.json({
      success: true,
      data,
      fingersEnrolled,
      allFingersEnrolled,
      message: allFingersEnrolled 
        ? 'All fingers enrolled! Fingerprint authentication is now active.'
        : `${fingersEnrolled}/5 fingers enrolled. Please continue with remaining fingers.`
    });
  } catch (error) {
    console.error('[v0] Fingerprint enrollment error:', error);
    return NextResponse.json(
      { error: 'Failed to enroll fingerprint' },
      { status: 500 }
    );
  }
}
