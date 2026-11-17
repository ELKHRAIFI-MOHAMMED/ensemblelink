export type UserType = "ADMIN" | "ASSOCIATION" | "CITOYEN";
export type AnnonceType = "EVENEMENT" | "DON" | "APPEL_BENEVOLAT";
export type StatutCandidature = "EN_ATTENTE" | "ACCEPTEE" | "REFUSEE" | "ANNULEE";
export type StatutVerification = "EN_ATTENTE" | "VERIFIEE" | "REJETEE";

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface User {
  id: number;
  username: string;
  email: string;
  type: UserType;
  is_active: boolean;
  date_joined?: string;
}

export interface UserMini {
  id: number;
  username: string;
  type: UserType;
  nom_affiche: string;
  avatar: string | null;
  profil_id: number | null;
}

export interface Categorie {
  id: number;
  nom: string;
  icone: string;
  couleur: string;
  nombre_annonces?: number;
}

export interface Competence {
  id: number;
  nom: string;
}

export interface AssociationMini {
  id: number;
  user: number;
  nom: string;
  logo: string | null;
  ville: string;
  statut_verification: StatutVerification;
}

export interface Association extends AssociationMini {
  description: string;
  contact: string;
  telephone: string;
  site_web: string;
  adresse: string;
  reseaux_sociaux: Record<string, string>;
  motif_rejet: string;
  date_creation: string;
  note_moyenne?: number | null;
  nombre_avis?: number;
  nombre_annonces?: number;
  email?: string;
  compte_actif?: boolean;
}

export interface PhotoAlbum {
  id: number;
  image: string;
  legende: string;
}

export interface Citoyen {
  id: number;
  user: number;
  prenom: string;
  nom: string;
  bio: string;
  experiences: string;
  ville: string;
  photo: string | null;
  competences: number[];
  centres_interet: number[];
  competences_detail: Competence[];
  centres_interet_detail: Categorie[];
  album: PhotoAlbum[];
}

export interface Annonce {
  id: number;
  titre: string;
  description: string;
  type: AnnonceType;
  association: AssociationMini;
  categorie: number | null;
  categorie_detail: Categorie | null;
  competences_requises: number[];
  competences_detail: Competence[];
  lieu: string;
  ville: string;
  latitude: string | null;
  longitude: string | null;
  date_debut: string;
  date_fin: string;
  nombre_places: number | null;
  objectif_don: string | null;
  unite_don: string;
  image: string | null;
  est_active: boolean;
  date_creation: string;
  places_prises: number;
  places_restantes: number | null;
  est_complete: boolean;
  est_terminee: boolean;
  quantite_collectee: number;
  duree_heures: number;
  ma_candidature: { id: number; statut: StatutCandidature } | null;
}

export interface Candidature {
  id: number;
  annonce: number;
  annonce_detail: {
    id: number;
    titre: string;
    type: AnnonceType;
    lieu: string;
    ville: string;
    date_debut: string;
    date_fin: string;
    association: AssociationMini;
    unite_don: string;
  };
  citoyen: { id: number; user: number; prenom: string; nom: string; ville: string; photo: string | null };
  statut: StatutCandidature;
  message: string;
  date_candidature: string;
  date_reponse: string | null;
  note_engagement: number | null;
  presence_confirmee: boolean;
  heures_effectuees: string;
  quantite_don: string | null;
  code_presence: string | null;
  peut_attestation: boolean;
}

export interface Badge {
  code: string;
  libelle: string;
  emoji: string;
  description: string;
  obtenu: boolean;
}

export interface StatsCitoyen {
  heures_benevolat: number;
  missions_realisees: number;
  dons_effectues: number;
  candidatures_total: number;
  candidatures_en_attente: number;
  note_moyenne: number | null;
  nombre_avis: number;
  badges: Badge[];
}

export interface StatsAssociation {
  annonces_total: number;
  annonces_actives: number;
  candidatures_total: number;
  candidatures_en_attente: number;
  benevoles_mobilises: number;
  heures_benevolat: number;
  taux_presence: number | null;
  note_moyenne: number | null;
  nombre_avis: number;
}

export interface StatsGlobales {
  associations: number;
  benevoles: number;
  missions: number;
  missions_actives: number;
  heures_benevolat: number;
  engagements: number;
}

export interface Avis {
  id: number;
  auteur: UserMini;
  cible: number;
  cible_detail: UserMini;
  annonce: number;
  annonce_titre: string;
  note: number;
  commentaire: string;
  date_creation: string;
}

export interface AvisADonner {
  annonce: number;
  annonce_titre: string;
  cible: number;
  cible_nom: string;
}

export interface Notification {
  id: number;
  titre: string;
  message: string;
  lien: string;
  lue: boolean;
  date_creation: string;
}

export interface Conversation {
  user: UserMini;
  dernier_message: string;
  date: string | null;
  non_lus: number;
}

export interface Message {
  id: number;
  sender: UserMini;
  receiver: UserMini;
  contenu: string;
  date_envoi: string;
  lu: boolean;
  is_own: boolean;
}

export interface Signalement {
  id: number;
  auteur: UserMini;
  annonce: number | null;
  annonce_titre: string | null;
  utilisateur_signale: number | null;
  utilisateur_signale_detail: UserMini | null;
  motif: string;
  statut: "OUVERT" | "TRAITE" | "REJETE";
  date_creation: string;
}

export interface Me {
  user: User;
  profil: (Association | Citoyen) | null;
  stats: (StatsCitoyen | StatsAssociation) | null;
}
