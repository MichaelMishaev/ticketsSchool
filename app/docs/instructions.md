  ===== LOCALHOST CREDENTIALS (NOT FOR PRODUCTION) =====
  URL: http://localhost:9000/admin/login
  - Email: admin@beeri.com
  - Password: beeri123

  Or for super admin access:
  - Email: superadmin@ticketsschool.com
  - Password: admin123
  --------

  ===== PRODUCTION SETUP =====
  These credentials are for LOCALHOST ONLY. Production database needs to be seeded separately.
  
  To create an admin user in PRODUCTION:
  1. Set DATABASE_URL environment variable to production database
  2. Run: npm run school -- create-admin <email> "<name>" <password> [schoolSlug]
  
  Example for super admin (no school):
    npm run school -- create-admin admin@kartis.info "Admin" your-secure-password
  
  Example for school admin:
    npm run school -- create-admin admin@kartis.info "Admin" your-secure-password kartis
  
  To seed production with default users (Beeri school):
    npm run school:seed
  
  ⚠️ IMPORTANT: Change default passwords in production!
  --------


  npm run school -- create "Herzl High School" herzl --color "#3b82f6"
  npm run school -- create-admin admin@herzl.com "Herzl Admin" pass123 herzl

    # List schools with beautiful colored output
  npm run school -- list

  # Create school in one command
  npm run school -- create "School Name" slug --color "#hex"

  # Create admin in one command
  npm run school -- create-admin email name pass school-slug

  # Complete database setup
  npm run school:seed