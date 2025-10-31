/**
 * Servidor simple para biomedic-GoApp Frontend
 * Sirve la interfaz de gestión de equipos
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8080;

// Función para obtener el Content-Type
function getContentType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'application/javascript',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon'
    };
    return mimeTypes[ext] || 'application/octet-stream';
}

// Crear el servidor
const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    let pathname = parsedUrl.pathname;

    console.log(`${new Date().toISOString()} - ${req.method} ${pathname}`);

    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Manejar preflight requests
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // Endpoint para listar imágenes disponibles
    if (pathname === '/api/images') {
        const imagesDir = path.join(__dirname, 'images', 'equipos');
        fs.readdir(imagesDir, (err, files) => {
            if (err) {
                console.error('Error al leer directorio de imágenes:', err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ ok: false, message: 'Error al leer imágenes' }));
                return;
            }
            // Filtrar solo imágenes
            const imageFiles = files.filter(file => 
                /\.(jpg|jpeg|png|gif|svg|webp)$/i.test(file)
            );
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: true, images: imageFiles }));
        });
        return;
    }

    // Servir imágenes estáticas desde /images/equipos/
    if (pathname.startsWith('/images/equipos/')) {
        const imagePath = path.join(__dirname, pathname);
        fs.access(imagePath, fs.constants.F_OK, (err) => {
            if (err) {
                console.error(`Imagen no encontrada: ${imagePath}`);
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('Imagen no encontrada');
                return;
            }
            fs.readFile(imagePath, (err, data) => {
                if (err) {
                    console.error(`Error al leer imagen ${imagePath}:`, err);
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end('Error al leer imagen');
                    return;
                }
                const contentType = getContentType(imagePath);
                res.writeHead(200, { 'Content-Type': contentType });
                res.end(data);
            });
        });
        return;
    }

    // Servir index.html por defecto
    if (pathname === '/') {
        pathname = '/index.html';
    }

    // Construir ruta del archivo
    const filePath = path.join(__dirname, pathname);
    
    // Verificar si el archivo existe
    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            console.error(`Archivo no encontrado: ${filePath}`);
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Archivo no encontrado');
            return;
        }

        // Leer y servir el archivo
        fs.readFile(filePath, (err, data) => {
            if (err) {
                console.error(`Error al leer archivo ${filePath}:`, err);
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Error interno del servidor');
                return;
            }

            const contentType = getContentType(filePath);
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(data);
        });
    });
});

// Iniciar el servidor
server.listen(PORT, '0.0.0.0', () => {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║         🏥 BIOMEDIC-GOAPP FRONTEND SERVER                ║
╠═══════════════════════════════════════════════════════════╣
║                                                           ║
║  ✅ Servidor iniciado correctamente                       ║
║  🌐 URL: http://localhost:${PORT}                           ║
║  📁 Sirviendo desde: ${__dirname}                        ║
║  🔗 Backend API: http://192.168.0.151:3001               ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
    `);
});

// Manejo de errores del servidor
server.on('error', (error) => {
    console.error('Error del servidor:', error);
    if (error.code === 'EADDRINUSE') {
        console.error(`Puerto ${PORT} ya está en uso`);
        process.exit(1);
    }
});

// Manejo graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🔄 Cerrando servidor...');
    server.close(() => {
        console.log('✅ Servidor cerrado correctamente');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('\n🔄 Cerrando servidor...');
    server.close(() => {
        console.log('✅ Servidor cerrado correctamente');
        process.exit(0);
    });
});
