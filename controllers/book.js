const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const Book = require('../models/Book');

exports.createBook = async (req, res, next) => {
  try {
    // Vérifie si un fichier a bien été envoyé
    if (!req.file) {
      return res
        .status(400)
        .json({ message: "Aucun fichier n'a été envoyé !" });
    }

    const bookObject = JSON.parse(req.body.book);
    delete bookObject._id;
    delete bookObject._userId;

    // Chemin du fichier uploadé
    const inputPath = req.file.path;

    // Nouveau nom optimisé
    const outputFilename = `${Date.now()}-${req.file.originalname.split(' ').join('_')}.webp`;
    const outputPath = path.join('images', outputFilename);

    // Optimiser l'image avec Sharp
    await sharp(inputPath)
      .resize({ width: 600 })
      .webp({ quality: 60 })
      .toFile(outputPath);

    // Supprimer l'image originale
    fs.unlinkSync(inputPath);

    // Créer et enregistrer le livre
    const book = new Book({
      ...bookObject,
      userId: req.auth.userId,
      imageUrl: `${req.protocol}://${req.get('host')}/images/${outputFilename}`,
    });

    await book.save();

    res.status(201).json(book);
  } catch (error) {
    console.error('Erreur lors de la création du livre :', error);
    res.status(400).json({ error });
  }
};

exports.createRating = (req, res, next) => {
  const grade = Number(req.body.rating);
  const userId = req.auth.userId;

  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (!book) {
        return res.status(404).json({ message: 'Livre non trouvé' });
      }

      // On verifie que l'utilisateur n'as pas déjà noté le livre
      const existingRating = book.ratings.find(
        (r) => r.userId.toString() === userId
      );
      if (existingRating) {
        return res
          .status(400)
          .json({ message: 'Vous avez déjà noté ce livre' });
      }

      // Ajout du nouveau rating
      book.ratings.push({ userId, grade: grade });

      // On calcul de nouveau la note moyenne
      const total = book.ratings.reduce((sum, r) => sum + r.grade, 0);
      book.averageRating = Math.round((total / book.ratings.length) * 10) / 10;

      return book.save();
    })
    .then((savedBook) => {
      if (!savedBook) return; // sécurité si aucune sauvegarde

      // On renvoie l'objet complet avec id défini
      res.status(201).json({
        message: 'Note ajoutée !',
        ...savedBook.toObject(), // convertit le document Mongoose en objet JS pur
        id: savedBook._id, // ajoute un champ "id" explicitement
      });
    })
    .catch((error) => res.status(500).json({ error }));
};

exports.modifyBook = async (req, res, next) => {
  try {
    const book = await Book.findOne({ _id: req.params.id });

    if (!book) {
      return res.status(404).json({ message: 'Livre non trouvé' });
    }

    if (book.userId !== req.auth.userId) {
      return res.status(403).json({ message: 'Non-autorisé' });
    }

    let bookObject;

    // Si une nouvelle image est uploadée, on l’optimise avec Sharp
    if (req.file) {
      const inputPath = req.file.path;
      const outputFilename = `${Date.now()}-${req.file.originalname.split(' ').join('_')}.webp`;
      const outputPath = path.join('images', outputFilename);

      // Optimisation de l'image
      await sharp(inputPath)
        .resize({ width: 600 })
        .webp({ quality: 20 })
        .toFile(outputPath);

      // Suppression de l'image originale uploadée
      fs.unlinkSync(inputPath);

      // Suppression de l'ancienne image si elle existe
      const oldImage = book.imageUrl.split('/images/')[1];
      if (oldImage && fs.existsSync(path.join('images', oldImage))) {
        fs.unlinkSync(path.join('images', oldImage));
      }

      // Nouveau contenu du livre avec image mise à jour
      bookObject = {
        ...JSON.parse(req.body.book),
        imageUrl: `${req.protocol}://${req.get('host')}/images/${outputFilename}`,
      };
    } else {
      // Pas de nouvelle image → on garde les anciennes données
      bookObject = { ...req.body };
    }

    delete bookObject._userId;

    // Mise à jour dans la base
    await Book.updateOne(
      { _id: req.params.id },
      { ...bookObject, _id: req.params.id }
    );

    res.status(200).json({ message: 'Livre modifié et image optimisée !' });
  } catch (error) {
    console.error('Erreur lors de la modification du livre :', error);
    res.status(400).json({ error });
  }
};

exports.deleteBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (book.userId != req.auth.userId) {
        res.status(403).json({ message: 'Non-autorisé' });
      } else {
        const filename = book.imageUrl.split('/images/')[1];
        fs.unlink(`images/${filename}`, () => {
          Book.deleteOne({ _id: req.params.id })
            .then(() => {
              res.status(200).json({ message: 'Livre supprimé !' });
            })
            .catch((error) => res.status(404).json({ error }));
        });
      }
    })
    .catch((error) => res.status(500).json({ error }));
};

exports.getOneBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then((book) => res.status(200).json(book))
    .catch((error) => res.status(404).json({ error }));
};

exports.getAllBooks = (req, res, next) => {
  Book.find()
    .then((books) => res.status(200).json(books))
    .catch((error) => res.status(400).json({ error }));
};

exports.getBestRating = (req, res, next) => {
  Book.find()
    .sort({ averageRating: -1 })
    .limit(3)
    .then((books) => res.status(200).json(books))
    .catch((error) => res.status(400).json({ error }));
};
