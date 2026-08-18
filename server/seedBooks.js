const dotenv = require("dotenv");
const connectDB = require("./config/db");
const Book = require("./models/Book");

dotenv.config();

const books = [
  // ─────────────────────────────────────────
  // PROGRAMMING
  // ─────────────────────────────────────────

  {
    title: "Clean Code",
    author: "Robert C. Martin",
    isbn: "9780132350884",
    category: "Programming",
    description:
      "A practical guide to writing clean, readable, and maintainable software.",
    publisher: "Prentice Hall",
    publishedYear: 2008,
    coverImage: "https://covers.openlibrary.org/isbn/9780132350884-L.jpg",
    totalCopies: 5,
    availableCopies: 5,
    reservedCopies: 0,
  },

  {
    title: "The Pragmatic Programmer",
    author: "David Thomas, Andrew Hunt",
    isbn: "9780135957059",
    category: "Programming",
    description:
      "A practical guide to becoming a better and more effective software developer.",
    publisher: "Addison-Wesley",
    publishedYear: 2019,
    coverImage: "https://covers.openlibrary.org/isbn/9780135957059-L.jpg",
    totalCopies: 4,
    availableCopies: 4,
    reservedCopies: 0,
  },

  {
    title: "Java: The Complete Reference",
    author: "Herbert Schildt",
    isbn: "9781260440232",
    category: "Java",
    description:
      "A complete reference covering Java programming fundamentals and advanced concepts.",
    publisher: "McGraw-Hill",
    publishedYear: 2021,
    coverImage: "https://covers.openlibrary.org/isbn/9781260440232-L.jpg",
    totalCopies: 5,
    availableCopies: 5,
    reservedCopies: 0,
  },

  {
    title: "Effective Java",
    author: "Joshua Bloch",
    isbn: "9780134685991",
    category: "Java",
    description:
      "Practical guidance for writing robust, efficient, and maintainable Java programs.",
    publisher: "Addison-Wesley",
    publishedYear: 2018,
    coverImage: "https://covers.openlibrary.org/isbn/9780134685991-L.jpg",
    totalCopies: 4,
    availableCopies: 4,
    reservedCopies: 0,
  },

  {
    title: "Head First Java",
    author: "Kathy Sierra, Bert Bates",
    isbn: "9780596009205",
    category: "Java",
    description:
      "An approachable and visual introduction to Java programming and object-oriented concepts.",
    publisher: "O'Reilly Media",
    publishedYear: 2005,
    coverImage: "https://covers.openlibrary.org/isbn/9780596009205-L.jpg",
    totalCopies: 3,
    availableCopies: 3,
    reservedCopies: 0,
  },

  {
    title: "Eloquent JavaScript",
    author: "Marijn Haverbeke",
    isbn: "9781593279509",
    category: "Web Development",
    description:
      "A modern introduction to JavaScript programming, programming concepts, and web development.",
    publisher: "No Starch Press",
    publishedYear: 2018,
    coverImage: "https://covers.openlibrary.org/isbn/9781593279509-L.jpg",
    totalCopies: 4,
    availableCopies: 4,
    reservedCopies: 0,
  },

  // ─────────────────────────────────────────
  // COMPUTER SCIENCE
  // ─────────────────────────────────────────

  {
    title: "Introduction to Algorithms",
    author:
      "Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, Clifford Stein",
    isbn: "9780262046305",
    category: "Computer Science",
    description:
      "A comprehensive introduction to algorithms, data structures, analysis, and algorithm design.",
    publisher: "MIT Press",
    publishedYear: 2022,
    coverImage: "https://covers.openlibrary.org/isbn/9780262046305-L.jpg",
    totalCopies: 3,
    availableCopies: 3,
    reservedCopies: 0,
  },

  {
    title: "Computer Networking",
    author: "Andrew S. Tanenbaum, David J. Wetherall",
    isbn: "9780132126953",
    category: "Computer Networks",
    description:
      "A comprehensive introduction to computer networking concepts, protocols, and architectures.",
    publisher: "Pearson",
    publishedYear: 2010,
    coverImage: "https://covers.openlibrary.org/isbn/9780132126953-L.jpg",
    totalCopies: 4,
    availableCopies: 4,
    reservedCopies: 0,
  },

  {
    title: "Operating System Concepts",
    author: "Abraham Silberschatz, Peter B. Galvin, Greg Gagne",
    isbn: "9781119800361",
    category: "Operating Systems",
    description:
      "A comprehensive introduction to operating system concepts, architecture, and management.",
    publisher: "Wiley",
    publishedYear: 2021,
    coverImage:
      "https://dynamic.indigoimages.ca/v1/books/books/1119800366/1.jpg",
    totalCopies: 4,
    availableCopies: 4,
    reservedCopies: 0,
  },

  {
    title: "Computer Organization and Design",
    author: "David A. Patterson, John L. Hennessy",
    isbn: "9780128203316",
    category: "Computer Architecture",
    description:
      "An introduction to computer organization, processor design, memory systems, and architecture.",
    publisher: "Morgan Kaufmann",
    publishedYear: 2020,
    coverImage: "https://covers.openlibrary.org/isbn/9780128203316-L.jpg",
    totalCopies: 3,
    availableCopies: 3,
    reservedCopies: 0,
  },

  // ─────────────────────────────────────────
  // DATABASE
  // ─────────────────────────────────────────

  {
    title: "Database System Concepts",
    author: "Abraham Silberschatz, Henry F. Korth, S. Sudarshan",
    isbn: "9780078022159",
    category: "Database",
    description:
      "A comprehensive introduction to database systems, database design, SQL, and transaction management.",
    publisher: "McGraw-Hill",
    publishedYear: 2019,
    coverImage: "https://covers.openlibrary.org/isbn/9780078022159-L.jpg",
    totalCopies: 4,
    availableCopies: 4,
    reservedCopies: 0,
  },

  {
    title: "Learning SQL",
    author: "Alan Beaulieu",
    isbn: "9780596520830",
    category: "Database",
    description:
      "A practical introduction to SQL queries, database operations, and relational database concepts.",
    publisher: "O'Reilly Media",
    publishedYear: 2009,
    coverImage: "https://covers.openlibrary.org/isbn/9780596520830-L.jpg",
    totalCopies: 4,
    availableCopies: 4,
    reservedCopies: 0,
  },

  {
    title: "SQL Cookbook",
    author: "Anthony Molinaro",
    isbn: "9780596009762",
    category: "Database",
    description:
      "A collection of practical SQL solutions for querying, manipulating, and analyzing relational data.",
    publisher: "O'Reilly Media",
    publishedYear: 2005,
    coverImage: "https://covers.openlibrary.org/isbn/9780596009762-L.jpg",
    totalCopies: 3,
    availableCopies: 3,
    reservedCopies: 0,
  },

  // ─────────────────────────────────────────
  // ARTIFICIAL INTELLIGENCE
  // ─────────────────────────────────────────

  {
    title: "Artificial Intelligence: A Modern Approach",
    author: "Stuart Russell, Peter Norvig",
    isbn: "9780134610993",
    category: "Artificial Intelligence",
    description:
      "A comprehensive introduction to artificial intelligence, intelligent agents, machine learning, and reasoning.",
    publisher: "Pearson",
    publishedYear: 2021,
    coverImage: "https://covers.openlibrary.org/isbn/9780134610993-L.jpg",
    totalCopies: 3,
    availableCopies: 3,
    reservedCopies: 0,
  },

  {
    title: "Hands-On Machine Learning with Scikit-Learn, Keras, and TensorFlow",
    author: "Aurélien Géron",
    isbn: "9781098125974",
    category: "Machine Learning",
    description:
      "A practical guide to machine learning using Python, Scikit-Learn, Keras, and TensorFlow.",
    publisher: "O'Reilly Media",
    publishedYear: 2022,
    coverImage: "https://covers.openlibrary.org/isbn/9781098125974-L.jpg",
    totalCopies: 4,
    availableCopies: 4,
    reservedCopies: 0,
  },

  {
    title: "Deep Learning",
    author: "Ian Goodfellow, Yoshua Bengio, Aaron Courville",
    isbn: "9780262035613",
    category: "Artificial Intelligence",
    description:
      "A comprehensive introduction to deep learning, neural networks, optimization, and machine learning.",
    publisher: "MIT Press",
    publishedYear: 2016,
    coverImage: "https://covers.openlibrary.org/isbn/9780262035613-L.jpg",
    totalCopies: 3,
    availableCopies: 3,
    reservedCopies: 0,
  },

  // ─────────────────────────────────────────
  // SELF-HELP / PRODUCTIVITY
  // ─────────────────────────────────────────

  {
    title: "Atomic Habits",
    author: "James Clear",
    isbn: "9780735211292",
    category: "Self-help",
    description:
      "A practical guide to building better habits through small, consistent changes and improving daily systems.",
    publisher: "Avery",
    publishedYear: 2018,
    coverImage: "https://covers.openlibrary.org/isbn/9780735211292-L.jpg",
    totalCopies: 5,
    availableCopies: 5,
    reservedCopies: 0,
  },

  {
    title: "Ikigai",
    author: "Héctor García, Francesc Miralles",
    isbn: "9781786330895",
    category: "Self-help",
    description:
      "An exploration of purpose, balance, longevity, and finding meaning in everyday life.",
    publisher: "Hutchinson",
    publishedYear: 2017,
    coverImage: "https://covers.openlibrary.org/isbn/9781786330895-L.jpg",
    totalCopies: 4,
    availableCopies: 4,
    reservedCopies: 0,
  },

  {
    title: "Deep Work",
    author: "Cal Newport",
    isbn: "9781455586691",
    category: "Productivity",
    description:
      "A guide to focused work, concentration, and producing valuable results in a distracted world.",
    publisher: "Grand Central Publishing",
    publishedYear: 2016,
    coverImage: "https://covers.openlibrary.org/isbn/9781455586691-L.jpg",
    totalCopies: 4,
    availableCopies: 4,
    reservedCopies: 0,
  },

  // ─────────────────────────────────────────
  // FICTION
  // ─────────────────────────────────────────

  {
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    isbn: "9781471173936",
    category: "Fiction",
    description:
      "A classic novel exploring ambition, wealth, love, identity, and the American Dream.",
    publisher: "Scribner",
    publishedYear: 2018,
    coverImage: "https://covers.openlibrary.org/isbn/9781471173936-L.jpg",
    totalCopies: 3,
    availableCopies: 3,
    reservedCopies: 0,
  },

  {
    title: "1984",
    author: "George Orwell",
    isbn: "9780451524935",
    category: "Fiction",
    description:
      "A dystopian novel exploring surveillance, political control, freedom, truth, and individual identity.",
    publisher: "Signet Classics",
    publishedYear: 1950,
    coverImage: "https://covers.openlibrary.org/isbn/9780451524935-L.jpg",
    totalCopies: 4,
    availableCopies: 4,
    reservedCopies: 0,
  },
];

const seedBooks = async () => {
  try {
    await connectDB();

    await Book.deleteMany({});

    await Book.insertMany(books);

    console.log(`${books.length} books seeded successfully.`);
    console.log(
      `Total copies: ${books.reduce((sum, book) => sum + book.totalCopies, 0)}`,
    );

    process.exit(0);
  } catch (error) {
    console.error(`Book seeding failed: ${error.message}`);
    process.exit(1);
  }
};

seedBooks();
