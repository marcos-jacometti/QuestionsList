const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const path = require('path'); 
const Pergunta = require("./model/Pergunta");
const Resposta = require("./model/Resposta")
const bodyParser = require("body-parser");

const connection = require('./database/database');
const checklogin = require('./middleware/checklogin');

// Models
const Usuario = require('./model/usuario');

// Controllers
const UsuarioController = require('./controllers/usuariosController');

const app = express();

// Environment Setup
// Static Files Activation
app.use(express.static('public'));
app.use(express.static(path.join(__dirname, "js")));

// View Engine
app.set('view engine', 'ejs');

// Sessions
app.use(session({
  secret: 'tasklist',
  cookie: {
    maxAge: 1200000,
  },
  resave: false,
  saveUnitialized: false
}));

// Form parser
app.use(express.urlencoded({extended: false}));
app.use(express.json());

// Database
connection
  .authenticate()
  .then(() => {
    console.log('Conexão feita com sucesso!');
  })
  .catch((error) => {
    console.log(error);
  });

// Access from other origin
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-Width, Content-type, Accept, Authorization'
  );
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PATCH, PUT, DELETE, OPTIONS'
  );
  next();
});

// Rotas

app.get('/login', (req, res) => {
  res.render('login', {msg:''});
})

app.post('/login', (req, res) => {
  const email = req.body.email;
  const senha = req.body.senha;

  Usuario.findOne({
    where: {
      email: email
    }
  }).then(usuario => {
    if(usuario != undefined)
    {
      const deuCerto = bcrypt.compareSync(senha, usuario.senha);

      if(deuCerto)
      {
        req.session.login = {
          nome: usuario.nome
        }

        res.redirect('/');
      }
      else
      {
        res.render('login', {msg: 'Usuário ou senha inválidos!'});
      }
    }
    else
    {
      res.render('login', {msg: 'Usuário ou senha inválidos!'});
    }
  })
});

app.get("/", checklogin, (req, res) => {
  Pergunta.findAll({ raw: true, order:[
      ['id', 'desc']
  ]}).then(perguntas => {
      res.render("index", {
          perguntas: perguntas
      });
  });
});

app.get("/perguntar", checklogin, (req, res) => {
  res.render("perguntar");
});

app.post("/salvarpergunta", checklogin, (req, res) => {
  var titulo = req.body.titulo;
  var descricao = req.body.descricao;
  Pergunta.create({
      titulo: titulo,
      descricao: descricao
  }).then(() => {
      res.redirect("/");
  }).catch((error) => {
      res.send("error: " + error);
  });
});

app.get("/pergunta/:id", checklogin, (req, res) => {
  let id = req.params.id;
  Pergunta.findOne({
      where: {id: id}
  }).then(pergunta => {
      if (pergunta != undefined){
          Resposta.findAll({
              where: {perguntaId: pergunta.id},
              order: [
                  ['id', 'DESC']
              ]}
              ).then(respostas => {
              res.render("pergunta", {
                  pergunta: pergunta,
                  respostas: respostas
              });
          });
      }else{
          res.redirect("/");
      }
  });
});

app.post("/responder", checklogin, (req, res) => {
  let corpo = req.body.corpo;
  let perguntaId = req.body.pergunta;
  Resposta.create({ 
      corpo: corpo,
      perguntaId: perguntaId
  }).then(() => {
      res.redirect("/pergunta/" + perguntaId);
  }).catch((error) => {
      console.log("error: " + error);
  });
});

// Rotas externas
app.use('/', UsuarioController);

module.exports = app;