const CATEGORY_SEVERITY = {
  medical: 1.5,
  water: 1.3,
  food: 1.2,
  shelter: 1.1,
  education: 0.8,
  other: 1.0
}

const calculateUrgencyScore = ({ urgency_score, people_affected, category, created_at }) => {
  const baseLLMScore = urgency_score || 5

  const severityWeight = CATEGORY_SEVERITY[category] || 1.0

  // People affected weight — caps at 2.0 for 100+ people
  const peopleWeight = people_affected
    ? Math.min(1 + (people_affected / 100), 2.0)
    : 1.0

  // Time penalty — adds 0.1 per hour the need goes unaddressed, caps at +2
  const hoursOpen = created_at
    ? (Date.now() - new Date(created_at).getTime()) / (1000 * 60 * 60)
    : 0
  const timePenalty = Math.min(hoursOpen * 0.1, 2.0)

  const rawScore = (baseLLMScore * severityWeight * peopleWeight) + timePenalty

  // Clamp final score between 1 and 10
  return Math.min(Math.max(Math.round(rawScore), 1), 10)
}

module.exports = { calculateUrgencyScore }