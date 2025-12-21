import { html, css, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { createRef, Ref, ref } from 'lit/directives/ref.js';
import type * as monaco from 'monaco-editor';

// Monaco is loaded dynamically
declare global {
  interface Window {
    monaco?: typeof monaco;
  }
}

let monacoLoadPromise: Promise<any> | null = null;

function loadMonaco(): Promise<typeof monaco> {
  if (monacoLoadPromise) {
    return monacoLoadPromise;
  }

  if (window.monaco) {
    return Promise.resolve(window.monaco);
  }

  monacoLoadPromise = import('monaco-editor').then((monaco) => {
    window.monaco = monaco;
    return monaco;
  });

  return monacoLoadPromise;
}

@customElement('monaco-view')
export class MonacoView extends LitElement {
  @property({ type: Boolean, attribute: 'editable-right' })
  editableRight = true;

  @property() originalCode?: string = '';
  @property() modifiedCode?: string = '';
  @property() originalFilename?: string = 'original';
  @property() modifiedFilename?: string = 'modified';
  @property() theme: 'light' | 'dark' = 'light';

  @state() private saveState: 'idle' | 'modified' | 'saving' | 'saved' = 'idle';
  @state() private lastSavedContent: string = '';

  private container: Ref<HTMLElement> = createRef();
  private editor?: monaco.editor.IStandaloneDiffEditor;
  private originalModel?: monaco.editor.ITextModel;
  private modifiedModel?: monaco.editor.ITextModel;
  private modifiedDecorations?: monaco.editor.IEditorDecorationsCollection;

  static styles = css`
    :host {
      display: block;
      width: 100%;
      height: 100%;
      position: relative;
    }

    .monaco-container {
      width: 100%;
      height: 100%;
    }

    /* Monaco diff colors - must be in shadow DOM */
    .monaco-editor .char-insert {
      background-color: rgba(155, 185, 85, 0.4) !important;
    }
    
    .monaco-editor .char-delete {
      background-color: rgba(255, 0, 0, 0.4) !important;
    }
    
    .monaco-editor .line-insert {
      background-color: rgba(155, 185, 85, 0.2) !important;
    }
    
    .monaco-editor .line-delete {
      background-color: rgba(255, 0, 0, 0.2) !important;
    }

    /* Line numbers and gutter visibility */
    .monaco-editor .margin,
    .monaco-editor .glyph-margin {
      background-color: #f5f5f5 !important;
    }
    
    .monaco-editor .margin-view-overlays .line-numbers {
      color: #237893 !important;
      font-weight: 600 !important;
    }
    
    .monaco-editor .margin-view-overlays .line-numbers.active-line-number {
      color: #0B216F !important;
    }

    .save-indicator {
      position: absolute;
      top: 8px;
      right: 8px;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      z-index: 1000;
      pointer-events: none;
    }

    .save-indicator.modified {
      background: #fef3c7;
      color: #92400e;
    }

    .save-indicator.saving {
      background: #dbeafe;
      color: #1e40af;
    }

    .save-indicator.saved {
      background: #d1fae5;
      color: #065f46;
    }

    .comment-glyph {
      cursor: pointer;
      opacity: 0.7;
    }

    .comment-glyph:hover {
      opacity: 1;
    }
  `;

  private getLanguageForFile(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    const langMap: Record<string, string> = {
      js: 'javascript',
      jsx: 'javascript',
      ts: 'typescript',
      tsx: 'typescript',
      json: 'json',
      html: 'html',
      css: 'css',
      scss: 'scss',
      md: 'markdown',
      py: 'python',
      go: 'go',
      rs: 'rust',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      sh: 'shell',
      yaml: 'yaml',
      yml: 'yaml',
      xml: 'xml',
      sql: 'sql',
    };
    return langMap[ext] || 'plaintext';
  }

  private requestSave() {
    if (!this.editableRight || this.saveState !== 'modified') return;

    this.saveState = 'saving';
    const modifiedContent = this.modifiedModel?.getValue() || '';

    const saveEvent = new CustomEvent('monaco-save', {
      detail: {
        path: this.modifiedFilename,
        content: modifiedContent,
      },
      bubbles: true,
      composed: true,
    });

    this.dispatchEvent(saveEvent);
  }

  public notifySaveComplete(success: boolean) {
    if (success) {
      this.saveState = 'saved';
      this.lastSavedContent = this.modifiedModel?.getValue() || '';
      setTimeout(() => {
        this.saveState = 'idle';
      }, 2000);
    } else {
      this.saveState = 'modified';
    }
  }

  private setupKeyboardShortcuts() {
    if (!this.editor) return;

    const modifiedEditor = this.editor.getModifiedEditor();
    if (!modifiedEditor) return;

    modifiedEditor.addCommand(
      window.monaco!.KeyMod.CtrlCmd | window.monaco!.KeyCode.KeyS,
      () => {
        this.requestSave();
      }
    );
  }

  private setupContentChangeListener() {
    if (!this.modifiedModel || !this.editableRight) return;

    this.modifiedModel.onDidChangeContent(() => {
      const currentContent = this.modifiedModel?.getValue() || '';
      if (currentContent !== this.lastSavedContent) {
        this.saveState = 'modified';
      }
    });
  }

  private setupLineClickListener() {
    if (!this.editor) return;

    const modifiedEditor = this.editor.getModifiedEditor();
    if (!modifiedEditor) return;

    // Listen for mouse clicks on line numbers
    modifiedEditor.onMouseDown((e) => {
      if (e.target.type === window.monaco!.editor.MouseTargetType.GUTTER_LINE_NUMBERS) {
        const lineNumber = e.target.position?.lineNumber;
        if (lineNumber) {
          const lineContent = this.modifiedModel?.getLineContent(lineNumber) || '';
          
          const event = new CustomEvent('line-click', {
            detail: {
              line: lineNumber,
              lineContent,
              file: this.modifiedFilename,
            },
            bubbles: true,
            composed: true,
          });
          
          this.dispatchEvent(event);
        }
      }
    });
  }

  public updateNoteDecorations(linesWithNotes: number[]) {
    const monaco = window.monaco;
    if (!this.editor || !monaco) return;

    const modifiedEditor = this.editor.getModifiedEditor();
    if (!modifiedEditor || !this.modifiedDecorations) return;

    const decorations = linesWithNotes.map((line) => ({
      range: new monaco.Range(line, 1, line, 1),
      options: {
        isWholeLine: false,
        glyphMarginClassName: 'comment-glyph',
        glyphMarginHoverMessage: { value: 'Note on this line' },
      },
    }));

    this.modifiedDecorations.set(decorations);
  }

  private async initializeEditor() {
    const monaco = await loadMonaco();
    if (!this.container.value || this.editor) return;

    const originalLang = this.getLanguageForFile(this.originalFilename || '');
    const modifiedLang = this.getLanguageForFile(this.modifiedFilename || '');

    // Create models with unique URIs based on timestamp to avoid conflicts
    const timestamp = new Date().getTime();
    const originalUri = monaco.Uri.parse(
      `file:///original-${timestamp}.${originalLang}`
    );
    const modifiedUri = monaco.Uri.parse(
      `file:///modified-${timestamp}.${modifiedLang}`
    );

    this.originalModel = monaco.editor.createModel(
      this.originalCode || '',
      originalLang,
      originalUri
    );
    this.modifiedModel = monaco.editor.createModel(
      this.modifiedCode || '',
      modifiedLang,
      modifiedUri
    );

    this.lastSavedContent = this.modifiedCode || '';

    this.editor = monaco.editor.createDiffEditor(this.container.value, {
      automaticLayout: true,
      renderSideBySide: true,
      theme: this.theme === 'dark' ? 'vs-dark' : 'vs',
      ignoreTrimWhitespace: false,
      diffAlgorithm: 'advanced',
      experimental: { showMoves: true },
      glyphMargin: true,
      renderOverviewRuler: true,
      scrollBeyondLastLine: true,
      hideUnchangedRegions: {
        enabled: true,
        contextLineCount: 5,
        minimumLineCount: 3,
        revealLineCount: 10,
      },
    });

    this.editor.setModel({
      original: this.originalModel,
      modified: this.modifiedModel,
    });

    // Configure both editors explicitly
    const modifiedEditor = this.editor.getModifiedEditor();
    const originalEditor = this.editor.getOriginalEditor();
    
    const editorOptions = {
      lineNumbers: 'on' as const,
      glyphMargin: true,
      folding: true,
      scrollBeyondLastLine: false,
      minimap: { enabled: true },
      fontSize: 14,
      renderWhitespace: 'selection' as const,
    };
    
    if (originalEditor) {
      originalEditor.updateOptions({
        ...editorOptions,
        readOnly: true,
      });
    }
    
    if (modifiedEditor) {
      modifiedEditor.updateOptions({
        ...editorOptions,
        readOnly: !this.editableRight,
      });

      this.modifiedDecorations =
        modifiedEditor.createDecorationsCollection([]);
    }

    this.setupKeyboardShortcuts();
    this.setupContentChangeListener();
    this.setupLineClickListener();
  }

  private updateModels() {
    if (!this.originalModel || !this.modifiedModel) return;

    const language = this.getLanguageForFile(this.modifiedFilename || '');
    const monaco = window.monaco;
    if (!monaco) return;

    monaco.editor.setModelLanguage(this.originalModel, language);
    monaco.editor.setModelLanguage(this.modifiedModel, language);

    this.originalModel.setValue(this.originalCode || '');
    this.modifiedModel.setValue(this.modifiedCode || '');
    this.lastSavedContent = this.modifiedCode || '';
    this.saveState = 'idle';
  }

  async updated(changedProperties: Map<string, any>) {
    if (
      changedProperties.has('originalCode') ||
      changedProperties.has('modifiedCode') ||
      changedProperties.has('originalFilename') ||
      changedProperties.has('modifiedFilename')
    ) {
      this.updateModels();
    }

    if (changedProperties.has('theme')) {
      if (this.editor && window.monaco) {
        const monaco = window.monaco;
        if (monaco) {
          monaco.editor.setTheme(
            this.theme === 'dark' ? 'vs-dark' : 'vs'
          );
        }
      }
    }
  }

  async firstUpdated() {
    await this.initializeEditor();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.editor?.dispose();
    this.originalModel?.dispose();
    this.modifiedModel?.dispose();
  }

  render() {
    return html`
      ${this.saveState !== 'idle'
        ? html`
            <div class="save-indicator ${this.saveState}">
              ${this.saveState === 'modified'
                ? 'Modified'
                : this.saveState === 'saving'
                  ? 'Saving...'
                  : 'Saved'}
            </div>
          `
        : ''}
      <div class="monaco-container" ${ref(this.container)}></div>
    `;
  }
}
