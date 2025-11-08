  URL: http://localhost:9000/admin/login
  - Email: admin@beeri.com
  - Password: beeri123

  Or for super admin access:
  - Email: superadmin@ticketsschool.com
  - Password: admin123
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