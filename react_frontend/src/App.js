import React, { useState, useEffect, useRef } from 'react';
import './App.css';

/**
 * UTIL: Helper to generate unique IDs for notes.
 */
function uuid() {
  // Not cryptographically secure; sufficient for demo.
  return '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * LOCAL STORAGE KEY
 */
const STORAGE_KEY = 'kavia_notes_app_notes';

/**
 * PUBLIC_INTERFACE
 * Main Notes App Component.
 * Retro-inspired, light/modern style, fully responsive.
 */
function App() {
  // App state
  const [notes, setNotes] = useState([]);
  const [search, setSearch] = useState('');
  const [view, setView] = useState('list'); // 'list' | 'edit' | 'create' | 'view'
  const [activeId, setActiveId] = useState(null);
  const [editingNote, setEditingNote] = useState({ title: '', content: '' });
  const [theme, setTheme] = useState('light');

  // Refs
  const titleInputRef = useRef(null);

  // Load notes from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setNotes(JSON.parse(saved));
    }
    // Restore theme if set
    const localTheme = window.localStorage.getItem('kavia_note_theme');
    if (localTheme) setTheme(localTheme);
  }, []);

  // Save notes to localStorage whenever notes change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  }, [notes]);

  // Set theme variable and save it in localStorage
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    window.localStorage.setItem('kavia_note_theme', theme);
  }, [theme]);

  // Focus title input on switching to edit/create
  useEffect(() => {
    if ((view === 'edit' || view === 'create') && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [view]);

  // Derived: filtered notes based on search
  const filteredNotes = notes.filter(
    note =>
      note.title.toLowerCase().includes(search.toLowerCase()) ||
      note.content.toLowerCase().includes(search.toLowerCase())
  );

  /**
   * PUBLIC_INTERFACE
   * Handle creation of a new note (shows form).
   */
  const handleCreateNew = () => {
    setEditingNote({ title: '', content: '' });
    setActiveId(null);
    setView('create');
  };

  /**
   * PUBLIC_INTERFACE
   * Handle starting to edit an existing note.
   * @param {*} noteId 
   */
  const handleEdit = (noteId) => {
    const found = notes.find(n => n.id === noteId);
    if (found) {
      setEditingNote({ title: found.title, content: found.content });
      setActiveId(noteId);
      setView('edit');
    }
  };

  /**
   * PUBLIC_INTERFACE
   * Handle deletion of a note.
   * @param {*} noteId 
   */
  const handleDelete = (noteId) => {
    if (window.confirm('Delete this note?')) {
      setNotes(prev => prev.filter(n => n.id !== noteId));
      if (view !== 'list') setView('list');
      setActiveId(null);
    }
  };

  /**
   * PUBLIC_INTERFACE
   * Handle save (both for create and edit).
   */
  const handleSave = (e) => {
    e.preventDefault();
    const title = editingNote.title.trim();
    const content = editingNote.content.trim();
    if (!title) {
      alert('Title cannot be empty');
      return;
    }
    if (view === 'create') {
      setNotes(prev => [
        { id: uuid(), title, content, created: Date.now(), updated: Date.now() },
        ...prev,
      ]);
    } else if (view === 'edit' && activeId) {
      setNotes(prev =>
        prev.map(n =>
          n.id === activeId
            ? { ...n, title, content, updated: Date.now() }
            : n
        )
      );
    }
    setView('list');
    setEditingNote({ title: '', content: '' });
    setActiveId(null);
  };

  /**
   * PUBLIC_INTERFACE
   * Handle click in list to view a note in readonly panel.
   */
  const handleView = (noteId) => {
    setActiveId(noteId);
    setView('view');
  };

  /**
   * PUBLIC_INTERFACE
   * Search input change.
   */
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  /**
   * PUBLIC_INTERFACE
   * Change theme from Light <-> Dark.
   */
  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  /**
   * Form handlers
   */
  const handleEditNoteChange = (e) => {
    const { name, value } = e.target;
    setEditingNote(prev => ({ ...prev, [name]: value }));
  };

  /**
   * PUBLIC_INTERFACE
   * Render: NAVBAR (retro)
   */
  function NavBar() {
    return (
      <nav className="rk-navbar">
        <div className="rk-navbar__brand">
          <span role="img" aria-label="notes" className="rk-navbar__icon">📝</span>
          <span className="rk-navbar__title">Retro Notes</span>
        </div>
        <button
          className="rk-navbar__theme"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>
      </nav>
    );
  }

  /**
   * PUBLIC_INTERFACE
   * Render: NOTE LIST view.
   */
  function NoteListView() {
    return (
      <div className="rk-main-content">
        <div className="rk-list-actions">
          <input
            type="text"
            className="rk-search"
            placeholder="Search notes…"
            value={search}
            onChange={handleSearchChange}
            aria-label="Search notes"
          />
          <button className="rk-create-btn" onClick={handleCreateNew}>+ New Note</button>
        </div>
        <div className="rk-note-list">
          {filteredNotes.length === 0 ? (
            <div className="rk-empty-msg">No notes found.</div>
          ) : (
            filteredNotes.map(note => (
              <div
                key={note.id}
                className={`rk-note-card${activeId === note.id && view === 'view' ? ' rk-note-card--active' : ''}`}
                tabIndex={0}
                role="button"
                onClick={() => handleView(note.id)}
                onKeyDown={e => { if (e.key === 'Enter') handleView(note.id); }}
                aria-label={`Open note "${note.title}"`}
              >
                <div className="rk-note-title">{note.title || <em>Untitled</em>}</div>
                <div className="rk-note-preview">{note.content?.slice(0, 80) || <span style={{ opacity: 0.5 }}>No content</span>}</div>
                <div className="rk-note-footer">
                  <span className="rk-note-date">
                    {note.updated
                      ? "Edited: " + (new Date(note.updated)).toLocaleString()
                      : ""}
                  </span>
                  <span className="rk-note-actions">
                    <button className="rk-note-btn rk-note-edit" onClick={e => { e.stopPropagation(); handleEdit(note.id); }} title="Edit">✏️</button>
                    <button className="rk-note-btn rk-note-delete" onClick={e => { e.stopPropagation(); handleDelete(note.id); }} title="Delete">🗑️</button>
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  /**
   * PUBLIC_INTERFACE
   * Render: NOTE EDIT FORM view (used for both create/edit).
   */
  function EditNoteView({ isEdit }) {
    return (
      <div className="rk-main-content">
        <form className="rk-edit-form" onSubmit={handleSave} autoComplete="off">
          <label htmlFor="rk-title" className="rk-label">Title</label>
          <input
            ref={titleInputRef}
            id="rk-title"
            name="title"
            className="rk-input"
            maxLength={80}
            value={editingNote.title}
            onChange={handleEditNoteChange}
            required
            aria-label="Note title"
          />
          <label htmlFor="rk-content" className="rk-label">Content</label>
          <textarea
            id="rk-content"
            name="content"
            className="rk-input rk-input--area"
            rows={8}
            value={editingNote.content}
            onChange={handleEditNoteChange}
            aria-label="Note content"
          ></textarea>
          <div className="rk-edit-actions">
            <button className="rk-save-btn" type="submit">{isEdit ? 'Save Changes' : 'Add Note'}</button>
            <button className="rk-cancel-btn" type="button" onClick={() => setView('list')}>Cancel</button>
          </div>
        </form>
      </div>
    );
  }

  /**
   * PUBLIC_INTERFACE
   * Render: NOTE VIEW panel (read-only).
   */
  function ViewNotePanel() {
    const note = notes.find(n => n.id === activeId);
    if (!note) return (
      <div className="rk-main-content">
        <div className="rk-empty-msg">Note not found.</div>
        <button className="rk-cancel-btn" onClick={() => setView('list')}>Back</button>
      </div>
    );
    return (
      <div className="rk-main-content">
        <div className="rk-view-panel">
          <div className="rk-view-title">{note.title}</div>
          <div className="rk-view-content">{note.content ? note.content : <span style={{ opacity: 0.6 }}>No content.</span>}</div>
          <div className="rk-view-dates">
            <span>Created: {(new Date(note.created)).toLocaleString()}</span>
            {note.updated !== note.created && (
              <span> • Updated: {(new Date(note.updated)).toLocaleString()}</span>
            )}
          </div>
          <div className="rk-edit-actions">
            <button className="rk-note-edit" onClick={() => handleEdit(note.id)}>Edit</button>
            <button className="rk-note-delete" onClick={() => handleDelete(note.id)}>Delete</button>
            <button className="rk-cancel-btn" onClick={() => setView('list')}>Back</button>
          </div>
        </div>
      </div>
    );
  }

  // Main app body
  return (
    <div className="rk-app-shell">
      <NavBar />
      <main className="rk-body">
        {view === 'list' && <NoteListView />}
        {view === 'create' && <EditNoteView isEdit={false} />}
        {view === 'edit' && <EditNoteView isEdit={true} />}
        {view === 'view' && <ViewNotePanel />}
      </main>
      <footer className="rk-footer">
        <span>Retro Notes &copy; {new Date().getFullYear()} &mdash; Your Notes Stay in Your Browser</span>
      </footer>
    </div>
  );
}

export default App;
