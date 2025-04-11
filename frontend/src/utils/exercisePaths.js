const movementPatternMap = {
  'horizontal push': 'Horizontal Push',
  'upward push': 'Upward Push',
  'horizontal pull': 'Horizontal Pull',
  'upward pull': 'Upward Pull',
  'downward pull': 'Downward Pull',
  'double leg push': 'Double Leg Push',
  'single leg push': 'Single Leg Push',
  'bent leg hip extension': 'Bent Leg Hip Extension',
  'straight leg hip extension': 'Straight Leg Hip Extension',
  'auxiliary': 'Auxiliary',
  'core stability': 'Core Stability',
  'mobility': 'Mobility',
  'explosive': 'Explosive',
  'cardio': 'Cardio'
};

export const getLocalExercisePath = (exercise) => {
  const patternKey = exercise.patronMovimiento.toLowerCase();
  const patternFolder = movementPatternMap[patternKey] || 'Otros';
  
  const exerciseName = exercise.nombreEjercicio
    .replace(/[^a-zA-Z0-9 -]/g, '') 
    .trim()
    .replace(/\s+/g, ' '); // Normaliza espacios múltiples
    
  return `/ejercicios/${patternFolder}/${exerciseName}.gif`;
};