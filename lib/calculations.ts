/**
 * Utilitaires pour les calculs de rapports et analyses
 */

/**
 * Structure pour les statistiques de distribution de revenus
 */
export interface RevenueDistribution {
  zero: number
  lessThan300: number
  between300And400: number
  greaterOrEqual400: number
  sunday?: number
}

/**
 * Structure pour les statistiques quotidiennes
 */
export interface DailyStats {
  openDays: number
  closedDays: number
  sundayDays: number
  distribution: RevenueDistribution
  averageDaily: number
}

/**
 * Récupère le nombre de jours dans un mois donné
 * @param monthStr Format: YYYY-MM
 * @returns Nombre de jours dans le mois
 */
export const getDaysInMonth = (monthStr: string): number => {
  const [year, month] = monthStr.split("-").map(Number)
  return new Date(year, month, 0).getDate()
}

/**
 * Vérifie si une date est un dimanche
 * @param year Année
 * @param month Mois (1-12)
 * @param day Jour du mois
 * @returns true si c'est un dimanche
 */
export const isSunday = (year: number, month: number, day: number): boolean => {
  const date = new Date(year, month - 1, day)
  return date.getDay() === 0
}

/**
 * Calcule les statistiques quotidiennes pour un mois donné
 * @param entries Entries de revenu
 * @param selectedMonth Format: YYYY-MM
 * @param hideSundays Si true, exclut les dimanches des calculs
 * @returns Statistiques du mois
 */
export const calculateDailyStats = (
  entries: Array<{ date: string; ttc: number }>,
  selectedMonth: string,
  hideSundays: boolean
): DailyStats => {
  const daysInMonth = getDaysInMonth(selectedMonth)
  const [year, month] = selectedMonth.split("-").map(Number)

  // Créer une map des revenus par jour
  const revenueByDay = new Map<number, number>()
  entries.forEach((e) => {
    if (e.date.startsWith(selectedMonth)) {
      const day = parseInt(e.date.split("-")[2], 10)
      const existing = revenueByDay.get(day) || 0
      revenueByDay.set(day, existing + e.ttc)
    }
  })

  // Compter les jours ouverts/fermés/dimanches
  let openDays = 0
  let closedDays = 0
  let sundayDays = 0

  for (let day = 1; day <= daysInMonth; day++) {
    const dayIsSunday = isSunday(year, month, day)

    if (dayIsSunday) {
      if (!hideSundays) {
        sundayDays++
      }
      continue
    }

    if (revenueByDay.has(day)) {
      openDays++
    } else {
      closedDays++
    }
  }

  // Distribution par catégorie
  const distribution: RevenueDistribution = {
    zero: 0,
    lessThan300: 0,
    between300And400: 0,
    greaterOrEqual400: 0,
  }

  if (!hideSundays) {
    distribution.sunday = 0
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dayIsSunday = isSunday(year, month, day)

    if (dayIsSunday && !hideSundays) {
      distribution.sunday = (distribution.sunday ?? 0) + 1
      continue
    }
    if (dayIsSunday && hideSundays) {
      continue
    }

    const revenue = revenueByDay.get(day) || 0
    if (revenue === 0) distribution.zero++
    else if (revenue < 300) distribution.lessThan300++
    else if (revenue < 400) distribution.between300And400++
    else distribution.greaterOrEqual400++
  }

  // Moyenne journalière
  const totalMonthRevenue = Array.from(revenueByDay.values()).reduce((sum, r) => sum + r, 0)
  const averageDaily = openDays > 0 ? totalMonthRevenue / openDays : 0

  return {
    openDays,
    closedDays,
    sundayDays,
    distribution,
    averageDaily,
  }
}
