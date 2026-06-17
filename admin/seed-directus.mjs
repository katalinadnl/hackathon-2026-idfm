/**
 * Roles:
 *   - Administrateur  → full CRUD on all data collections + admin_access
 *   - Opérateur        → CRU on operational collections, read-only on reference
 *   - Lecteur          → read-only on all collections
 *
 * Usage: node admin/seed-directus.mjs
 */

const DIRECTUS_URL = process.env.DIRECTUS_URL || 'http://localhost:8055';
const ADMIN_EMAIL = process.env.DIRECTUS_ADMIN_EMAIL || 'admin@idfm.fr';
const ADMIN_PASSWORD = process.env.DIRECTUS_ADMIN_PASSWORD || 'Admin123!';

const ALL_COLLECTIONS = [
  'Beneficiary',
  'Account',
  'Subscription',
  'Payment',
  'Department',
  'StatusVerification',
];

const DIRECTUS_UI_COLLECTIONS = [
  'directus_files',
  'directus_folders',
  'directus_dashboards',
  'directus_panels',
  'directus_notifications',
  'directus_shares',
  'directus_translations',
  'directus_presets',
  'directus_settings',
  'directus_collections',
  'directus_fields',
  'directus_relations',
];

const ROLES = [
  {
    name: 'Administrateur',
    icon: 'admin_panel_settings',
    description: 'Accès complet : lecture, écriture, suppression sur toutes les collections.',
    admin_access: true,
    app_access: true,
    permissions: ALL_COLLECTIONS.map((c) => ({
      collection: c,
      actions: ['create', 'read', 'update', 'delete'],
    })),
  },
  {
    name: 'Opérateur',
    icon: 'engineering',
    description:
      'Gestion opérationnelle : CRUD bénéficiaires/abonnements/paiements. Lecture seule comptes/départements.',
    admin_access: false,
    app_access: true,
    permissions: [
      ...['Beneficiary', 'Subscription', 'Payment', 'StatusVerification'].map((c) => ({
        collection: c,
        actions: ['create', 'read', 'update'],
      })),
      ...['Account', 'Department'].map((c) => ({
        collection: c,
        actions: ['read'],
      })),
    ],
  },
  {
    name: 'Lecteur',
    icon: 'visibility',
    description: 'Consultation uniquement : lecture seule sur toutes les collections.',
    admin_access: false,
    app_access: true,
    permissions: ALL_COLLECTIONS.map((c) => ({
      collection: c,
      actions: ['read'],
    })),
  },
];

async function api(path, options = {}) {
  const res = await fetch(`${DIRECTUS_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${options.method || 'GET'} ${path} → ${res.status}: ${body}`);
  }
  if (res.status === 204) return { data: null };
  return res.json();
}

async function main() {
  console.log(`Connecting to Directus at ${DIRECTUS_URL}…\n`);

  const { data: auth } = await api('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  const headers = { Authorization: `Bearer ${auth.access_token}` };

  const { data: existingRoles } = await api('/roles', { headers });

  for (const roleDef of ROLES) {
    console.log(`▸ Role "${roleDef.name}"`);

    const { data: allPolicies } = await api('/policies', { headers });
    let policyId;
    const existingPolicy = allPolicies.find((p) => p.name === roleDef.name);

    if (existingPolicy) {
      policyId = existingPolicy.id;
      console.log(`  Policy exists (${policyId})`);
      await api(`/policies/${policyId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          admin_access: roleDef.admin_access,
          app_access: roleDef.app_access,
          icon: roleDef.icon,
          description: roleDef.description,
        }),
      });
    } else {
      const { data: newPolicy } = await api('/policies', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: roleDef.name,
          icon: roleDef.icon,
          description: roleDef.description,
          admin_access: roleDef.admin_access,
          app_access: roleDef.app_access,
        }),
      });
      policyId = newPolicy.id;
      console.log(`  Policy created (${policyId})`);
    }

    const existingRole = existingRoles.find((r) => r.name === roleDef.name);
    let roleId;

    if (existingRole) {
      roleId = existingRole.id;
      console.log(`  Role exists (${roleId})`);
    } else {
      const { data: newRole } = await api('/roles', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: roleDef.name,
          icon: roleDef.icon,
          description: roleDef.description,
          policies: { create: [{ policy: policyId }] },
        }),
      });
      roleId = newRole.id;
      console.log(`  Role created (${roleId})`);
    }

    const { data: existingPerms } = await api(
      `/permissions?filter[policy][_eq]=${policyId}&limit=-1`,
      { headers },
    );
    for (const perm of existingPerms) {
      await api(`/permissions/${perm.id}`, { method: 'DELETE', headers });
    }

    let count = 0;
    for (const permDef of roleDef.permissions) {
      for (const action of permDef.actions) {
        await api('/permissions', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            policy: policyId,
            collection: permDef.collection,
            action,
            fields: ['*'],
          }),
        });
        count++;
      }
    }

    if (!roleDef.admin_access) {
      for (const col of DIRECTUS_UI_COLLECTIONS) {
        await api('/permissions', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            policy: policyId,
            collection: col,
            action: 'read',
            fields: ['*'],
          }),
        });
        count++;
      }
      for (const action of ['read', 'update']) {
        await api('/permissions', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            policy: policyId,
            collection: 'directus_users',
            action,
            fields: ['*'],
            permissions: { id: { _eq: '$CURRENT_USER' } },
          }),
        });
        count++;
      }
      for (const col of ['directus_roles', 'directus_policies', 'directus_permissions']) {
        await api('/permissions', {
          method: 'POST',
          headers,
          body: JSON.stringify({ policy: policyId, collection: col, action: 'read', fields: ['*'] }),
        });
        count++;
      }
    }

    console.log(`  ✓ ${count} permissions set`);
  }

  console.log('\n▸ Demo users');
  const { data: freshRoles } = await api('/roles', { headers });
  const { data: existingUsers } = await api('/users', { headers });

  const demoUsers = [
    { email: 'operateur@idfm.fr', password: 'Operateur123!', roleName: 'Opérateur', first_name: 'Marie', last_name: 'Durand' },
    { email: 'lecteur@idfm.fr', password: 'Lecteur123!', roleName: 'Lecteur', first_name: 'Paul', last_name: 'Bernard' },
  ];

  for (const u of demoUsers) {
    const role = freshRoles.find((r) => r.name === u.roleName);
    if (!role) { console.log(`  ⚠ Role "${u.roleName}" not found`); continue; }
    if (existingUsers.find((e) => e.email === u.email)) { console.log(`  "${u.email}" exists, skipping`); continue; }

    await api('/users', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        email: u.email,
        password: u.password,
        role: role.id,
        first_name: u.first_name,
        last_name: u.last_name,
        status: 'active',
      }),
    });
    console.log(`  ✓ "${u.email}" → ${u.roleName}`);
  }

  console.log('\n▸ Project settings');
  await api('/settings', {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      project_name: 'IDFM Admin',
      project_descriptor: 'Gestion des aides transport Île-de-France',
      project_color: '#003DA5',
      default_language: 'fr-FR',
    }),
  });

  const collectionsMeta = [
    { name: 'Beneficiary', icon: 'people', note: 'Bénéficiaires des aides transport', singular: 'Bénéficiaire', plural: 'Bénéficiaires' },
    { name: 'Account', icon: 'manage_accounts', note: 'Comptes utilisateurs', singular: 'Compte', plural: 'Comptes' },
    { name: 'Subscription', icon: 'credit_card', note: 'Abonnements Navigo', singular: 'Abonnement', plural: 'Abonnements' },
    { name: 'Payment', icon: 'payments', note: 'Historique des paiements', singular: 'Paiement', plural: 'Paiements' },
    { name: 'Department', icon: 'location_city', note: 'Départements Île-de-France', singular: 'Département', plural: 'Départements' },
    { name: 'StatusVerification', icon: 'verified_user', note: 'Vérifications de statut', singular: 'Vérification', plural: 'Vérifications' },
  ];

  for (const col of collectionsMeta) {
    await api(`/collections/${col.name}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        meta: {
          icon: col.icon,
          note: col.note,
          translation: [{ language: 'fr-FR', translation: col.plural, singular: col.singular, plural: col.plural }],
        },
      }),
    });
  }
  await api('/collections/_prisma_migrations', {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ meta: { hidden: true } }),
  });
  console.log('  ✓ Project and collections configured');

  console.log('\n═══════════════════════════════════════════');
  console.log('Directus RBAC provisioning complete!');
  console.log('═══════════════════════════════════════════');
  console.log('\nComptes:');
  console.log(`  Admin:      ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  console.log('  Opérateur:  operateur@idfm.fr / Operateur123!');
  console.log('  Lecteur:    lecteur@idfm.fr / Lecteur123!');
  console.log(`\nPanel: ${DIRECTUS_URL}`);
}

main().catch((err) => {
  console.error('Failed:', err.message);
  process.exit(1);
});