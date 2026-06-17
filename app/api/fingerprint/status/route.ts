import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    // Get userId from query params or headers
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Get user profile
    let profile:
      | {
          id: string
          fingerprint_enabled: boolean
          fingerprint_enrolled_at: string | null
          last_fingerprint_auth: string | null
        }
      | null = null
    let profileError: any = null

    const profileResult = await supabase
      .from('profiles')
      .select('id, fingerprint_enabled, fingerprint_enrolled_at, last_fingerprint_auth')
      .eq('id', userId)
      .single();

    profile = profileResult.data
    profileError = profileResult.error

    // If profile doesn't exist, create it
    if (profileError || !profile) {
      console.log('[v0] Profile not found, creating new profile for user:', userId);
      
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert([
          {
            id: userId,
            fingerprint_enabled: false,
            fingerprint_enrolled_at: null,
            last_fingerprint_auth: null,
          }
        ])
        .select()
        .single();

      if (createError || !newProfile) {
        console.error('[v0] Failed to create profile:', createError);
        // Continue anyway - we'll return empty fingerprints
        profile = {
          id: userId,
          fingerprint_enabled: false,
          fingerprint_enrolled_at: null,
          last_fingerprint_auth: null,
        };
      } else {
        profile = newProfile;
      }
    }

    // Get enrolled fingerprints
    const { data: fingerprints, error: fingerprintError } = await supabase
      .from('fingerprint_data')
      .select('id, finger_position, quality_score, captured_at, is_active, device_type')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('captured_at', { ascending: false });

    if (fingerprintError) {
      console.error('[v0] Get fingerprints error:', fingerprintError);
      return NextResponse.json(
        { error: 'Failed to fetch fingerprints' },
        { status: 500 }
      );
    }

    // Get recent authentication logs
    const { data: authLogs, error: logsError } = await supabase
      .from('fingerprint_auth_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (logsError) {
      console.error('[v0] Get auth logs error:', logsError);
    }

    return NextResponse.json({
      success: true,
      profile: {
        fingerprintEnabled: profile.fingerprint_enabled,
        enrolledAt: profile.fingerprint_enrolled_at,
        lastAuthAt: profile.last_fingerprint_auth
      },
      enrolledFingerprints: fingerprints || [],
      fingersEnrolled: (fingerprints || []).length,
      allFingersEnrolled: (fingerprints || []).length >= 5,
      recentAuthLogs: authLogs || []
    });
  } catch (error) {
    console.error('[v0] Fingerprint status error:', error);
    return NextResponse.json(
      { error: 'Failed to get status' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId, fingerId } = await request.json();
    
    if (!userId || !fingerId) {
      return NextResponse.json({ error: 'User ID and Finger ID are required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Soft delete fingerprint
    const { error } = await supabase
      .from('fingerprint_data')
      .update({ is_active: false })
      .eq('id', fingerId)
      .eq('user_id', userId);

    if (error) {
      console.error('[v0] Delete fingerprint error:', error);
      return NextResponse.json(
        { error: 'Failed to delete fingerprint' },
        { status: 500 }
      );
    }

    // Check remaining active fingerprints
    const { data: remaining, error: countError } = await supabase
      .from('fingerprint_data')
      .select('id')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (!countError && (remaining || []).length === 0) {
      // Disable fingerprint auth if no fingerprints left
      await supabase
        .from('profiles')
        .update({ fingerprint_enabled: false })
        .eq('id', userId);
    }

    return NextResponse.json({
      success: true,
      message: 'Fingerprint deleted successfully'
    });
  } catch (error) {
    console.error('[v0] Delete fingerprint error:', error);
    return NextResponse.json(
      { error: 'Failed to delete fingerprint' },
      { status: 500 }
    );
  }
}
