const express = require('express');

const app = express();

app.use(express.json());

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization'
  );
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, PATCH, OPTIONS'
  );
  next();
});

app.post('/api/books', (re, res, next) => {
  console.log(req.body);
  res.status(201).json({ message: 'Objet créé !' });
});

app.get('/api/books', (req, res, next) => {
  const books = [
    {
      userId: "identifiant MongoDB unique de l'utilisateur qui a créé le livre",
      title: 'Titre du livre',
      author: 'Auteur du livre',
      imageUrl: 'https://www.babelio.com/users/blobid1703257456751.jpg',
      year: 1978,
      genre: 'Genre du livre',
      ratings: [
        {
          userId:
            "identifiant MongoDB unique de l'utilisateur qui a créé le livre",
          grade: 'note donnée à un livre',
        },
      ],
      averageRating: 'note moyenne du livre',
    },
  ];
  res.status(200).json(books);
});

module.exports = app;
