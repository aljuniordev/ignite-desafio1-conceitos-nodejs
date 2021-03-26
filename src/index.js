const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const {username} = request.headers;

  //null ou undefined 
  if (username == null) {
    return response.status(400).json({error: "Necessário informar um username válido no headers."});
  }

  const userExist = users.some(
    (user) => user.username === username
  );

  if (userExist === false) {
    return response.status(400).json({error: "Username não encontrado. É necessário primeiro cadastrar um username válido para continuar"});
  }

  request.username = username;

  next()
  
}

function checkExistsUser(username) {
  return users.some((user) => user.username === username);
}

function getUserByUsername(username) {
  
  return users.find((user) => user.username === username);
}

function getTodoByUsername(username, id) {

  const user = getUserByUsername(username);

  return user.todos.find( (todo) => todo.id === id);
}

function getTodoByUser(user, id) {

  return user.todos.find( (todo) => todo.id === id);
}

app.post('/users', (request, response) => {
  const {name, username} = request.body;

  if (checkExistsUser(username)) {
    return response.status(400).json({"error": "username já existe na base de dados"});
  }

  const novoUser = {
    id: uuidv4(),
    name: name,
    username: username,
    created_at: new Date(new Date().setHours(0,0,0,0)),
    todos: []
  }

  users.push(novoUser);

  return response.status(201).send(novoUser);
});

app.get('/todos', checksExistsUserAccount, (request, response) => {
  const {username} = request;

  const useratual = getUserByUsername(username);

  return response.status(200).send(useratual.todos);
});

app.post('/todos', checksExistsUserAccount, (request, response) => {
  const {username} = request;

  const {title, deadline} = request.body;

  const todosOperation = {
    id: uuidv4(),
    title: title,
    deadline: new Date(deadline + " 00:00"),
    done: false,
    created_at: new Date(new Date().setHours(0,0,0,0))
  };

  const user = getUserByUsername(username);
  user.todos.push(todosOperation);

  return response.status(201).send(todosOperation);
});

app.put('/todos/:id', checksExistsUserAccount, (request, response) => {
  const {username} = request;
  
  const {id} = request.params;

  if (id == null) {
    return response.status(404).send({error: "necessário informar o ID do to-do"});
  }

  const userTodo = getTodoByUsername(username, id);
  
  if (userTodo == null) {
    return response.status(404).send({error: "nenhum to-do encontrado com ID informado"});
  }

  const {title, deadline} = request.body;

  if (title != null) {
    userTodo.title = title;
  }
  if (title != null) {
    userTodo.deadline = new Date(deadline + " 00:00");
  }

  return response.status(200).send(userTodo);
});

app.patch('/todos/:id/done', checksExistsUserAccount, (request, response) => {
  const {username} = request;
  
  const {id} = request.params;
  
  if (id == null) {
    return response.status(404).send({error: "necessário informar o ID do to-do"});
  }
  
  const userTodo = getTodoByUsername(username, id);

  if (userTodo == null) {
    return response.status(404).send({error: "nenhum to-do encontrado com ID informado"});
  }

  if (userTodo.done !== true) {
    userTodo.done = true;
  } else {
    userTodo.done = false;
  }

  return response.status(200).send(userTodo);
});

app.delete('/todos/:id', checksExistsUserAccount, (request, response) => {
  const {username} = request;
  const {id} = request.params;

  if (id == null) {
    return response.status(204).send({error: "necessário preencher o id do to-do"});
  }
  
  const user = getUserByUsername(username);
  const userToBeDeleted = getTodoByUser(user, id);

  if (userToBeDeleted == null) {
    return response.status(404).send({error: "nenhum to-do encontrado com id informado"});
  }

  const lineToBeDeleted = user.todos.indexOf(userToBeDeleted);
  user.todos.splice(lineToBeDeleted, 1);

  return response.status(200).send();
});

module.exports = app;
