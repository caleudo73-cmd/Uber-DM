// Crea los usuarios demo en Firebase Auth y sus perfiles en Firestore.
// Uso (desde firebase/functions):
//   $env:GOOGLE_APPLICATION_CREDENTIALS="C:\ruta\serviceAccount.json"
//   $env:FIREBASE_PROJECT_ID="tu-proyecto"
//   node scripts/seed.js

const admin = require('firebase-admin');
const { getAuth } = require('firebase-admin/auth');
const { FieldValue, getFirestore } = require('firebase-admin/firestore');

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID;

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS || !PROJECT_ID) {
  console.error(
    'Define GOOGLE_APPLICATION_CREDENTIALS (ruta al service account) y FIREBASE_PROJECT_ID.'
  );
  process.exit(1);
}

admin.initializeApp({ projectId: PROJECT_ID });

const DEMO_USERS = [
  {
    name: 'Pasajero Demo',
    email: 'pasajero@demo.com',
    role: 'passenger',
    approvalStatus: 'approved',
  },
  {
    name: 'Conductor Demo',
    email: 'conductor@demo.com',
    role: 'driver',
    approvalStatus: 'approved',
  },
];

const PASSWORD = '123456';

const main = async () => {
  const auth = getAuth();
  const db = getFirestore();

  for (const demo of DEMO_USERS) {
    try {
      await auth.createUser({
        email: demo.email,
        password: PASSWORD,
        displayName: demo.name,
      });
      console.log(`Usuario creado: ${demo.email}`);
    } catch (error) {
      if (error.code !== 'auth/email-already-exists') throw error;
      console.log(`Ya existía: ${demo.email}`);
    }

    const user = await auth.getUserByEmail(demo.email);
    await db.collection('users').doc(user.uid).set(
      {
        name: demo.name,
        email: demo.email,
        role: demo.role,
        approvalStatus: demo.approvalStatus,
        createdAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    console.log(`Perfil listo: users/${user.uid}`);
  }

  console.log(`\nClave de los usuarios demo: ${PASSWORD}`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
