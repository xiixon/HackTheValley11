import { prisma } from '../src/db/prisma';
import { canadianFormulations } from '../../../packages/shared/src/canadianClassification';
try {
  let added = 0;
  for (const rule of canadianFormulations.filter(rule => rule.status === 'non_prescription')) {
    const result = await prisma.medication.upsert({ where: { id: rule.id }, update: {}, create: {
      id: rule.id, genericName: rule.ingredient, brandName: `${rule.ingredient} ${rule.strengthMg} mg (Canadian reference)`, dosageForm: rule.dosageForm,
      purposes: [], warning: ['Read the product label. Ask a pharmacist about suitability, interactions and directions.'], avoidWithConditions: [], avoidWithIngredients: [],
      ingredients: { create: [{ name: rule.ingredient, strengthMg: rule.strengthMg }] },
    } });
    if (result) added++;
  }
  console.log(JSON.stringify({ canadianReferencesAvailable: added, totalMedicines: await prisma.medication.count() }));
} finally { await prisma.$disconnect(); }
