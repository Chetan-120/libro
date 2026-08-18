import React, { useEffect, useMemo, useRef, useState } from "react";

import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";

import {
  Archive,
  ArrowRight,
  BookOpen,
  Camera,
  CheckCircle2,
  Edit3,
  ImagePlus,
  Library,
  Plus,
  ScanLine,
  Search,
  ShieldCheck,
  Trash2,
  TrendingUp,
  Upload,
  X,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export function LibrarianInventory() {
  const [books, setBooks] = useState([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const [showAddBook, setShowAddBook] = useState(false);

  const [showIsbnScanner, setShowIsbnScanner] = useState(false);
  const [scannerError, setScannerError] = useState("");

  const [showEditBook, setShowEditBook] = useState(false);
  const [editingBook, setEditingBook] = useState(null);

  const [savingBook, setSavingBook] = useState(false);

  const [formError, setFormError] = useState("");

  const [coverPreview, setCoverPreview] = useState("");
  const [coverSource, setCoverSource] = useState("upload");

  const fileInputRef = useRef(null);
  const isbnScannerRef = useRef(null);
  const isbnScanProcessingRef = useRef(false);

  const [bookForm, setBookForm] = useState({
    title: "",
    author: "",
    isbn: "",
    category: "",
    description: "",
    publisher: "",
    publishedYear: "",
    totalCopies: "",
    coverImage: null,
    coverImageUrl: "",
  });

  const getToken = () =>
    localStorage.getItem("libro_token") ||
    sessionStorage.getItem("libro_token");

  const fetchBooks = async () => {
    try {
      setLoading(true);
      setError("");

      const token = getToken();

      const response = await fetch(`${API_URL}/api/books`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load inventory.");
      }

      setBooks(data.books || []);
    } catch (err) {
      console.error("Inventory fetch error:", err);

      setError(err.message || "Unable to load inventory.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      const matchesQuery =
        !query.trim() ||
        `${book.title} ${book.author} ${book.category} ${book.isbn} ${book._id}`
          .toLowerCase()
          .includes(query.toLowerCase());

      const availableCopies = Number(book.availableCopies) || 0;
      const reservedCopies = Number(book.reservedCopies) || 0;
      const totalCopies = Number(book.totalCopies) || 0;

      const status =
        reservedCopies > 0 && availableCopies === 0
          ? "Reserved"
          : availableCopies === 0
            ? "Unavailable"
            : availableCopies <= Math.max(1, Math.ceil(totalCopies * 0.25))
              ? "Low stock"
              : "Available";

      const matchesFilter = filter === "All" || status === filter;

      return matchesQuery && matchesFilter;
    });
  }, [books, query, filter]);

  const totalTitles = books.length;

  const totalCopies = books.reduce(
    (sum, book) => sum + (Number(book.totalCopies) || 0),
    0,
  );

  const availableCopies = books.reduce(
    (sum, book) => sum + (Number(book.availableCopies) || 0),
    0,
  );
  const reservedCopies = books.reduce(
    (sum, book) => sum + (Number(book.reservedCopies) || 0),
    0,
  );

  const lowStock = books.filter((book) => {
    const total = Number(book.totalCopies) || 0;

    const available = Number(book.availableCopies) || 0;

    return available > 0 && available <= Math.max(1, Math.ceil(total * 0.25));
  }).length;

  const unavailable = books.filter(
    (book) => Number(book.availableCopies) === 0,
  ).length;

  const availabilityRate =
    totalCopies > 0 ? Math.round((availableCopies / totalCopies) * 100) : 0;

  const getStatus = (book) => {
    const total = Number(book.totalCopies) || 0;
    const available = Number(book.availableCopies) || 0;
    const reserved = Number(book.reservedCopies) || 0;

    if (reserved > 0 && available === 0) {
      return "Reserved";
    }

    if (available === 0) {
      return "Unavailable";
    }

    if (available <= Math.max(1, Math.ceil(total * 0.25))) {
      return "Low stock";
    }

    return "Available";
  };

  const openIsbnScanner = () => {
    setScannerError("");
    setFormError("");
    isbnScanProcessingRef.current = false;
    setShowIsbnScanner(true);
  };

  const closeIsbnScanner = async () => {
    try {
      const scanner = isbnScannerRef.current;

      if (scanner) {
        try {
          await scanner.stop();
        } catch (error) {
          // Scanner may already be stopped or not fully started.
          console.warn("Scanner stop skipped:", error.message);
        }

        try {
          await scanner.clear();
        } catch (error) {
          console.warn("Scanner clear skipped:", error.message);
        }

        isbnScannerRef.current = null;
      }
    } catch (error) {
      console.error("Scanner cleanup error:", error);
    } finally {
      isbnScanProcessingRef.current = false;
      setShowIsbnScanner(false);
    }
  };

  const handleIsbnDetected = async (decodedText) => {
    // Prevent the same barcode from being processed multiple times
    // while the camera is still scanning.
    if (isbnScanProcessingRef.current) {
      return;
    }

    const isbn = decodedText.replace(/[^0-9Xx]/g, "");

    // ISBN-10 or ISBN-13 only
    if (![10, 13].includes(isbn.length)) {
      setScannerError("The scanned barcode is not a valid ISBN barcode.");
      return;
    }

    isbnScanProcessingRef.current = true;

    try {
      setScannerError("");
      setFormError("");

      // Immediately place the scanned ISBN into the form.
      setBookForm((current) => ({
        ...current,
        isbn,
      }));

      // Stop the camera before performing the book lookup.
      await closeIsbnScanner();

      // Fetch real book information from Open Library.
      const response = await fetch(
        `https://openlibrary.org/search.json?q=${encodeURIComponent(
          `isbn:${isbn}`,
        )}&fields=title,author_name,publisher,publish_year,subject,isbn,cover_i&limit=1`,
      );

      if (!response.ok) {
        throw new Error("Unable to fetch book information.");
      }

      const data = await response.json();

      const book = data.docs?.[0];

      if (!book) {
        setFormError(
          "ISBN scanned successfully, but no book information was found. Please enter the book details manually.",
        );

        isbnScanProcessingRef.current = false;
        return;
      }

      const title = book.title || "";

      const author = book.author_name?.[0] || "";

      const publisher = book.publisher?.[0] || "";

      const publishedYear =
        book.publish_year?.find((year) => Number.isInteger(year)) || "";

      const category = book.subject?.[0] || "";

      const coverImageUrl = book.cover_i
        ? `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`
        : `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;

      setBookForm((current) => ({
        ...current,
        isbn,
        title: current.title || title,
        author: current.author || author,
        publisher: current.publisher || publisher,
        publishedYear: current.publishedYear || publishedYear,
        category: current.category || category,
        coverImageUrl: current.coverImageUrl || coverImageUrl,
        coverImage: null,
      }));

      setCoverSource("url");
      setCoverPreview(coverImageUrl);
      setFormError("");
    } catch (error) {
      console.error("ISBN book lookup error:", error);

      setFormError(
        "ISBN scanned successfully, but book information could not be loaded. Please enter the details manually.",
      );

      isbnScanProcessingRef.current = false;
    }
  };

  useEffect(() => {
    if (!showIsbnScanner) return;

    let scanner = null;
    let cancelled = false;

    const startScanner = async () => {
      try {
        setScannerError("");

        scanner = new Html5Qrcode("libro-isbn-reader");

        if (cancelled) {
          return;
        }

        isbnScannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: {
              width: 320,
              height: 160,
            },
            aspectRatio: 1.777778,
            formatsToSupport: [
              Html5QrcodeSupportedFormats.EAN_13,
              Html5QrcodeSupportedFormats.EAN_8,
              Html5QrcodeSupportedFormats.UPC_A,
            ],
          },
          async (decodedText) => {
            await handleIsbnDetected(decodedText);
          },
          () => {
            // Normal frame scanning failures are ignored.
          },
        );
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error("ISBN scanner start error:", error);

        setScannerError(
          "Unable to access the camera. Please allow camera permission and try again.",
        );

        isbnScannerRef.current = null;
      }
    };

    const timer = setTimeout(startScanner, 200);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [showIsbnScanner]);

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setBookForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleCoverChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setFormError("Please select a valid image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFormError("Book cover image must be smaller than 5 MB.");
      return;
    }

    setFormError("");
    setCoverSource("upload");

    setBookForm((current) => ({
      ...current,
      coverImage: file,
      coverImageUrl: "",
    }));

    setCoverPreview(URL.createObjectURL(file));
  };

  const handleCoverUrlChange = (event) => {
    const value = event.target.value;

    setBookForm((current) => ({
      ...current,
      coverImageUrl: value,
      coverImage: null,
    }));

    if (!value.trim()) {
      setCoverPreview("");
      setFormError("");
      return;
    }

    try {
      const url = new URL(value);

      if (!["http:", "https:"].includes(url.protocol)) {
        throw new Error();
      }

      setFormError("");
      setCoverPreview(value);
    } catch {
      setCoverPreview("");
      setFormError("Please enter a valid image URL.");
    }
  };

  const resetBookForm = () => {
    setBookForm({
      title: "",
      author: "",
      isbn: "",
      category: "",
      description: "",
      publisher: "",
      publishedYear: "",
      totalCopies: "",
      coverImage: null,
      coverImageUrl: "",
    });

    setCoverPreview("");
    setCoverSource("upload");
    setFormError("");
  };

  const closeAddBook = () => {
    if (savingBook) return;

    setShowAddBook(false);
    resetBookForm();
  };

  const handleSubmitBook = async (event) => {
    event.preventDefault();

    setFormError("");

    if (
      !bookForm.title.trim() ||
      !bookForm.author.trim() ||
      !bookForm.isbn.trim() ||
      !bookForm.category.trim() ||
      !bookForm.totalCopies
    ) {
      setFormError("Please fill in all required fields.");
      return;
    }

    const totalCopies = Number(bookForm.totalCopies);

    if (!Number.isInteger(totalCopies) || totalCopies < 1) {
      setFormError("Total copies must be a whole number greater than 0.");
      return;
    }

    try {
      setSavingBook(true);

      const formData = new FormData();

      formData.append("title", bookForm.title.trim());

      formData.append("author", bookForm.author.trim());

      formData.append("isbn", bookForm.isbn.trim());

      formData.append("category", bookForm.category.trim());

      formData.append("description", bookForm.description.trim());

      formData.append("publisher", bookForm.publisher.trim());

      if (bookForm.publishedYear) {
        formData.append("publishedYear", bookForm.publishedYear);
      }

      formData.append("totalCopies", String(totalCopies));

      if (bookForm.coverImage) {
        formData.append("coverImage", bookForm.coverImage);
      }

      if (bookForm.coverImageUrl.trim()) {
        formData.append("coverImageUrl", bookForm.coverImageUrl.trim());
      }

      const token = getToken();

      const response = await fetch(`${API_URL}/api/books`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to create the book.");
      }

      setBooks((current) => [data.book, ...current]);

      closeAddBook();
    } catch (err) {
      console.error("Add book error:", err);

      setFormError(err.message || "Unable to create the book.");
    } finally {
      setSavingBook(false);
    }
  };
  const handleEditBook = (book) => {
    setEditingBook(book);

    setBookForm({
      title: book.title || "",
      author: book.author || "",
      isbn: book.isbn || "",
      category: book.category || "",
      description: book.description || "",
      publisher: book.publisher || "",
      publishedYear: book.publishedYear || "",
      totalCopies: book.totalCopies || "",
      coverImage: null,
      coverImageUrl: book.coverImage?.startsWith("http") ? book.coverImage : "",
    });

    setCoverSource(book.coverImage?.startsWith("http") ? "url" : "upload");

    setCoverPreview(
      book.coverImage
        ? book.coverImage.startsWith("http")
          ? book.coverImage
          : `${API_URL}${book.coverImage}`
        : "",
    );

    setFormError("");
    setShowEditBook(true);
  };

  const closeEditBook = () => {
    if (savingBook) return;

    setShowEditBook(false);
    setEditingBook(null);
    resetBookForm();
  };

  const handleUpdateBook = async (event) => {
    event.preventDefault();

    setFormError("");

    if (!editingBook) return;

    if (
      !bookForm.title.trim() ||
      !bookForm.author.trim() ||
      !bookForm.isbn.trim() ||
      !bookForm.category.trim() ||
      !bookForm.totalCopies
    ) {
      setFormError("Please fill in all required fields.");
      return;
    }

    const totalCopies = Number(bookForm.totalCopies);

    if (!Number.isInteger(totalCopies) || totalCopies < 1) {
      setFormError("Total copies must be a whole number greater than 0.");
      return;
    }

    try {
      setSavingBook(true);

      const formData = new FormData();

      formData.append("title", bookForm.title.trim());

      formData.append("author", bookForm.author.trim());

      formData.append("isbn", bookForm.isbn.trim());

      formData.append("category", bookForm.category.trim());

      formData.append("description", bookForm.description.trim());

      formData.append("publisher", bookForm.publisher.trim());

      if (bookForm.publishedYear) {
        formData.append("publishedYear", bookForm.publishedYear);
      }

      formData.append("totalCopies", String(totalCopies));

      if (bookForm.coverImage) {
        formData.append("coverImage", bookForm.coverImage);
      }

      const token = getToken();

      const response = await fetch(`${API_URL}/api/books/${editingBook._id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to update the book.");
      }

      setBooks((current) =>
        current.map((book) =>
          book._id === editingBook._id ? data.book : book,
        ),
      );

      closeEditBook();
    } catch (err) {
      console.error("Update book error:", err);

      setFormError(err.message || "Unable to update the book.");
    } finally {
      setSavingBook(false);
    }
  };

  const handleDelete = async (book) => {
    const confirmed = window.confirm(
      `Remove "${book.title}" from the library inventory?`,
    );

    if (!confirmed) return;

    try {
      setDeletingId(book._id);

      const token = getToken();

      const response = await fetch(`${API_URL}/api/books/${book._id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to remove the book.");
      }

      setBooks((current) => current.filter((item) => item._id !== book._id));
    } catch (err) {
      console.error("Delete book error:", err);

      window.alert(err.message || "Unable to remove the book.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleAddBook = () => {
    setFormError("");
    setShowAddBook(true);
  };

  if (loading) {
    return (
      <div className="min-w-0 pb-10">
        <InventoryHeader onAddBook={handleAddBook} />

        <div className="mt-6 rounded-2xl border border-slate-200/80 bg-white px-6 py-20 text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />

          <p className="mt-5 text-base font-semibold text-slate-800">
            Loading inventory...
          </p>

          <p className="mt-1 text-sm text-slate-400">
            Fetching the latest books from the library database.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-w-0 pb-10">
        <InventoryHeader onAddBook={handleAddBook} />

        <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-6 py-16 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-500">
            <Archive className="h-5 w-5" />
          </div>

          <h2 className="mt-5 text-lg font-bold text-rose-800">
            Unable to load inventory
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-rose-600">
            {error}
          </p>

          <button
            type="button"
            onClick={fetchBooks}
            className="mt-6 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-w-0 pb-10">
      <InventoryHeader onAddBook={handleAddBook} />

      {/* Summary */}
      <section className="mt-7 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Summary
          label="Total titles"
          value={totalTitles}
          icon={BookOpen}
          tone="indigo"
        />

        <Summary
          label="Total copies"
          value={totalCopies}
          icon={Archive}
          tone="violet"
        />

        <Summary
          label="Available copies"
          value={availableCopies}
          icon={CheckCircle2}
          tone="emerald"
        />

        <Summary
          label="Reserved copies"
          value={reservedCopies}
          icon={TrendingUp}
          tone="amber"
        />
      </section>

      {/* Collection health */}
      <section className="mt-6 rounded-2xl bg-slate-950 p-6 text-white shadow-[0_10px_30px_rgba(15,23,42,0.1)] sm:p-7">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-indigo-300">
                <Library className="h-4 w-4" />
              </span>

              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-indigo-300">
                Collection health
              </span>
            </div>

            <h2 className="mt-5 text-xl font-bold tracking-[-0.03em]">
              {availableCopies} copies currently available.
            </h2>

            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
              {unavailable > 0
                ? `${unavailable} title${
                    unavailable === 1 ? "" : "s"
                  } currently ${
                    unavailable === 1 ? "has" : "have"
                  } no available copies.`
                : "All titles currently have at least one available copy."}
            </p>
          </div>

          <div className="sm:w-60">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">
                Availability rate
              </span>

              <span className="text-sm font-bold text-indigo-300">
                {availabilityRate}%
              </span>
            </div>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-indigo-500 transition-all"
                style={{
                  width: `${availabilityRate}%`,
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Controls */}
      <section className="mt-6 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)] sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search title, author, ISBN, or book ID..."
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-10 pr-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
            />
          </div>

          <div className="flex gap-1 overflow-x-auto rounded-xl bg-slate-50 p-1">
            {["All", "Available", "Low stock", "Reserved", "Unavailable"].map(
              (item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setFilter(item)}
                  className={[
                    "shrink-0 rounded-lg px-3.5 py-2.5 text-xs font-semibold transition-colors",
                    filter === item
                      ? "bg-slate-950 text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-800",
                  ].join(" ")}
                >
                  {item}
                </button>
              ),
            )}
          </div>
        </div>
      </section>

      {/* Inventory */}
      <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
        <div className="border-b border-slate-100 p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-indigo-600">
            Book collection
          </p>

          <h2 className="mt-2 text-xl font-bold tracking-[-0.02em] text-slate-950">
            Inventory
          </h2>

          <p className="mt-1.5 text-sm text-slate-400">
            {filteredBooks.length} title
            {filteredBooks.length === 1 ? "" : "s"} shown.
          </p>
        </div>

        {/* Mobile */}
        <div className="divide-y divide-slate-100 md:hidden">
          {filteredBooks.map((book) => (
            <InventoryCard
              key={book._id}
              book={book}
              status={getStatus(book)}
              deleting={deletingId === book._id}
              onDelete={handleDelete}
              onEdit={handleEditBook}
            />
          ))}

          {filteredBooks.length === 0 && <EmptyState />}
        </div>

        {/* Desktop */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[1000px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <TableHead>Book</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>ISBN</TableHead>
                <TableHead>Copies</TableHead>
                <TableHead>Available</TableHead>
                <TableHead>Reserved</TableHead>
                <TableHead>Status</TableHead>
                <TableHead align="right">Actions</TableHead>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredBooks.map((book) => (
                <InventoryRow
                  key={book._id}
                  book={book}
                  status={getStatus(book)}
                  deleting={deletingId === book._id}
                  onDelete={handleDelete}
                  onEdit={handleEditBook}
                />
              ))}
            </tbody>
          </table>

          {filteredBooks.length === 0 && <EmptyState />}
        </div>
      </section>

      {/* Footer */}
      <section className="mt-6 flex flex-col gap-4 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
            <Archive className="h-4 w-4" />
          </span>

          <div>
            <p className="text-sm font-bold text-indigo-900">
              Inventory is connected
            </p>

            <p className="mt-1 text-xs leading-5 text-indigo-700/60">
              Changes made through the library management system are reflected
              in the catalogue.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700"
        >
          View inventory report
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </section>

      {showAddBook && (
        <AddBookModal
          form={bookForm}
          preview={coverPreview}
          error={formError}
          saving={savingBook}
          fileInputRef={fileInputRef}
          onOpenScanner={openIsbnScanner}
          onPreviewError={() => setFormError("Unable to load this image URL.")}
          onChange={handleFormChange}
          coverSource={coverSource}
          onCoverChange={handleCoverChange}
          onCoverUrlChange={handleCoverUrlChange}
          onSubmit={handleSubmitBook}
          onClose={closeAddBook}
          onChooseCover={() => {
            setCoverSource("upload");
            fileInputRef.current?.click();
          }}
          onChooseUrl={() => {
            setCoverSource("url");
            setBookForm((current) => ({
              ...current,
              coverImage: null,
            }));
            setFormError("");
          }}
        />
      )}

      {showIsbnScanner && (
        <IsbnScannerModal error={scannerError} onClose={closeIsbnScanner} />
      )}

      {showEditBook && (
        <EditBookModal
          form={bookForm}
          preview={coverPreview}
          error={formError}
          saving={savingBook}
          fileInputRef={fileInputRef}
          onPreviewError={() => setFormError("Unable to load this image URL.")}
          onChange={handleFormChange}
          coverSource={coverSource}
          onCoverChange={handleCoverChange}
          onCoverUrlChange={handleCoverUrlChange}
          onSubmit={handleUpdateBook}
          onClose={closeEditBook}
          onChooseCover={() => {
            setCoverSource("upload");
            fileInputRef.current?.click();
          }}
          onChooseUrl={() => {
            setCoverSource("url");
            setBookForm((current) => ({
              ...current,
              coverImage: null,
            }));
            setFormError("");
          }}
        />
      )}
    </div>
  );
}

function InventoryHeader({ onAddBook }) {
  return (
    <section>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">
        Collection management
      </p>

      <div className="mt-2 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-[-0.045em] text-slate-950 sm:text-4xl">
            Library inventory
          </h1>

          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500 sm:text-base">
            Manage books, copies, availability, and collection details.
          </p>
        </div>

        <button
          type="button"
          onClick={onAddBook}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 hover:shadow-md"
        >
          <Plus className="h-4 w-4" />
          Add book
        </button>
      </div>
    </section>
  );
}

function Summary({ label, value, icon: Icon, tone }) {
  const tones = {
    indigo: "bg-indigo-50 text-indigo-600",
    violet: "bg-violet-50 text-violet-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-slate-400">{label}</p>

          <p className="mt-2 text-2xl font-bold tracking-[-0.04em] text-slate-950">
            {value}
          </p>
        </div>

        <span
          className={[
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
            tones[tone],
          ].join(" ")}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>
    </div>
  );
}

function InventoryRow({ book, status, deleting, onDelete, onEdit }) {
  const total = Number(book.totalCopies) || 0;

  const available = Number(book.availableCopies) || 0;

  const availability = total > 0 ? Math.round((available / total) * 100) : 0;

  return (
    <tr className="transition-colors hover:bg-slate-50/50">
      <td className="px-5 py-5">
        <div className="flex min-w-[280px] items-center gap-4">
          <BookCover book={book} size="desktop" />

          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-800">
              {book.title}
            </p>

            <p className="mt-1 truncate text-xs text-slate-400">
              {book.author}
            </p>

            <p className="mt-1.5 text-[11px] font-medium text-slate-300">
              {book._id}
            </p>
          </div>
        </div>
      </td>

      <td className="px-5 py-5">
        <span className="rounded-full bg-indigo-50 px-2.5 py-1.5 text-xs font-semibold text-indigo-700">
          {book.category}
        </span>
      </td>

      <td className="px-5 py-5">
        <span className="text-xs font-medium text-slate-500">{book.isbn}</span>
      </td>

      <td className="px-5 py-5">
        <span className="text-sm font-bold text-slate-700">{total}</span>
      </td>

      <td className="px-5 py-5">
        <div className="w-32">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">
              {available} available
            </span>

            <span className="text-[11px] font-semibold text-slate-500">
              {availability}%
            </span>
          </div>

          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className={[
                "h-full rounded-full",
                status === "Low stock"
                  ? "bg-amber-500"
                  : status === "Unavailable"
                    ? "bg-rose-500"
                    : "bg-emerald-500",
              ].join(" ")}
              style={{
                width: `${availability}%`,
              }}
            />
          </div>
        </div>
      </td>

      <td className="px-5 py-5">
        <Status status={status} />
      </td>

      <td className="px-5 py-5 text-right">
        <div className="flex justify-end gap-2">
          <ActionButton
            icon={Edit3}
            label={`Edit ${book.title}`}
            onClick={() => onEdit(book)}
          />

          <button
            type="button"
            disabled={deleting}
            onClick={() => onDelete(book)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label={`Delete ${book.title}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

function InventoryCard({ book, status, deleting, onDelete, onEdit }) {
  const total = Number(book.totalCopies) || 0;

  const available = Number(book.availableCopies) || 0;

  return (
    <article className="p-5">
      <div className="flex gap-4">
        <BookCover book={book} size="mobile" />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-sm font-bold text-slate-800">
                {book.title}
              </h2>

              <p className="mt-1 truncate text-xs text-slate-400">
                {book.author}
              </p>
            </div>

            <Status status={status} />
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-indigo-50 px-2.5 py-1.5 text-[11px] font-semibold text-indigo-700">
              {book.category}
            </span>

            <span className="rounded-full bg-slate-100 px-2.5 py-1.5 text-[11px] font-semibold text-slate-500">
              {book.isbn}
            </span>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                Copies
              </p>

              <p className="mt-1 text-sm font-bold text-slate-700">{total}</p>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                Available
              </p>

              <p className="mt-1 text-sm font-bold text-emerald-600">
                {available}
              </p>
            </div>
          </div>

          <div className="mt-5 flex gap-2">
            <button
              type="button"
              onClick={() => onEdit(book)}
              className="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
            >
              <Edit3 className="h-3.5 w-3.5" />
              Edit
            </button>

            <button
              type="button"
              disabled={deleting}
              onClick={() => onDelete(book)}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label={`Delete ${book.title}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function BookCover({ book, size }) {
  const [imageError, setImageError] = useState(false);

  const isMobile = size === "mobile";

  const coverUrl = book.coverImage?.startsWith("http")
    ? book.coverImage
    : `${API_URL}${book.coverImage || ""}`;

  if (book.coverImage && !imageError) {
    return (
      <img
        src={coverUrl}
        alt={`${book.title} cover`}
        onError={() => setImageError(true)}
        className={[
          "shrink-0 rounded-md object-cover bg-slate-100 shadow-sm",
          isMobile ? "h-20 w-14" : "h-14 w-10",
        ].join(" ")}
      />
    );
  }

  return (
    <div
      className={[
        "flex shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-indigo-600 to-violet-600 text-white",
        isMobile ? "h-20 w-14" : "h-14 w-10",
      ].join(" ")}
      aria-label={`${book.title} cover placeholder`}
    >
      <BookOpen className={isMobile ? "h-5 w-5" : "h-4 w-4"} />
    </div>
  );
}

function Status({ status }) {
  const styles = {
    Available: "bg-emerald-50 text-emerald-700",
    "Low stock": "bg-amber-50 text-amber-700",
    Unavailable: "bg-rose-50 text-rose-700",
  };

  return (
    <span
      className={[
        "inline-flex rounded-full px-2.5 py-1.5 text-[11px] font-semibold",
        styles[status] || "bg-slate-100 text-slate-600",
      ].join(" ")}
    >
      {status}
    </span>
  );
}

function ActionButton({ icon: Icon, label, disabled = false, onClick }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-40"
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

function TableHead({ children, align = "left" }) {
  return (
    <th
      className={[
        "px-5 py-3.5 text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400",
        align === "right" ? "text-right" : "text-left",
      ].join(" ")}
    >
      {children}
    </th>
  );
}

function EmptyState() {
  return (
    <div className="px-6 py-20 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <Search className="h-5 w-5" />
      </div>

      <h2 className="mt-5 text-base font-bold text-slate-900">
        No books found
      </h2>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
        Try another title, author, ISBN, or inventory status.
      </p>
    </div>
  );
}
function AddBookModal({
  form,
  preview,
  error,
  saving,
  fileInputRef,
  onOpenScanner,
  onPreviewError,
  coverSource,
  onChange,
  onCoverChange,
  onCoverUrlChange,
  onSubmit,
  onClose,
  onChooseCover,
  onChooseUrl,
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">
              Collection management
            </p>

            <h2 className="mt-1 text-xl font-bold text-slate-950">
              Add a new book
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900"
            aria-label="Close add book form"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={onSubmit}
          className="max-h-[calc(92vh-80px)] overflow-y-auto"
        >
          <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[190px_1fr]">
            {/* Cover */}
            <div>
              <label className="text-sm font-semibold text-slate-800">
                Book cover
              </label>

              <p className="mt-1 text-xs text-slate-400">
                Upload from device or use an image URL.
              </p>

              <div className="mt-4 flex aspect-[3/4] w-full items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-slate-200 bg-slate-50">
                {preview ? (
                  <img
                    src={preview}
                    alt="Book cover preview"
                    className="h-full w-full object-cover"
                    onError={onPreviewError}
                  />
                ) : (
                  <div className="text-center">
                    <ImagePlus className="mx-auto h-7 w-7 text-indigo-500" />

                    <p className="mt-3 text-xs font-semibold text-slate-600">
                      No cover selected
                    </p>

                    <p className="mt-1 text-[11px] text-slate-400">Optional</p>
                  </div>
                )}
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={onChooseCover}
                  className={[
                    "rounded-lg border px-3 py-2.5 text-xs font-semibold transition-colors",
                    coverSource === "upload"
                      ? "border-indigo-600 bg-indigo-600 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                  ].join(" ")}
                >
                  <span className="inline-flex items-center justify-center gap-1.5">
                    <Upload className="h-3.5 w-3.5" />
                    From device
                  </span>
                </button>

                <button
                  type="button"
                  onClick={onChooseUrl}
                  className={[
                    "rounded-lg border px-3 py-2.5 text-xs font-semibold transition-colors",
                    coverSource === "url"
                      ? "border-indigo-600 bg-indigo-600 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                  ].join(" ")}
                >
                  Image URL
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={onCoverChange}
                className="hidden"
              />

              {coverSource === "upload" ? (
                <p className="mt-2 text-center text-[11px] text-slate-400">
                  JPG, PNG or WEBP · Maximum 5 MB
                </p>
              ) : (
                <input
                  type="url"
                  name="coverImageUrl"
                  value={form.coverImageUrl}
                  onChange={onCoverUrlChange}
                  placeholder="https://example.com/book-cover.jpg"
                  className="mt-3 h-11 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 text-xs text-slate-900 outline-none placeholder:text-slate-400 transition-all focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                />
              )}
            </div>

            {/* Book details */}
            <div className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  label="Book title"
                  name="title"
                  value={form.title}
                  onChange={onChange}
                  placeholder="Enter book title"
                  required
                />

                <Field
                  label="Author"
                  name="author"
                  value={form.author}
                  onChange={onChange}
                  placeholder="Enter author name"
                  required
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <label
                      htmlFor="isbn"
                      className="text-sm font-semibold text-slate-800"
                    >
                      ISBN
                      <span className="ml-1 text-indigo-600">*</span>
                    </label>

                    <button
                      type="button"
                      onClick={onOpenScanner}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-[11px] font-bold text-indigo-700 transition-all hover:border-indigo-300 hover:bg-indigo-100 active:scale-[0.98]"
                    >
                      <ScanLine className="h-3.5 w-3.5" />
                      Scan ISBN
                    </button>
                  </div>

                  <input
                    id="isbn"
                    name="isbn"
                    type="text"
                    value={form.isbn}
                    onChange={onChange}
                    placeholder="Enter ISBN or scan barcode"
                    required
                    className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 transition-all focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                  />

                  <p className="mt-1.5 text-[11px] text-slate-400">
                    Scan the ISBN barcode printed on the back of the book.
                  </p>
                </div>

                <Field
                  label="Category"
                  name="category"
                  value={form.category}
                  onChange={onChange}
                  placeholder="e.g. Fiction"
                  required
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-3">
                <Field
                  label="Publisher"
                  name="publisher"
                  value={form.publisher}
                  onChange={onChange}
                  placeholder="Publisher"
                />

                <Field
                  label="Published year"
                  name="publishedYear"
                  type="number"
                  value={form.publishedYear}
                  onChange={onChange}
                  placeholder="2026"
                />

                <Field
                  label="Total copies"
                  name="totalCopies"
                  type="number"
                  min="1"
                  value={form.totalCopies}
                  onChange={onChange}
                  placeholder="1"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="text-sm font-semibold text-slate-800"
                >
                  Description
                </label>

                <textarea
                  id="description"
                  name="description"
                  value={form.description}
                  onChange={onChange}
                  rows={5}
                  placeholder="Enter a short description..."
                  className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-3 text-sm leading-6 text-slate-900 outline-none placeholder:text-slate-400 transition-all focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="mx-5 mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
              <p className="text-sm font-medium text-rose-700">{error}</p>
            </div>
          )}

          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50/70 p-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Adding book...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Add book
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  min,
  required = false,
}) {
  return (
    <div>
      <label htmlFor={name} className="text-sm font-semibold text-slate-800">
        {label}

        {required && <span className="ml-1 text-indigo-600">*</span>}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        min={min}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 transition-all focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
      />
    </div>
  );
}

function EditBookModal({
  form,
  preview,
  error,
  saving,
  fileInputRef,
  onPreviewError,
  coverSource,
  onChange,
  onCoverChange,
  onCoverUrlChange,
  onSubmit,
  onClose,
  onChooseCover,
  onChooseUrl,
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">
              Collection management
            </p>

            <h2 className="mt-1 text-xl font-bold text-slate-950">Edit book</h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900"
            aria-label="Close edit book form"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={onSubmit}
          className="max-h-[calc(92vh-80px)] overflow-y-auto"
        >
          <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[190px_1fr]">
            {/* Cover */}
            <div>
              <label className="text-sm font-semibold text-slate-800">
                Book cover
              </label>

              <p className="mt-1 text-xs leading-5 text-slate-400">
                Upload a new cover or replace it with an image URL.
              </p>

              <div className="mt-4 flex aspect-[3/4] w-full items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-slate-200 bg-slate-50">
                {preview ? (
                  <img
                    src={preview}
                    alt="Book cover preview"
                    className="h-full w-full object-cover"
                    onError={onPreviewError}
                  />
                ) : (
                  <div className="text-center">
                    <ImagePlus className="mx-auto h-7 w-7 text-indigo-500" />

                    <p className="mt-3 text-xs font-semibold text-slate-600">
                      No cover selected
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={onChooseCover}
                  className={[
                    "rounded-lg border px-3 py-2.5 text-xs font-semibold transition-colors",
                    coverSource === "upload"
                      ? "border-indigo-600 bg-indigo-600 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                  ].join(" ")}
                >
                  <span className="inline-flex items-center justify-center gap-1.5">
                    <Upload className="h-3.5 w-3.5" />
                    From device
                  </span>
                </button>

                <button
                  type="button"
                  onClick={onChooseUrl}
                  className={[
                    "rounded-lg border px-3 py-2.5 text-xs font-semibold transition-colors",
                    coverSource === "url"
                      ? "border-indigo-600 bg-indigo-600 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                  ].join(" ")}
                >
                  Image URL
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={onCoverChange}
                className="hidden"
              />

              {coverSource === "upload" ? (
                <p className="mt-2 text-center text-[11px] text-slate-400">
                  JPG, PNG or WEBP · Maximum 5 MB
                </p>
              ) : (
                <input
                  type="url"
                  name="coverImageUrl"
                  value={form.coverImageUrl}
                  onChange={onCoverUrlChange}
                  placeholder="https://example.com/book-cover.jpg"
                  className="mt-3 h-11 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 text-xs text-slate-900 outline-none placeholder:text-slate-400 transition-all focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                />
              )}
            </div>

            {/* Details */}
            <div className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  label="Book title"
                  name="title"
                  value={form.title}
                  onChange={onChange}
                  placeholder="Enter book title"
                  required
                />

                <Field
                  label="Author"
                  name="author"
                  value={form.author}
                  onChange={onChange}
                  placeholder="Enter author name"
                  required
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  label="ISBN"
                  name="isbn"
                  value={form.isbn}
                  onChange={onChange}
                  placeholder="Enter ISBN"
                  required
                />

                <Field
                  label="Category"
                  name="category"
                  value={form.category}
                  onChange={onChange}
                  placeholder="e.g. Fiction"
                  required
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-3">
                <Field
                  label="Publisher"
                  name="publisher"
                  value={form.publisher}
                  onChange={onChange}
                  placeholder="Publisher"
                />

                <Field
                  label="Published year"
                  name="publishedYear"
                  type="number"
                  value={form.publishedYear}
                  onChange={onChange}
                  placeholder="2026"
                />

                <Field
                  label="Total copies"
                  name="totalCopies"
                  type="number"
                  min="1"
                  value={form.totalCopies}
                  onChange={onChange}
                  placeholder="1"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="edit-description"
                  className="text-sm font-semibold text-slate-800"
                >
                  Description
                </label>

                <textarea
                  id="edit-description"
                  name="description"
                  value={form.description}
                  onChange={onChange}
                  rows={5}
                  placeholder="Enter a short description..."
                  className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-3 text-sm leading-6 text-slate-900 outline-none placeholder:text-slate-400 transition-all focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                />
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mx-5 mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
              <p className="text-sm font-medium text-rose-700">{error}</p>
            </div>
          )}

          {/* Footer */}
          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50/70 p-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Saving changes...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Save changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
function IsbnScannerModal({ error, onClose }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-slate-950 shadow-[0_25px_80px_rgba(0,0,0,0.45)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-400/20">
              <ScanLine className="h-5 w-5" />
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-300">
                Libro Smart Scanner
              </p>

              <h2 className="mt-0.5 text-lg font-bold tracking-[-0.02em] text-white">
                Scan ISBN
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition-all hover:bg-white/10 hover:text-white"
            aria-label="Close ISBN scanner"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scanner area */}
        <div className="p-4 sm:p-6">
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black">
            {/* Camera preview */}
            <div
              id="libro-isbn-reader"
              className="min-h-[300px] w-full overflow-hidden sm:min-h-[380px]"
            />

            {/* Scanner overlay */}
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute inset-0 bg-gradient-to-b from-slate-950/20 via-transparent to-slate-950/40" />

              {/* Scan frame */}
              <div className="absolute left-1/2 top-1/2 h-32 w-[82%] max-w-[430px] -translate-x-1/2 -translate-y-1/2 sm:h-40">
                {/* Top-left */}
                <span className="absolute left-0 top-0 h-7 w-7 rounded-tl-xl border-l-2 border-t-2 border-indigo-400" />

                {/* Top-right */}
                <span className="absolute right-0 top-0 h-7 w-7 rounded-tr-xl border-r-2 border-t-2 border-indigo-400" />

                {/* Bottom-left */}
                <span className="absolute bottom-0 left-0 h-7 w-7 rounded-bl-xl border-b-2 border-l-2 border-indigo-400" />

                {/* Bottom-right */}
                <span className="absolute bottom-0 right-0 h-7 w-7 rounded-br-xl border-b-2 border-r-2 border-indigo-400" />

                {/* Animated scan line */}
                <span className="absolute left-3 right-3 top-1/2 h-px -translate-y-1/2 bg-indigo-400 shadow-[0_0_14px_rgba(129,140,248,0.9)]" />
              </div>

              {/* Center instruction */}
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/10 bg-black/45 px-4 py-2 text-[11px] font-medium text-slate-200 backdrop-blur-md">
                Align the ISBN barcode inside the frame
              </div>
            </div>
          </div>

          {/* Error state */}
          {error ? (
            <div className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-500/10 text-rose-300">
                  <X className="h-4 w-4" />
                </div>

                <div>
                  <p className="text-sm font-semibold text-rose-200">
                    Scanner unavailable
                  </p>

                  <p className="mt-1 text-xs leading-5 text-rose-300/80">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-300">
                <ShieldCheck className="h-4 w-4" />
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-200">
                  Camera stays on this device
                </p>

                <p className="mt-0.5 text-[11px] leading-5 text-slate-500">
                  Libro reads the barcode locally to identify the ISBN.
                </p>
              </div>
            </div>
          )}

          {/* Manual fallback */}
          <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-200">
                  Can't scan the barcode?
                </p>

                <p className="mt-1 text-[11px] leading-5 text-slate-500">
                  You can close the scanner and enter the ISBN manually in the
                  Add Book form.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-indigo-400/20 bg-indigo-500/10 px-4 text-xs font-semibold text-indigo-200 transition-all hover:border-indigo-400/40 hover:bg-indigo-500/15"
              >
                Enter ISBN manually
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-white/10 bg-white/[0.02] px-5 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.8)]" />

            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              ISBN scanner
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-slate-400 transition-colors hover:text-white"
          >
            Close scanner
          </button>
        </div>
      </div>
    </div>
  );
}
