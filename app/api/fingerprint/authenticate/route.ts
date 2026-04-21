import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { templateData, qualityScore } = await request.json();

    if (!templateData) {
      return NextResponse.json(
        { error: 'Template data is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get all enrolled fingerprints from database
    const { data: fingerprints, error: fingerprintError } = await supabase
      .from('fingerprint_data')
      .select('id, user_id, template_data, quality_score, finger_position')
      .neq('template_data', null);

    if (fingerprintError) {
      console.error('[v0] Error fetching fingerprints:', fingerprintError);
      return NextResponse.json(
        { error: 'Failed to authenticate' },
        { status: 500 }
      );
    }

    if (!fingerprints || fingerprints.length === 0) {
      return NextResponse.json(
        { error: 'No fingerprints enrolled in the system' },
        { status: 404 }
      );
    }

    // Find matching fingerprint
    let bestMatch = null;
    let highestSimilarity = 0;

    for (const fp of fingerprints) {
      const similarity = calculateSimilarity(templateData, fp.template_data);
      
      console.log('[v0] Comparing with', fp.finger_position, 'similarity:', similarity);

      if (similarity > highestSimilarity) {
        highestSimilarity = similarity;
        bestMatch = fp;
      }
    }

    // Threshold: 60% similarity for matching
    const MATCH_THRESHOLD = 0.6;

    if (!bestMatch || highestSimilarity < MATCH_THRESHOLD) {
      console.log('[v0] No match found. Best similarity:', highestSimilarity);
      return NextResponse.json(
        { error: 'Fingerprint does not match any enrolled fingerprints' },
        { status: 401 }
      );
    }

    console.log('[v0] Match found for user:', bestMatch.user_id, 'similarity:', highestSimilarity);

    // Get user information
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('id', bestMatch.user_id)
      .single();

    if (userError || !userData) {
      console.error('[v0] Error fetching user:', userError);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update last fingerprint login time
    await supabase
      .from('profiles')
      .update({ 
        last_fingerprint_auth: new Date().toISOString()
      })
      .eq('id', bestMatch.user_id);

    console.log('[v0] Fingerprint authentication successful for:', userData.email);

    return NextResponse.json({
      success: true,
      userId: userData.id,
      email: userData.email || 'user@example.com',
      matchedFinger: bestMatch.finger_position,
      similarity: highestSimilarity,
      message: 'Authentication successful'
    });
  } catch (error) {
    console.error('[v0] Fingerprint authentication error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

/**
 * Calculate similarity between two template strings
 * In production, use actual fingerprint matching algorithms
 */
function calculateSimilarity(template1: string, template2: string): number {
  if (!template1 || !template2) return 0;

  const t1 = String(template1);
  const t2 = String(template2);

  // If templates are identical, perfect match
  if (t1 === t2) return 1.0;

  // Calculate character match percentage
  const maxLen = Math.max(t1.length, t2.length);
  if (maxLen === 0) return 1.0;

  let matches = 0;
  const minLen = Math.min(t1.length, t2.length);
  
  for (let i = 0; i < minLen; i++) {
    if (t1[i] === t2[i]) matches++;
  }

  // Return similarity as a percentage
  return matches / maxLen;
}
