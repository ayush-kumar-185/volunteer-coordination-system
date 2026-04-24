const pool = require('../db')

const SKILL_MAP = {
  water: ['water', 'plumbing', 'sanitation', 'electrical'],
  medical: ['medical', 'first_aid', 'nursing', 'pharmacy', 'counseling'],
  food: ['food', 'cooking', 'nutrition', 'driving', 'logistics'],
  shelter: ['shelter', 'construction', 'carpentry', 'driving'],
  education: ['education', 'teaching', 'counseling'],
  other: ['driving', 'logistics', 'general']
}

const findMatchingVolunteers = async (needId) => {
  try {
    console.log('Finding matches for need:', needId)

    // Step 1 — Fetch the need
    const needResult = await pool.query(
      'SELECT * FROM needs WHERE id = $1',
      [needId]
    )

    if (needResult.rows.length === 0) {
      return { success: false, error: 'Need not found' }
    }

    const need = needResult.rows[0]
    console.log('Need found — category:', need.category, '| coordinates:', need.latitude, need.longitude)

    const relevantSkills = SKILL_MAP[need.category] || SKILL_MAP.other
    console.log('Relevant skills for category:', relevantSkills)

    let volunteers = []

    // Step 2 — Query volunteers
    if (need.latitude && need.longitude) {
      console.log('Running spatial query...')

      // Spatial check assumes geom is pre-calculated via trigger

      const result = await pool.query(
        `SELECT
           v.id,
           v.name,
           v.phone,
           v.skills,
           v.latitude,
           v.longitude,
           v.available_hours,
           v.is_available,
           ROUND(
              (ST_Distance(
                v.geom::geography,
                ST_MakePoint($1, $2)::geography
              ) / 1000.0)::numeric,
              1
            ) AS distance_km,
           (
             SELECT COUNT(*)::int
             FROM unnest(v.skills) AS skill
             WHERE skill = ANY($3::text[])
           ) AS skill_match_count
         FROM volunteers v
         WHERE v.is_available = TRUE
           AND v.geom IS NOT NULL
           AND ST_DWithin(
             v.geom::geography,
             ST_MakePoint($1, $2)::geography,
             50000
           )
         ORDER BY
           skill_match_count DESC,
           distance_km ASC
         LIMIT 3`,
        [need.longitude, need.latitude, relevantSkills]
      )

      volunteers = result.rows
      console.log(`Spatial query returned ${volunteers.length} volunteers`)

      // If no volunteers found within 50km, fall back to skill-only match
      if (volunteers.length === 0) {
        console.log('No volunteers within 50km — falling back to skill-only match')
        const fallback = await pool.query(
          `SELECT
             v.id,
             v.name,
             v.phone,
             v.skills,
             v.latitude,
             v.longitude,
             v.available_hours,
             v.is_available,
             NULL AS distance_km,
             (
               SELECT COUNT(*)::int
               FROM unnest(v.skills) AS skill
               WHERE skill = ANY($1::text[])
             ) AS skill_match_count
           FROM volunteers v
           WHERE v.is_available = TRUE
           ORDER BY skill_match_count DESC
           LIMIT 3`,
          [relevantSkills]
        )
        volunteers = fallback.rows
        console.log(`Fallback returned ${volunteers.length} volunteers`)
      }

    } else {
      // No coordinates on the need — skill-only match
      console.log('No coordinates on need — running skill-only match')
      const result = await pool.query(
        `SELECT
           v.id,
           v.name,
           v.phone,
           v.skills,
           v.latitude,
           v.longitude,
           v.available_hours,
           v.is_available,
           NULL AS distance_km,
           (
             SELECT COUNT(*)::int
             FROM unnest(v.skills) AS skill
             WHERE skill = ANY($1::text[])
           ) AS skill_match_count
         FROM volunteers v
         WHERE v.is_available = TRUE
         ORDER BY skill_match_count DESC
         LIMIT 3`,
        [relevantSkills]
      )
      volunteers = result.rows
      console.log(`Skill-only query returned ${volunteers.length} volunteers`)
    }

    // Step 3 — Calculate match score for each volunteer
    const scoredVolunteers = volunteers.map(v => {
      // Skill score — max 60 points
      const skillScore = relevantSkills.length > 0
        ? Math.min((v.skill_match_count / relevantSkills.length) * 60, 60)
        : 20

      // Distance score — max 30 points (closer = higher score)
      const distanceScore = v.distance_km !== null
        ? Math.max(30 - (v.distance_km * 2), 0)
        : 15

      // Availability score — max 10 points
      const availabilityScore = Math.min((v.available_hours || 0) / 20 * 10, 10)

      const matchScore = Math.round(skillScore + distanceScore + availabilityScore)

      return {
        id: v.id,
        name: v.name,
        phone: v.phone,
        skills: v.skills,
        distance_km: v.distance_km ? parseFloat(v.distance_km) : null,
        available_hours: v.available_hours,
        skill_match_count: v.skill_match_count,
        match_score: matchScore
      }
    })

    // Sort by match score descending
    scoredVolunteers.sort((a, b) => b.match_score - a.match_score)

    console.log('Final matches:', scoredVolunteers.map(v => `${v.name} (score: ${v.match_score})`))

    return {
      success: true,
      need: {
        id: need.id,
        category: need.category,
        urgency_score: need.urgency_score,
        location_text: need.location_text,
        latitude: need.latitude,
        longitude: need.longitude
      },
      matches: scoredVolunteers
    }

  } catch (err) {
    console.error('Matching error FULL:', err)
    return { success: false, error: err.message }
  }
}

module.exports = { findMatchingVolunteers }