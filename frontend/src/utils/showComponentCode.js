/**
 * Utilidad para mostrar el código de los componentes
 */

const fs = require('fs');
const path = require('path');

// Ruta a la carpeta de componentes
const componentsPath = path.resolve(__dirname, '../components');

// Función para mostrar el contenido de un archivo
function showFileContent(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    console.log(`\n----- Contenido de ${path.basename(filePath)} -----\n`);
    console.log(content);
    console.log(`\n----- Fin de ${path.basename(filePath)} -----\n`);
  } catch (error) {
    console.error(`Error al leer el archivo ${filePath}: ${error.message}`);
  }
}

// Función para listar y mostrar archivos en un directorio
function listAndShowFiles(dir) {
  try {
    const items = fs.readdirSync(dir);
    
    console.log(`\nArchivos en la carpeta: ${dir}\n`);
    
    items.forEach(item => {
      const itemPath = path.join(dir, item);
      const stats = fs.statSync(itemPath);
      
      if (stats.isDirectory()) {
        console.log(`📁 ${item}/`);
      } else {
        console.log(`📄 ${item}`);
        // Mostrar contenido solo para archivos JS
        if (item.endsWith('.js')) {
          showFileContent(itemPath);
        }
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
  const components = listAndShowFiles(componentsPath);
  
  if (components.length === 0) {
    console.log('No se encontraron archivos en la carpeta de componentes.');
  } else {
    console.log(`\nSe encontraron ${components.length} archivos/carpetas en total.`);
  }
} catch (error) {
  console.error('Error:', error);
}