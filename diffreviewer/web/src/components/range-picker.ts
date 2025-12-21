import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { DiffReviewerElement } from './diffreviewer-element.js';
import { fetchCommitHistory, fetchBaseCommit } from '../services/api';
import type { GitLogEntry } from '../types';

export interface DiffRange {
  type: 'range';
  from: string;
  to: string;
}

@customElement('range-picker')
export class RangePicker extends DiffReviewerElement {
  @property({ type: Array })
  commits: GitLogEntry[] = [];

  @property({ attribute: false })
  private fromCommit: string = '';

  @property({ attribute: false })
  private toCommit: string = '';

  @property({ attribute: false })
  private dropdownOpen: boolean = false;

  @property({ attribute: false })
  private loading: boolean = true;

  @property({ attribute: false })
  private error: string | null = null;

  static styles = css`
    :host {
      display: block;
      width: 100%;
    }

    .container {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .range-selectors {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex: 1;
      position: relative;
    }

    label {
      font-weight: 500;
      font-size: 0.875rem;
      color: #374151;
      white-space: nowrap;
    }

    .dropdown-container {
      position: relative;
      flex: 1;
      min-width: 300px;
    }

    .dropdown-button {
      width: 100%;
      padding: 0.5rem 0.75rem;
      padding-right: 2rem;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      text-align: left;
      min-height: 36px;
      font-size: 0.875rem;
      cursor: pointer;
      background: white;
      color: #111827;
      position: relative;
    }

    .dropdown-button:hover {
      border-color: #9ca3af;
    }

    .dropdown-button:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .dropdown-arrow {
      position: absolute;
      right: 0.5rem;
      top: 50%;
      transform: translateY(-50%);
      transition: transform 0.2s;
      width: 12px;
      height: 12px;
    }

    .dropdown-arrow.open {
      transform: translateY(-50%) rotate(180deg);
    }

    .dropdown-menu {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: white;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      z-index: 50;
      max-height: 300px;
      overflow-y: auto;
      margin-top: 0.25rem;
    }

    .dropdown-item {
      padding: 0.625rem 0.75rem;
      cursor: pointer;
      border-bottom: 1px solid #f3f4f6;
      display: flex;
      align-items: start;
      gap: 0.5rem;
      font-size: 0.875rem;
      line-height: 1.25;
    }

    .dropdown-item:last-child {
      border-bottom: none;
    }

    .dropdown-item:hover {
      background: #f9fafb;
    }

    .dropdown-item.selected {
      background: #eff6ff;
    }

    .commit-hash {
      font-family: monospace;
      color: #6b7280;
      font-size: 0.75rem;
    }

    .commit-subject {
      color: #111827;
      font-size: 0.75rem;
      flex: 1;
      min-width: 200px;
      word-break: break-word;
    }

    .commit-refs {
      display: flex;
      gap: 0.25rem;
      flex-wrap: wrap;
      flex-shrink: 0;
    }

    .ref-badge {
      padding: 0.125rem 0.375rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .ref-badge.branch {
      background: #dcfce7;
      color: #166534;
    }

    .ref-badge.tag {
      background: #fef3c7;
      color: #92400e;
    }

    .loading, .error {
      font-style: italic;
      color: #6b7280;
      font-size: 0.875rem;
    }

    .error {
      color: #dc2626;
    }

    .commit-button-content {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding-right: 1.5rem;
    }
  `;

  async connectedCallback() {
    super.connectedCallback();
    await this.loadCommits();
  }

  private async loadCommits() {
    this.loading = true;
    this.error = null;

    try {
      // Get base commit reference
      const baseCommitRef = await fetchBaseCommit();
      
      // Load commit history
      this.commits = await fetchCommitHistory(baseCommitRef);

      if (this.commits.length > 0) {
        // Default to second most recent commit (HEAD~1) as from
        // This matches the CLI default behavior  
        if (this.commits.length >= 2) {
          this.fromCommit = this.commits[1].hash;
        } else {
          this.fromCommit = this.commits[0].hash;
        }
        // Default to HEAD (most recent) as to
        this.toCommit = this.commits[0].hash;
        
        // Dispatch initial range event
        this.dispatchRangeEvent();
      }
    } catch (err) {
      console.error('Error loading commits:', err);
      this.error = err instanceof Error ? err.message : 'Failed to load commits';
    } finally {
      this.loading = false;
      this.requestUpdate();
    }
  }

  private toggleDropdown(e: Event) {
    e.stopPropagation();
    this.dropdownOpen = !this.dropdownOpen;
    // Explicitly request update since Shadow DOM is disabled
    this.requestUpdate();

    if (this.dropdownOpen) {
      setTimeout(() => {
        document.addEventListener('click', this.closeDropdown, { once: true });
      }, 0);
    }
  }

  private closeDropdown = () => {
    this.dropdownOpen = false;
    // Explicitly request update since Shadow DOM is disabled
    this.requestUpdate();
  };

  private selectCommit(hash: string) {
    this.fromCommit = hash;
    this.dropdownOpen = false;
    // Explicitly request update since Shadow DOM is disabled
    this.requestUpdate();
    this.dispatchRangeEvent();
  }

  private dispatchRangeEvent() {
    const range: DiffRange = {
      type: 'range',
      from: this.fromCommit,
      to: this.toCommit,
    };

    const event = new CustomEvent('range-change', {
      detail: { range },
      bubbles: true,
      composed: true,
    });

    this.dispatchEvent(event);
  }

  private getShortHash(hash: string): string {
    return hash.substring(0, 8);
  }

  private getShortRefName(ref: string): string {
    if (ref.startsWith('refs/heads/')) {
      return ref.substring(11);
    }
    if (ref.startsWith('refs/remotes/origin/')) {
      return ref.substring(20);
    }
    if (ref.startsWith('refs/tags/')) {
      return ref.substring(10);
    }
    if (ref.startsWith('HEAD -> ')) {
      return ref.substring(8);
    }
    return ref;
  }

  private isTag(ref: string): boolean {
    return ref.includes('tag:') || ref.startsWith('refs/tags/');
  }

  render() {
    if (this.loading) {
      return html`<div class="loading">Loading commits...</div>`;
    }

    if (this.error) {
      return html`<div class="error">${this.error}</div>`;
    }

    const selectedCommit = this.commits.find((c) => c.hash === this.fromCommit);

    return html`
      <div class="container">
        <div class="range-selectors">
          <label>Diff from:</label>
          <div class="dropdown-container">
            <button
              class="dropdown-button"
              @click=${this.toggleDropdown}
              @blur=${() => setTimeout(() => this.closeDropdown(), 150)}
            >
              <div class="commit-button-content">
                ${selectedCommit
                  ? html`
                      <span class="commit-hash"
                        >${this.getShortHash(selectedCommit.hash)}</span
                      >
                      <span class="commit-subject"
                        >${selectedCommit.subject}</span
                      >
                    `
                  : 'Select commit...'}
              </div>
              <svg
                class="dropdown-arrow ${this.dropdownOpen ? 'open' : ''}"
                viewBox="0 0 12 12"
              >
                <path d="M6 8l-4-4h8z" fill="currentColor" />
              </svg>
            </button>
            ${this.dropdownOpen
              ? html`
                  <div class="dropdown-menu">
                    ${this.commits.map(
                      (commit) => html`
                        <div
                          class="dropdown-item ${commit.hash === this.fromCommit
                            ? 'selected'
                            : ''}"
                          @click=${() => this.selectCommit(commit.hash)}
                        >
                          <span class="commit-hash"
                            >${this.getShortHash(commit.hash)}</span
                          >
                          <span class="commit-subject">${commit.subject}</span>
                          ${commit.refs && commit.refs.length > 0
                            ? html`
                                <div class="commit-refs">
                                  ${commit.refs.map((ref) => {
                                    const shortRef = this.getShortRefName(ref);
                                    const refClass = this.isTag(ref)
                                      ? 'tag'
                                      : 'branch';
                                    return html`<span
                                      class="ref-badge ${refClass}"
                                      >${shortRef}</span
                                    >`;
                                  })}
                                </div>
                              `
                            : ''}
                        </div>
                      `
                    )}
                  </div>
                `
              : ''}
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'range-picker': RangePicker;
  }
}
