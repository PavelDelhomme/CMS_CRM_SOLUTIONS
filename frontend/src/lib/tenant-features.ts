/**
 * Utilitaires pour gérer les features des tenants
 */

/**
 * Vérifie si une feature est activée pour un tenant
 * @param featureId - L'identifiant de la feature à vérifier
 * @param enabledFeatures - La liste des features activées
 * @returns true si la feature est activée, false sinon
 */
export function isFeatureEnabled(
  featureId: string,
  enabledFeatures: string[]
): boolean {
  if (!enabledFeatures || enabledFeatures.length === 0) {
    // Si aucune feature n'est configurée, on active tout par défaut (backward compatibility)
    return true
  }
  
  return enabledFeatures.includes(featureId)
}

/**
 * Vérifie si plusieurs features sont activées
 * @param featureIds - Les identifiants des features à vérifier
 * @param enabledFeatures - La liste des features activées
 * @returns true si toutes les features sont activées, false sinon
 */
export function areFeaturesEnabled(
  featureIds: string[],
  enabledFeatures: string[]
): boolean {
  return featureIds.every(featureId => isFeatureEnabled(featureId, enabledFeatures))
}

/**
 * Vérifie si au moins une feature est activée
 * @param featureIds - Les identifiants des features à vérifier
 * @param enabledFeatures - La liste des features activées
 * @returns true si au moins une feature est activée, false sinon
 */
export function isAnyFeatureEnabled(
  featureIds: string[],
  enabledFeatures: string[]
): boolean {
  return featureIds.some(featureId => isFeatureEnabled(featureId, enabledFeatures))
}

