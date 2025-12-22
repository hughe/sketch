import { html, css } from 'lit';
import { DiffReviewerElement } from './diffreviewer-element.js';
import { customElement } from 'lit/decorators.js';

@customElement('done-button')
export class DoneButton extends DiffReviewerElement {
  static styles = css`
    :host {
      display: flex;
      align-items: center;
    }

    button {
      padding: 0.75rem 2rem;
      background: #2563eb;
      color: white;
      border: none;
      border-radius: 0.5rem;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      white-space: nowrap;
    }

    button:hover {
      background: #1d4ed8;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.15);
      transform: translateY(-1px);
    }

    button:active {
      background: #1e40af;
      transform: translateY(0);
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
