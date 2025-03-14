/**
 * Utilidad para listar los componentes
 */

const fs = require('fs');
const path = require('path');

// Ruta a la carpeta de componentes
const componentsPath = path.resolve(__dirname, '../components');

// Función para listar archivos en un directorio
function listFiles(dir) {
  try {
    const items = fs.readdirSync(dir);
    
    console.log(`\nContenido de la carpeta: ${dir}\n`);
    
    items.forEach(item => {
      const itemPath = path.join(dir, item);
      const stats = fs.statSync(itemPath);
      
      if (stats.isDirectory()) {
        console.log(`📁 ${item}/`);
      } else {
        console.log(`📄 ${item}`);
      }
    });
    
    return items;
  } catch (error) {
    console.error(`Error al leer el directorio: ${error.message}`);
    return [];
  }
}

// Ejecutar
try {
  const components = listFiles(componentsPath);
  
  if (components.length === 0) {
    console.log('No se encontraron archivos en la carpeta de componentes.');
  } else {
    console.log(`\nSe encontraron ${components.length} archivos/carpetas en total.`);
  }
} catch (error) {
  console.error('Error:', error);
}