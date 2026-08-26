/**
 * Utilitaires pour le module Clients (formatage de dates, labels et calculs)
 */

export function formatDernierAchat(dateStr?: string): { text: string; isRecent: boolean; isAncient: boolean } {
  if (!dateStr) {
    return { text: 'Jamais acheté', isRecent: false, isAncient: false };
  }

  const d = new Date(dateStr);
  if (isNaN(d.getTime())) {
    return { text: dateStr, isRecent: false, isAncient: false };
  }

  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return { text: "Aujourd'hui", isRecent: true, isAncient: false };
  } else if (diffDays === 1) {
    return { text: 'Hier', isRecent: true, isAncient: false };
  } else if (diffDays < 7) {
    return { text: `Il y a ${diffDays}j`, isRecent: true, isAncient: false };
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return { text: `Il y a ${weeks} sem.`, isRecent: false, isAncient: false };
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return { text: `Il y a ${months} mois`, isRecent: false, isAncient: diffDays > 60 };
  } else {
    return {
      text: d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }),
      isRecent: false,
      isAncient: true,
    };
  }
}
