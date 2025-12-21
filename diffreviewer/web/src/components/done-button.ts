import { html, css } from 'lit';
import { DiffReviewerElement } from './diffreviewer-element.js';
import { customElement } from 'lit/decorators.js';

@customElement('done-button')
export class DoneButton extends DiffReviewerElement {
  static styles = css`
    button {
      padding: 0.5rem 1.5rem;
      background: #10b981;
      color: white;
      border: none;
      border-radius: 0.375rem;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s;
    }

    button:hover {
      background: #059669;
    }

    button:active {
      background: #047857;
    }
  `;

  private handleClick() {
    const event = new CustomEvent('done', {
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }

  render() {
    return html`<button @click=${this.handleClick}>Done</button>`;
  }
}
