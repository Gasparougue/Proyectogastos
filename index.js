const http = require('http');
const fs = require('fs');
const camino = require('path');
const sql3 = require('sqlite3').verbose();
const ejs = require('ejs');

const port = process.env.PORT || 3000;



const basedatosN = camino.join(__dirname,'db','usuario.db');
const db = new sql3.Database(basedatosN,err=>{
  if(err) return console.error(err.message);
  console.log('Conexion Exitosa con la base de datos');
});
const sql =`
  CREATE TABLE IF NOT EXISTS usuario (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    precio number NOT NULL,
    fecha TEXT NOT NULL
  )
` 

db.run(sql,err=>{
if(err) return console.error(err.message);
console.log('Tabla Usuario Creada Correctamente');
});

function renderEJS(filePath, data) {
  const template = fs.readFileSync(filePath, 'utf8');
  return ejs.render(template, data);
}

function getContentType(extname) {
  switch (extname) {
    case '.html':
      return 'text/html';
    case '.css':
      return 'text/css';
    case '.js':
      return 'text/javascript';
    case '.json':
      return 'application/json';
    case '.png':
      return 'image/png';
    case '.jpg':
      return 'image/jpeg';
    default:
      return 'text/plain';
  }
}

function servirArchivoEstatico(req, res) {
  const filePath = camino.join(__dirname, req.url);
  const extname = camino.extname(filePath);
  const contentType = getContentType(extname);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Recurso no encontrado');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    }
  });
}

const server = http.createServer((req, res) => {
  const { method, url } = req;

  if (method === 'GET' && url === '/') {
     const html = renderEJS(camino.join(__dirname, 'views/index.ejs'));
     res.writeHead(200, { 'Content-Type': 'text/html' });
     res.end(html);  
  }
  else if (method === 'GET' && url === '/usuario') {
  db.all('SELECT * FROM usuario', (err, rows) => {
    if (err) {
      console.error(err);
      res.writeHead(500, {'Content-Type': 'text/html'});
      res.end('Error al obtener los clientes');
    } else {
      const data = { usuario: rows };
      const html = renderEJS(camino.join(__dirname, 'views/usuario.ejs'), data);
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
    }
  });
}

else if (method === 'POST' && url === '/usuario') {
  let body = '';
  req.on('data', (chunk) => {
    body += chunk.toString();
  });

  req.on('end', () => {
    try {
      const { nombre, precio, fecha } = JSON.parse(body);
      const sql = `INSERT INTO cliente(nombre, precio, fecha) VALUES(?, ?, ?)`;
      db.run(sql, [nombre, precio, fecha], (err) => {
        if (err) {
          console.error(err.message);
          res.writeHead(500, { 'Content-Type': 'text/html' });
          res.end('Error al insertar el cliente');
        } else {
          res.writeHead(302, { 'Location': '/contactos' });
          res.end();
        }
      });
    } catch (error) {
      console.error(error.message);
      res.writeHead(400, { 'Content-Type': 'text/html' });
      res.end('Formato de datos JSON inválido');
    }
  });
}

  else if (method === 'GET' && url ==='/contactos'){
   
    const html = renderEJS(camino.join(__dirname, 'views/contactos.ejs'));
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
   
  }
  else if (method === 'POST' && url === '/contactos'){
    let body = '';
  req.on('data', (chunk) => {
    body += chunk.toString();
  });

  req.on('end', () => {
    try {
      const { nombre, precio, fecha } = JSON.parse(body);
      const sql = `INSERT INTO usuario(nombre, precio, fecha) VALUES(?, ?, ?)`;
      db.run(sql, [nombre, precio, fecha], (err) => {
        if (err) {
          console.error(err.message);
          res.writeHead(500, { 'Content-Type': 'text/html' });
          res.end('Error al insertar el cliente');
        } else {
          res.writeHead(302, { 'Location': '/' });
          res.end();
        }
      });
    } catch (error) {
      console.error(error.message);
      res.writeHead(400, { 'Content-Type': 'text/html' });
      res.end('Formato de datos JSON inválido');
    }
  });
  } 
  else if (method === 'GET' && url.startsWith('/actualizar/')) {
    const id = parseInt(url.split('/')[2]);

    db.get('SELECT * FROM usuario WHERE ID = ?', id, (err, row) => {
      if (err) {
        console.error(err);
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.end('Error al obtener el cliente');
      } else if (!row){
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('Usuario no encontrado');
      } else {
        const data = { usuario: row };
        const html = renderEJS(camino.join(__dirname, 'views/actualizar.ejs'), data);
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
      }
    });
  } else if (method === 'POST' && url.startsWith('/actualizar/')) {
    const id = parseInt(url.split('/')[2]);

    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', () => {
      const { nombre, precio, fecha } = JSON.parse(body);
      db.run('UPDATE usuario SET nombre = ?, precio = ?, fecha = ? WHERE ID = ?', [nombre, precio, fecha, id], (err) => {
        if (err) {
          console.error(err.message);
          res.writeHead(500, { 'Content-Type': 'text/html' });
          res.end('Error al actualizar el cliente');
        } else {
          res.writeHead(302, { 'Location': '/' });
          res.end();
        }
      });
    });
  }
  else if (method === 'GET' && url.startsWith('/borrar/')) {
    const id = parseInt(url.split('/')[2]);

    db.get('SELECT * FROM usuario WHERE ID = ?', id, (err, row) => {
      if (err) {
        console.error(err);
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.end('Error al obtener el Usuario');
      } else if (!row) {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('Usuario no encontrado');
      } else {
        const data = { usuario: row };
        const html = renderEJS(camino.join(__dirname, 'views/borrar.ejs'), data);
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
      }
    });
  } else if (method === 'POST' && url.startsWith('/borrar/')) {
    const id = parseInt(url.split('/')[2]);

    db.run('DELETE FROM usuario WHERE ID = ?', id, (err) => {
      if (err) {
        console.error(err);
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.end('Error al eliminar el Usuario');
      } else {
        res.writeHead(302, { 'Location': '/' });
        res.end();
      }
    });
  } else if (method === 'GET' && url.startsWith('/static/')) {
    servirArchivoEstatico(req, res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/html' });
    res.end('404 - Ruta no encontrada');
  }
});

server.listen(port, () => {
  console.log(`Servidor escuchando en el puerto ${port}`);
});