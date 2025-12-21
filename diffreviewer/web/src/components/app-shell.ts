import { html, css } from 'lit';
import { DiffReviewerElement } from './diffreviewer-element.js';
import { customElement, state } from 'lit/decorators.js';
import { fetchNotes, updateGeneralNotes } from '../services/notes';
import { shutdown } from '../services/api';
import './diff-viewer';
import './general-notes-input';
import './done-button';
import './range-picker';
import type { DiffRange } from './range-picker';

@customElement('app-shell')
export class AppShell extends DiffReviewerElement {
  @state() private generalNotes: string = '';
  @state() private currentRange: DiffRange | null = null;

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



    .general-notes-section {
      border-top: 1px solid #e5e7eb;
      background: white;
      flex-shrink: 0;
    }


  `;

  async connectedCallback() {
    super.connectedCallback();
    await this.loadGeneralNotes();
  }

  private async loadGeneralNotes() {
    try {
      const notesResponse = await fetchNotes();
      this.generalNotes = notesResponse.generalNotes;
    } catch (err) {
      console.error('Error loading notes:', err);
    }
  }

  private handleNoteAdded(e: CustomEvent) {
    // When a note is added from monaco-view, append it to general notes
    const { formattedNote } = e.detail;
    console.log('Note added:', formattedNote);
    
    // Append to general notes with a newline separator
    if (this.generalNotes.trim()) {
      this.generalNotes += '\n\n' + formattedNote;
    } else {
      this.generalNotes = formattedNote;
    }
    
    this.requestUpdate();
  }

  private handleRangeChange(e: CustomEvent) {
    this.currentRange = e.detail.range;
    console.log('Range changed:', this.currentRange);
    
    // Call loadDiffForRange directly instead of relying on property binding
    // This works around Lit reactivity issues when Shadow DOM is disabled
    const diffViewer = this.querySelector('diff-viewer') as any;
    if (diffViewer && diffViewer.loadDiffForRange) {
      diffViewer.loadDiffForRange(this.currentRange);
    }
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
      // Save general notes to server before shutdown
      await updateGeneralNotes(this.generalNotes);
      await shutdown(this.generalNotes);
      // Show shutting down message
      document.body.innerHTML =
        '<div style="display: flex; align-items: center; justify-content: center; height: 100vh; font-size: 1.5rem; color: #6b7280;">Shutting down...</div>';
    } catch (err) {
      alert('Error during shutdown: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  }

  render() {
    return html`
      <div class="header">
        <div class="title">DiffReviewer</div>
        <div class="header-actions">
          <done-button @done=${this.handleDone}></done-button>
        </div>
      </div>
      <div class="main-content">
        <div class="diff-section">
          <range-picker @range-change=${this.handleRangeChange}></range-picker>
          <diff-viewer
            .currentRange=${this.currentRange}
            @note-added=${this.handleNoteAdded}
          ></diff-viewer>
          <div class="general-notes-section">
            <general-notes-input
              .value=${this.generalNotes}
              @notes-change=${this.handleGeneralNotesChange}
            ></general-notes-input>
          </div>
        </div>
      </div>
    `;
  }
}
