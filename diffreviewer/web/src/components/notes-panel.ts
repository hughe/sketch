import { html, css, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { deleteNote } from '../services/notes';
import type { Note } from '../types';

@customElement('notes-panel')
export class NotesPanel extends LitElement {
  @property({ type: Array }) notes: Note[] = [];

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
    }

    .header {
      padding: 1rem;
      border-bottom: 1px solid #e5e7eb;
      background: white;
    }

    .title {
      font-size: 1rem;
      font-weight: 600;
      color: #111827;
    }

    .notes-list {
      flex: 1;
      overflow-y: auto;
      padding: 1rem;
    }

    .note-group {
      margin-bottom: 1.5rem;
    }

    .file-name {
      font-size: 0.875rem;
      font-weight: 600;
      color: #374151;
      margin-bottom: 0.5rem;
    }

    .note-item {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 0.375rem;
      padding: 0.75rem;
      margin-bottom: 0.5rem;
    }

    .note-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .line-number {
      font-size: 0.75rem;
      color: #6b7280;
      font-family: monospace;
    }

    .note-actions {
      display: flex;
      gap: 0.25rem;
    }

    .action-btn {
      padding: 0.25rem 0.5rem;
      background: transparent;
      border: none;
      border-radius: 0.25rem;
      cursor: pointer;
      font-size: 0.75rem;
      color: #6b7280;
    }

    .action-btn:hover {
      background: #f3f4f6;
      color: #111827;
    }

    .delete-btn:hover {
      color: #dc2626;
    }

    .line-content {
      font-size: 0.75rem;
      font-family: monospace;
      background: #f9fafb;
      padding: 0.5rem;
      border-radius: 0.25rem;
      margin-bottom: 0.5rem;
      color: #374151;
      overflow-x: auto;
    }

    .note-text {
      font-size: 0.875rem;
      color: #111827;
      white-space: pre-wrap;
    }

    .empty-state {
      text-align: center;
      padding: 2rem;
      color: #9ca3af;
      font-size: 0.875rem;
    }
  `;

  private async handleDelete(note: Note) {
    if (!confirm(`Delete note for ${note.file}:${note.line}?`)) {
      return;
    }

    try {
      await deleteNote(note.file, note.line);
      this.dispatchEvent(
        new CustomEvent('notes-update', {
          bubbles: true,
          composed: true,
        })
      );
    } catch (err) {
      alert('Failed to delete note: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  }

  private groupNotesByFile(): Map<string, Note[]> {
    const grouped = new Map<string, Note[]>();
    for (const note of this.notes) {
      if (!grouped.has(note.file)) {
        grouped.set(note.file, []);
      }
      grouped.get(note.file)!.push(note);
    }
    return grouped;
  }

  render() {
    if (this.notes.length === 0) {
      return html`
        <div class="header">
          <div class="title">Notes</div>
        </div>
        <div class="empty-state">
          No notes yet. Click on a line number in the diff to add a note.
        </div>
      `;
    }

    const groupedNotes = this.groupNotesByFile();

    return html`
      <div class="header">
        <div class="title">Notes (${this.notes.length})</div>
      </div>
      <div class="notes-list">
        ${Array.from(groupedNotes.entries()).map(
          ([file, notes]) => html`
            <div class="note-group">
              <div class="file-name">${file}</div>
              ${notes.map(
                (note) => html`
                  <div class="note-item">
                    <div class="note-header">
                      <span class="line-number">Line ${note.line}</span>
                      <div class="note-actions">
                        <button
                          class="action-btn delete-btn"
                          @click=${() => this.handleDelete(note)}
                          title="Delete note"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                    ${note.lineContent
                      ? html`
                          <div class="line-content">${note.lineContent}</div>
                        `
                      : ''}
                    <div class="note-text">${note.text}</div>
                  </div>
                `
              )}
            </div>
          `
        )}
      </div>
    `;
  }
}
