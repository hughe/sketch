import { html, css } from 'lit';
import { DiffReviewerElement } from './diffreviewer-element.js';
import { customElement, state } from 'lit/decorators.js';
import { fetchNotes, updateGeneralNotes } from '../services/notes';
import { shutdown } from '../services/api';
import type { Note } from '../types';
import './diff-viewer';
import './notes-panel';
import './general-notes-input';
import './done-button';

@customElement('app-shell')
export class AppShell extends DiffReviewerElement {
  @state() private notes: Note[] = [];
  @state() private generalNotes: string = '';
  @state() private showNotesPanel: boolean = false;

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100vh;
      overflow: hidden;
    }

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem;
      border-bottom: 1px solid #e5e7eb;
      background: white;
      flex-shrink: 0;
    }

    .title {
      font-size: 1.5rem;
      font-weight: 600;
      color: #111827;
    }

    .header-actions {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .notes-toggle {
      padding: 0.5rem 1rem;
      background: #f3f4f6;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      cursor: pointer;
      font-size: 0.875rem;
    }

    .notes-toggle:hover {
      background: #e5e7eb;
    }

    .notes-toggle.active {
      background: #3b82f6;
      color: white;
      border-color: #3b82f6;
    }

    .main-content {
      display: flex;
      flex: 1;
      overflow: hidden;
    }

    .diff-section {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .notes-section {
      width: 350px;
      border-left: 1px solid #e5e7eb;
      background: #f9fafb;
      flex-shrink: 0;
    }

    .general-notes-section {
      border-top: 1px solid #e5e7eb;
      background: white;
      flex-shrink: 0;
    }

    @media (max-width: 768px) {
      .notes-section {
        position: absolute;
        right: 0;
        top: 0;
        bottom: 0;
        width: 100%;
        max-width: 400px;
        z-index: 10;
        box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
      }
    }
  `;

  async connectedCallback() {
    super.connectedCallback();
    await this.loadNotes();
  }

  private async loadNotes() {
    try {
      const notesResponse = await fetchNotes();
      this.notes = notesResponse.lineNotes;
      this.generalNotes = notesResponse.generalNotes;
    } catch (err) {
      console.error('Error loading notes:', err);
    }
  }

  private toggleNotesPanel() {
    this.showNotesPanel = !this.showNotesPanel;
    this.requestUpdate();
  }

  private handleLineClick(e: CustomEvent) {
    // Forward to notes panel or show note creation dialog
    console.log('Line clicked:', e.detail);
    this.showNotesPanel = true;
  }

  private async handleGeneralNotesChange(e: CustomEvent) {
    this.generalNotes = e.detail.text;
    try {
      await updateGeneralNotes(this.generalNotes);
    } catch (err) {
      console.error('Error saving general notes:', err);
    }
  }

  private async handleDone() {
    if (!confirm('Save notes and exit DiffReviewer?')) {
      return;
    }

    try {
      await shutdown(this.generalNotes);
      // Show shutting down message
      document.body.innerHTML =
        '<div style="display: flex; align-items: center; justify-content: center; height: 100vh; font-size: 1.5rem; color: #6b7280;">Shutting down...</div>';
    } catch (err) {
      alert('Error during shutdown: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  }

  private handleNotesUpdate() {
    this.loadNotes();
  }

  render() {
    return html`
      <div class="header">
        <div class="title">DiffReviewer</div>
        <div class="header-actions">
          <button
            class="notes-toggle ${this.showNotesPanel ? 'active' : ''}"
            @click=${this.toggleNotesPanel}
          >
            ${this.showNotesPanel ? 'Hide' : 'Show'} Notes
            ${this.notes.length > 0 ? `(${this.notes.length})` : ''}
          </button>
          <done-button @done=${this.handleDone}></done-button>
        </div>
      </div>
      <div class="main-content">
        <div class="diff-section">
          <diff-viewer @line-click=${this.handleLineClick}></diff-viewer>
          <div class="general-notes-section">
            <general-notes-input
              .value=${this.generalNotes}
              @notes-change=${this.handleGeneralNotesChange}
            ></general-notes-input>
          </div>
        </div>
        ${this.showNotesPanel
          ? html`
              <div class="notes-section">
                <notes-panel
                  .notes=${this.notes}
                  @notes-update=${this.handleNotesUpdate}
                ></notes-panel>
              </div>
            `
          : ''}
      </div>
    `;
  }
}
