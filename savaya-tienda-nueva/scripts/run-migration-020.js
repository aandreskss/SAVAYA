import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

async function main() {
  console.log('Running migration 020: seed WhatsApp button settings...')

  await sql`
    INSERT INTO application_settings (key, value, description)
    VALUES
      ('wa_button_enabled', 'true',  'Muestra u oculta el botón flotante de WhatsApp en la tienda'),
      ('wa_button_message', 'Hola, me gustaría consultar sobre un producto 👟', 'Mensaje pre-cargado cuando el cliente abre WhatsApp desde el botón flotante')
    ON CONFLICT (key) DO NOTHING
  `

  console.log('Migration 020 complete.')
  console.log('Run: node --env-file=.env.local scripts/run-migration-020.js')
}

main().catch((err) => {
  console.error('Migration 020 failed:', err)
  process.exit(1)
})
