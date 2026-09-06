import * as bcrypt from 'bcryptjs';

export type Role = 'ADMIN' | 'COMMERCIAL';
export type UserStatus = 'ACTIVE' | 'DISABLED';
export type LeadStatus = 'NEW' | 'CONTACTED' | 'INTERESTED' | 'NEGOTIATING' | 'CONVERTED';
export type DealStage = 'PROSPECT' | 'QUALIFIED' | 'PROPOSAL' | 'NEGOTIATION' | 'WON' | 'LOST';
export type ActivityType = 'CALL' | 'EMAIL' | 'MEETING' | 'EVENT';
export type RelatedEntityType = 'CUSTOMER' | 'LEAD' | 'DEAL';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type TaskStatus = 'OPEN' | 'DONE';

export interface UserRecord {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  role: Role;
  status: UserStatus;
  password: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerRecord {
  id: string;
  firstname: string;
  lastname: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  tags: string[];
  ownerId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LeadRecord {
  id: string;
  firstname: string;
  lastname: string;
  company: string;
  email: string;
  phone: string;
  source: string;
  status: LeadStatus;
  tags: string[];
  ownerId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DealRecord {
  id: string;
  title: string;
  customerId: string;
  amount: number;
  stage: DealStage;
  expectedCloseDate: string;
  notes: string;
  ownerId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityRecord {
  id: string;
  type: ActivityType;
  subject: string;
  description: string;
  relatedType: RelatedEntityType;
  relatedId: string;
  ownerId: string | null;
  occurredAt: string;
  createdAt: string;
}

export interface TaskRecord {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
  relatedType: RelatedEntityType | null;
  relatedId: string | null;
  ownerId: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NoteRecord {
  id: string;
  content: string;
  relatedType: RelatedEntityType;
  relatedId: string;
  authorId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SeedData {
  users: UserRecord[];
  customers: CustomerRecord[];
  leads: LeadRecord[];
  deals: DealRecord[];
  activities: ActivityRecord[];
  tasks: TaskRecord[];
  notes: NoteRecord[];
}

const DAY = 24 * 60 * 60 * 1000;
const now = () => new Date().toISOString();
const iso = (daysAgo: number, jitter = 0) =>
  new Date(Date.now() - daysAgo * DAY - jitter * 3600 * 1000).toISOString();

const firstNames = [
  'Luc', 'Marie', 'Paul', ' Sophie', 'Hugo', 'Emma', 'Louis', 'Chloé',
  'Jules', 'Léa', 'Tom', 'Manon', 'Nathan', 'Sarah', 'Léo', 'Inès',
  'Gabriel', 'Alice', 'Raphaël', 'Julie', 'Adam', 'Camille', 'Théo', 'Zoé',
  'Antoine', 'Laura', 'Ethan', 'Jade', 'Noah', 'Lucie',
];
const lastNames = [
  'Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit',
  'Durand', 'Leroy', 'Moreau', 'Simon', 'Laurent', 'Lefebvre', 'Michel',
  'Garcia', 'David', 'Bertrand', 'Roux', 'Vincent', 'Fournier',
];
const companies = [
  'TechNova', 'Acme SARL', 'Globex', 'Initech', 'Umbrella', 'Hooli',
  'Pied Piper', 'Stark Industries', 'Wayne Corp', 'Soylent', 'Cyberdyne',
  'Massive Dynamic',
];
const cities = ['Paris', 'Lyon', 'Marseille', 'Bordeaux', 'Lille', 'Nantes'];
const leadSources = [
  'Site web', 'Réseaux sociaux', 'Salon professionnel',
  'Recommandation', 'Appel entrant',
];
const leadStatuses: LeadStatus[] = ['NEW', 'CONTACTED', 'INTERESTED', 'NEGOTIATING', 'CONVERTED'];
const dealStages: DealStage[] = ['PROSPECT', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'];

const callSubjects = [
  'Appel de suivi', 'Premier contact téléphonique',
  'Point hebdomadaire', 'Relance téléphonique',
];
const emailSubjects = [
  'Envoi de la proposition', 'Relance par email',
  'Confirmation de rendez-vous', 'Documentation envoyée',
];
const meetingSubjects = [
  'Réunion de présentation', 'Atelier de cadrage',
  'Démo produit', 'Négociation tarifaire',
];

const taskTitles = [
  'Rappeler le client', 'Envoyer la facture',
  'Préparer la proposition commerciale', 'Planifier une démonstration',
  'Faire suivre le contrat', 'Mettre à jour la fiche client',
  'Relancer le prospect', 'Vérifier les disponibilités',
];
const taskDueOffsets = [-4, -2, -1, 0, 0, 1, 2, 3];

const noteContents = [
  'Client privilégié : privilégier un suivi mensuel rapproché.',
  'Sensible au rapport qualité/prix, proposer une offre adaptée.',
  'Décideur principal, impliquer dans toutes les négociations.',
  'Société en croissance, fort potentiel de développement.',
  'Demande un devis détaillé pour comparaison concurrents.',
  'Rencontre prévue lors du prochain salon professionnel.',
  'Budget limité ce trimestre, recontacter au T3.',
  'Excellent relationnel, opportunité d\'upsell sur les modules avancés.',
];

const pick = <T>(arr: T[], i: number): T => arr[i % arr.length];

export async function buildSeed(): Promise<SeedData> {
  const hash = (p: string) => bcrypt.hashSync(p, 10);

  const users: UserRecord[] = [
    {
      id: 'u-admin-1', firstname: 'Alice', lastname: 'Admin',
      email: 'admin@crm.com', phone: '+33 6 11 22 33 44',
      role: 'ADMIN', status: 'ACTIVE', password: hash('admin123'),
      createdAt: iso(120, 2), updatedAt: iso(120, 2),
    },
    {
      id: 'u-comm-1', firstname: 'Bruno', lastname: 'Commercial',
      email: 'commercial@crm.com', phone: '+33 6 22 33 44 55',
      role: 'COMMERCIAL', status: 'ACTIVE', password: hash('commercial123'),
      createdAt: iso(100, 1), updatedAt: iso(100, 1),
    },
    {
      id: 'u-comm-2', firstname: 'Claire', lastname: 'Vente',
      email: 'claire@crm.com', phone: '+33 6 33 44 55 66',
      role: 'COMMERCIAL', status: 'ACTIVE', password: hash('claire123'),
      createdAt: iso(90, 3), updatedAt: iso(90, 3),
    },
    {
      id: 'u-comm-3', firstname: 'David', lastname: 'Prospect',
      email: 'david@crm.com', phone: '+33 6 44 55 66 77',
      role: 'COMMERCIAL', status: 'DISABLED', password: hash('david123'),
      createdAt: iso(60, 0), updatedAt: iso(60, 0),
    },
  ];

  const customers: CustomerRecord[] = [];
  for (let i = 0; i < 18; i++) {
    const fn = pick(firstNames, i);
    const ln = pick(lastNames, i + 3);
    const company = pick(companies, i);
    const ownerId = i % 3 === 0 ? 'u-comm-2' : 'u-comm-1';
    customers.push({
      id: `c-${i + 1}`,
      firstname: fn.trim(),
      lastname: ln,
      company,
      email: i % 4 === 0 ? '' : `client${i + 1}@${company.toLowerCase().replace(/[^a-z]/g, '')}.com`,
      phone: `+33 6 ${String(10 + i).padStart(2, '0')} ${String(20 + i).padStart(2, '0')} ${String(30 + i).padStart(2, '0')} ${String(40 + i).padStart(2, '0')}`,
      address: `${i + 1} rue du Commerce`,
      city: pick(cities, i),
      country: 'France',
      tags: i % 5 === 0 ? ['VIP'] : i % 7 === 0 ? ['À relancer'] : [],
      ownerId,
      createdAt: iso(i * 9, 5),
      updatedAt: iso(i * 9, 5),
    });
  }

  const leads: LeadRecord[] = [];
  for (let i = 0; i < 22; i++) {
    const fn = pick(firstNames, i + 5);
    const ln = pick(lastNames, i + 7);
    const ownerId = i % 2 === 0 ? 'u-comm-1' : 'u-comm-2';
    leads.push({
      id: `l-${i + 1}`,
      firstname: fn.trim(),
      lastname: ln,
      company: pick(companies, i + 2),
      email: i % 5 === 0 ? '' : `prospect${i + 1}@${pick(companies, i + 4).toLowerCase().replace(/[^a-z]/g, '')}.com`,
      phone: `+33 6 ${String(50 + i).padStart(2, '0')} ${String(60 + i).padStart(2, '0')} ${String(70 + i).padStart(2, '0')} ${String(80 + i).padStart(2, '0')}`,
      source: pick(leadSources, i),
      status: pick(leadStatuses, i),
      tags: i % 6 === 0 ? ['Hot'] : i % 8 === 0 ? ['Stratégique'] : [],
      ownerId,
      createdAt: iso(i * 7, 4),
      updatedAt: iso(i * 7, 4),
    });
  }

  const deals: DealRecord[] = [];
  for (let i = 0; i < 15; i++) {
    const customer = customers[i % 18];
    deals.push({
      id: `d-${i + 1}`,
      title: `Contrat ${customer.company}`,
      customerId: customer.id,
      amount: ((i % 5) + 1) * 2500 + 1000,
      stage: pick(dealStages, i),
      expectedCloseDate: iso(i * 5, 8).slice(0, 10),
      notes: '',
      ownerId: customer.ownerId,
      createdAt: iso(i * 11, 3),
      updatedAt: iso(i * 11, 3),
    });
  }

  const activities: ActivityRecord[] = [];
  let actIdx = 0;
  const types: ActivityType[] = ['CALL', 'EMAIL', 'MEETING'];
  const subjectPool: Record<ActivityType, string[]> = {
    CALL: callSubjects, EMAIL: emailSubjects, MEETING: meetingSubjects, EVENT: [],
  };
  const attach = (
    relatedType: RelatedEntityType,
    relatedId: string,
    ownerId: string | null,
    baseDaysAgo: number,
  ) => {
    const type = pick(types, actIdx);
    activities.push({
      id: `a-${activities.length + 1}`,
      type,
      subject: pick(subjectPool[type], actIdx),
      description: actIdx % 3 === 0 ? 'Échange positif, à retenir dans le suivi du compte.' : '',
      relatedType,
      relatedId,
      ownerId,
      occurredAt: iso(baseDaysAgo, actIdx),
      createdAt: iso(baseDaysAgo, actIdx),
    });
    actIdx++;
  };

  for (let i = 0; i < 8; i++) {
    attach('CUSTOMER', `c-${i + 1}`, customers[i].ownerId, i * 3 + 1);
    if (i % 2 === 0) attach('CUSTOMER', `c-${i + 1}`, customers[i].ownerId, i * 3);
  }
  for (let i = 0; i < 8; i++) {
    attach('LEAD', `l-${i + 1}`, leads[i].ownerId, i * 2 + 1);
    if (i % 3 === 0) attach('LEAD', `l-${i + 1}`, leads[i].ownerId, i * 2);
  }
  for (let i = 0; i < 8; i++) {
    attach('DEAL', `d-${i + 1}`, deals[i].ownerId, i * 4 + 2);
  }
  activities.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));

  const tasks: TaskRecord[] = [];
  for (let i = 0; i < taskTitles.length; i++) {
    const done = i >= 5;
    let relatedType: RelatedEntityType | null = null;
    let relatedId: string | null = null;
    if (i < 4) {
      relatedType = 'CUSTOMER';
      relatedId = `c-${i + 1}`;
    } else if (i < 7) {
      relatedType = 'LEAD';
      relatedId = `l-${i - 3}`;
    }
    const owner = i % 2 === 0 ? 'u-comm-1' : 'u-comm-2';
    tasks.push({
      id: `t-${i + 1}`,
      title: taskTitles[i],
      description: '',
      dueDate: iso(taskDueOffsets[i], 0).slice(0, 10),
      priority: (['HIGH', 'MEDIUM', 'LOW'] as TaskPriority[])[i % 3],
      status: done ? 'DONE' : 'OPEN',
      relatedType,
      relatedId,
      ownerId: owner,
      completedAt: done ? iso(2, 2) : null,
      createdAt: iso(i * 2 + 1, 1),
      updatedAt: done ? iso(2, 2) : iso(i * 2 + 1, 1),
    });
  }

  const notes: NoteRecord[] = [];
  for (let i = 0; i < noteContents.length; i++) {
    const isCustomer = i % 2 === 0;
    const relatedType: RelatedEntityType = isCustomer ? 'CUSTOMER' : 'LEAD';
    const relatedId = isCustomer ? `c-${(i % 18) + 1}` : `l-${(i % 22) + 1}`;
    const authorId = isCustomer
      ? customers[i % 18].ownerId
      : leads[i % 22].ownerId;
    notes.push({
      id: `n-${i + 1}`,
      content: noteContents[i],
      relatedType,
      relatedId,
      authorId,
      createdAt: iso(i * 3, 3),
      updatedAt: iso(i * 3, 3),
    });
  }

  return { users, customers, leads, deals, activities, tasks, notes };
}

export { now };