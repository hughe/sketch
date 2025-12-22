import { html, css } from 'lit';
import { DiffReviewerElement } from './diffreviewer-element.js';
import { customElement, property } from 'lit/decorators.js';

@customElement('general-notes-input')
export class GeneralNotesInput extends DiffReviewerElement {
  @property({ type: String }) value = '';

  private debounceTimeout: number | null = null;

  static styles = css`
    :host {
      display: block;
      flex: 1;
    }

    .container {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      height: 100%;
    }

    .label {
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
    }

    textarea {
      width: 100%;
      min-height: 100px;
      padding: 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      font-size: 0.875rem;
      font-family: inherit;
      resize: vertical;
      flex: 1;
    }

    textarea:focus {
      outline: none;
      border-color: #3b82f6;
      ring: 2px solid #93c5fd;
    }

    textarea::placeholder {
      color: #9ca3af;
    }
  `;

  private handleInput(e: Event) {
    const textarea = e.target as HTMLTextAreaElement;
    this.value = textarea.value;

    // Debounce the change event
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }

    this.debounceTimeout = window.setTimeout(() => {
      const event = new CustomEvent('notes-change', {
        detail: { text: this.value },
        bubbles: true,
        composed: true,
      });
      this.dispatchEvent(event);
    }, 500);
  }

  render() {
    return html`
      <div class="container">
        <div class="label">General Review Notes</div>
        <textarea
          .value=${this.value}
          @input=${this.handleInput}
          placeholder="Add general review notes here..."
        ></textarea>
      </div>
    `;
  }
}
