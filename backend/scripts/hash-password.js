const bcrypt = require('bcryptjs');

// Generar hash para la contraseña de Fernando
const password = '222412412';
const saltRounds = 10;

bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error('Error generando hash:', err);
    return;
  }
  
  console.log('=================================');
  console.log('HASH GENERADO PARA FERNANDO');
  console.log('=================================');
  console.log('Email:', 'fernandoapple2002@gmail.com');
  console.log('Password:', password);
  console.log('Hash:', hash);
  console.log('=================================');
  console.log('');
  console.log('SQL para actualizar:');
  console.log(`UPDATE users SET password = '${hash}' WHERE username = 'fernandoapple2002@gmail.com';`);
  console.log('');
}); 