import type { MuscleGroup } from '../types/exercise'

export interface CommonExercise {
  name: string
  primary_muscle_group: MuscleGroup
}

// ~100 exercices les plus courants en salle de musculation, pour
// demarrer vite sans avoir a tout creer a la main. Glisser un de ces
// exos sur une seance le materialise automatiquement dans la
// bibliotheque de l'utilisateur (cf ProgramDetail.tsx).
export const COMMON_EXERCISES: CommonExercise[] = [
  // Pecs
  { name: 'Developpe couche barre', primary_muscle_group: 'Pecs' },
  { name: 'Developpe couche halteres', primary_muscle_group: 'Pecs' },
  { name: 'Developpe incline barre', primary_muscle_group: 'Pecs' },
  { name: 'Developpe incline halteres', primary_muscle_group: 'Pecs' },
  { name: 'Developpe decline', primary_muscle_group: 'Pecs' },
  { name: 'Ecarte couche halteres', primary_muscle_group: 'Pecs' },
  { name: 'Ecarte a la poulie (fly)', primary_muscle_group: 'Pecs' },
  { name: 'Dips (pecs)', primary_muscle_group: 'Pecs' },
  { name: 'Developpe a la machine', primary_muscle_group: 'Pecs' },
  { name: 'Pompes', primary_muscle_group: 'Pecs' },

  // Dos
  { name: 'Tractions', primary_muscle_group: 'Dos' },
  { name: 'Tractions supination', primary_muscle_group: 'Dos' },
  { name: 'Rowing barre', primary_muscle_group: 'Dos' },
  { name: 'Rowing haltere', primary_muscle_group: 'Dos' },
  { name: 'Tirage horizontal poulie basse', primary_muscle_group: 'Dos' },
  { name: 'Tirage vertical poulie haute', primary_muscle_group: 'Dos' },
  { name: 'Souleve de terre', primary_muscle_group: 'Dos' },
  { name: 'Rowing T-bar', primary_muscle_group: 'Dos' },
  { name: 'Hyperextensions', primary_muscle_group: 'Dos' },
  { name: 'Shrugs (trapezes)', primary_muscle_group: 'Dos' },
  { name: 'Pull-over', primary_muscle_group: 'Dos' },
  { name: 'Rowing unilateral halteres', primary_muscle_group: 'Dos' },

  // Epaules
  { name: 'Developpe militaire barre', primary_muscle_group: 'Epaules' },
  { name: 'Developpe militaire halteres', primary_muscle_group: 'Epaules' },
  { name: 'Elevations laterales', primary_muscle_group: 'Epaules' },
  { name: 'Elevations frontales', primary_muscle_group: 'Epaules' },
  { name: 'Oiseau (elevations arriere)', primary_muscle_group: 'Epaules' },
  { name: 'Developpe Arnold', primary_muscle_group: 'Epaules' },
  { name: 'Face pull', primary_muscle_group: 'Epaules' },
  { name: 'Rowing menton', primary_muscle_group: 'Epaules' },
  { name: 'Developpe epaules machine', primary_muscle_group: 'Epaules' },
  { name: 'Elevations laterales poulie', primary_muscle_group: 'Epaules' },

  // Biceps
  { name: 'Curl barre', primary_muscle_group: 'Biceps' },
  { name: 'Curl halteres', primary_muscle_group: 'Biceps' },
  { name: 'Curl marteau', primary_muscle_group: 'Biceps' },
  { name: 'Curl pupitre', primary_muscle_group: 'Biceps' },
  { name: 'Curl a la poulie', primary_muscle_group: 'Biceps' },
  { name: 'Curl concentre', primary_muscle_group: 'Biceps' },
  { name: 'Curl inverse', primary_muscle_group: 'Biceps' },

  // Triceps
  { name: 'Extension triceps poulie haute', primary_muscle_group: 'Triceps' },
  { name: 'Barre au front', primary_muscle_group: 'Triceps' },
  { name: 'Extension nuque haltere', primary_muscle_group: 'Triceps' },
  { name: 'Dips (triceps)', primary_muscle_group: 'Triceps' },
  { name: 'Kickback triceps', primary_muscle_group: 'Triceps' },
  { name: 'Extension triceps corde', primary_muscle_group: 'Triceps' },
  { name: 'Developpe serre', primary_muscle_group: 'Triceps' },
  { name: 'Extension triceps unilaterale', primary_muscle_group: 'Triceps' },

  // Avant-bras
  { name: 'Curl poignet', primary_muscle_group: 'Avant-bras' },
  { name: 'Curl poignet inverse', primary_muscle_group: 'Avant-bras' },
  { name: "Farmer's walk", primary_muscle_group: 'Avant-bras' },
  { name: 'Enroulement de barre', primary_muscle_group: 'Avant-bras' },

  // Quadriceps
  { name: 'Squat barre', primary_muscle_group: 'Quadriceps' },
  { name: 'Squat avant', primary_muscle_group: 'Quadriceps' },
  { name: 'Presse a cuisses', primary_muscle_group: 'Quadriceps' },
  { name: 'Fentes', primary_muscle_group: 'Quadriceps' },
  { name: 'Fentes bulgares', primary_muscle_group: 'Quadriceps' },
  { name: 'Leg extension', primary_muscle_group: 'Quadriceps' },
  { name: 'Squat gobelet', primary_muscle_group: 'Quadriceps' },
  { name: 'Hack squat', primary_muscle_group: 'Quadriceps' },
  { name: 'Squat bulgare', primary_muscle_group: 'Quadriceps' },
  { name: 'Step-up', primary_muscle_group: 'Quadriceps' },

  // Ischio-jambiers
  { name: 'Souleve de terre jambes tendues', primary_muscle_group: 'Ischio-jambiers' },
  { name: 'Leg curl allonge', primary_muscle_group: 'Ischio-jambiers' },
  { name: 'Leg curl assis', primary_muscle_group: 'Ischio-jambiers' },
  { name: 'Good morning', primary_muscle_group: 'Ischio-jambiers' },
  { name: 'Nordic curl', primary_muscle_group: 'Ischio-jambiers' },
  { name: 'Souleve de terre sumo', primary_muscle_group: 'Ischio-jambiers' },
  { name: 'Glute-ham raise', primary_muscle_group: 'Ischio-jambiers' },

  // Fessiers
  { name: 'Hip thrust', primary_muscle_group: 'Fessiers' },
  { name: 'Fentes marchees', primary_muscle_group: 'Fessiers' },
  { name: 'Kickback fessier poulie', primary_muscle_group: 'Fessiers' },
  { name: 'Abduction hanche machine', primary_muscle_group: 'Fessiers' },
  { name: 'Squat sumo', primary_muscle_group: 'Fessiers' },
  { name: 'Pont fessier', primary_muscle_group: 'Fessiers' },
  { name: 'Step-up fessier', primary_muscle_group: 'Fessiers' },

  // Mollets
  { name: 'Extension mollets debout', primary_muscle_group: 'Mollets' },
  { name: 'Extension mollets assis', primary_muscle_group: 'Mollets' },
  { name: 'Presse mollets', primary_muscle_group: 'Mollets' },
  { name: 'Sauts a la corde', primary_muscle_group: 'Mollets' },

  // Abdos
  { name: 'Crunch', primary_muscle_group: 'Abdos' },
  { name: 'Releve de jambes suspendu', primary_muscle_group: 'Abdos' },
  { name: 'Planche (gainage)', primary_muscle_group: 'Abdos' },
  { name: 'Russian twist', primary_muscle_group: 'Abdos' },
  { name: 'Crunch poulie haute', primary_muscle_group: 'Abdos' },
  { name: 'Ab wheel', primary_muscle_group: 'Abdos' },
  { name: 'Mountain climber', primary_muscle_group: 'Abdos' },
  { name: 'Gainage lateral', primary_muscle_group: 'Abdos' },
  { name: 'Crunch inverse', primary_muscle_group: 'Abdos' },
  { name: 'Dragon flag', primary_muscle_group: 'Abdos' },

  // Full body
  { name: 'Clean and jerk', primary_muscle_group: 'Full body' },
  { name: 'Snatch', primary_muscle_group: 'Full body' },
  { name: 'Burpees', primary_muscle_group: 'Full body' },
  { name: 'Thruster', primary_muscle_group: 'Full body' },
  { name: 'Kettlebell swing', primary_muscle_group: 'Full body' },
  { name: 'Turkish get-up', primary_muscle_group: 'Full body' },

  // Cardio
  { name: 'Rameur', primary_muscle_group: 'Cardio' },
  { name: 'Velo elliptique', primary_muscle_group: 'Cardio' },
  { name: 'Course tapis', primary_muscle_group: 'Cardio' },
  { name: 'Assault bike', primary_muscle_group: 'Cardio' },
  { name: 'Corde a sauter', primary_muscle_group: 'Cardio' },
]
