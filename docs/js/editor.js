class CVEditor {
  constructor() {
    this.cvData = {};
    this.template = '';

    this.init();
  }

  // localStorage methods
  saveToStorage(key, data) {
    try {
      const storageKey = `cvgen_${key}`;
      localStorage.setItem(storageKey, JSON.stringify(data));

      // Show brief saving indicator for cvData
      if (key === 'cvData') {
        this.showSavingIndicator();
      }
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  }

  showSavingIndicator() {
    // Create or update saving indicator
    let indicator = document.getElementById('savingIndicator');
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'savingIndicator';
      indicator.className = 'saving-indicator';
      indicator.innerHTML = '<i class="fas fa-save"></i> Saved';
      document.body.appendChild(indicator);
    }

    // Show and hide the indicator
    indicator.classList.add('show');
    clearTimeout(this.savingTimeout);
    this.savingTimeout = setTimeout(() => {
      indicator.classList.remove('show');
    }, 1500);
  }

  loadFromStorage(key) {
    try {
      const storageKey = `cvgen_${key}`;
      const data = localStorage.getItem(storageKey);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.warn('Failed to load from localStorage:', error);
      return null;
    }
  }

  async init() {
    this.setupEventListeners();

    const urlParams = new URLSearchParams(window.location.search);
    const dataParam = urlParams.get('data');

    if (dataParam === 'localStorage') {
      // Force use localStorage only
      const stored = this.loadFromStorage('cvData');
      this.cvData = stored || {};
    } else if (dataParam) {
      // Load from external URL only
      await this.loadFromUrl(dataParam, false);
    } else {
      // Current behavior: localStorage first, then external URL fallback
      const stored = this.loadFromStorage('cvData');
      if (stored) {
        this.cvData = stored;
      } else {
        await this.loadFromUrl('https://raw.githubusercontent.com/jobpare/cvgen/main/docs/cv-json-example/backend-cv-schema.json', false);
      }
    }

    // Always load template after data loading
    await this.loadTemplate();

    this.generateForm();
    this.updateFormFromData();
    this.updateJSON();
    this.generatePreview();
  }

  setupEventListeners() {

    // View toggle
    document.getElementById('toggleView').addEventListener('click', () => {
      this.toggleView();
    });

    // View toggle from JSON panel
    document.getElementById('toggleViewFromJson').addEventListener('click', () => {
      this.toggleView();
    });

    // JSON editor
    document.getElementById('jsonEditor').addEventListener('input', (e) => {
      this.updateFromJSON(e.target.value);
    });

    // Format JSON
    document.getElementById('formatJson').addEventListener('click', () => {
      this.formatJSON();
    });

    // Refresh preview
    document.getElementById('refreshPreview').addEventListener('click', () => {
      this.generatePreview();
    });

    // Validate
    document.getElementById('validateBtn').addEventListener('click', () => {
      this.validateData();
    });

    // Download
    document.getElementById('downloadBtn').addEventListener('click', () => {
      this.downloadJSON();
    });

    // Load file
    document.getElementById('loadFileBtn').addEventListener('click', () => {
      document.getElementById('fileInput').click();
    });

    document.getElementById('fileInput').addEventListener('change', (e) => {
      this.loadFile(e.target.files[0]);
    });

    // Generate PDF
    document.getElementById('generatePDFBtn').addEventListener('click', () => {
      this.generatePDF();
    });
  }

  async loadTemplate() {
    if (!this.template) {
      try {
        const templateResponse = await fetch('cv-templates/template-1.html');
        if (!templateResponse.ok) {
          throw new Error(`Failed to load template: ${templateResponse.status}`);
        }
        this.template = await templateResponse.text();
      } catch (error) {
        console.error('Error loading template:', error.message);
        this.showValidationMessage(`Error loading template: ${error.message}`, 'error');
      }
    }
  }

  async loadFromUrl(url, saveToStorage = false) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to load data: ${response.status}`);
      }
      const cvData = await response.json();

      // Set data
      this.cvData = cvData;

      // Only save to localStorage if explicitly requested (never for URL/default loads)
      if (saveToStorage) {
        this.saveToStorage('cvData', this.cvData);
      }

    } catch (error) {
      console.error('Error loading data from URL:', error.message);
      this.showValidationMessage(`Error loading data: ${error.message}`, 'error');
    }
  }

  generateForm() {
    const formEditor = document.getElementById('formEditor');
    formEditor.innerHTML = '';

    // Generate form based on schema
    const sections = this.getFormSections();

    sections.forEach(section => {
      const sectionDiv = document.createElement('div');
      sectionDiv.className = 'form-section';

      const sectionTitle = document.createElement('h4');
      sectionTitle.textContent = section.title;
      sectionDiv.appendChild(sectionTitle);

      section.fields.forEach(field => {
        const fieldDiv = this.createFormField(field);
        sectionDiv.appendChild(fieldDiv);
      });

      formEditor.appendChild(sectionDiv);
    });

    // Add event listeners to form fields
    this.addFormEventListeners();
  }

  getFormSections() {
    const sections = [];

    // Profile (formerly Personal Information)
    sections.push({
      title: 'Profile',
      fields: [
        { name: 'profile.name', label: 'Full Name', type: 'text', required: true },
        { name: 'profile.position', label: 'Position', type: 'text', required: true },
        { name: 'profile.seniority_level', label: 'Seniority Level', type: 'text' },
        { name: 'profile.email', label: 'Email', type: 'email', required: true },
        { name: 'profile.phone', label: 'Phone', type: 'text' },
        { name: 'profile.location', label: 'Location', type: 'text' },
        { name: 'profile.linkedin', label: 'LinkedIn', type: 'url' },
        { name: 'profile.github', label: 'GitHub', type: 'url' },
        { name: 'profile.website', label: 'Website', type: 'url' }
      ]
    });

    // Summary (now flat string)
    sections.push({
      title: 'Professional Summary',
      fields: [
        { name: 'summary', label: 'Summary', type: 'textarea', help: '2-3 sentences about your background and career goals' }
      ]
    });

    // Experiences (renamed from experience)
    sections.push({
      title: 'Work Experiences',
      fields: [
        { name: 'experiences', label: 'Experiences (JSON array)', type: 'textarea', help: 'Enter as JSON array of experience objects' }
      ]
    });

    // Education
    sections.push({
      title: 'Education',
      fields: [
        { name: 'education', label: 'Education (JSON array)', type: 'textarea', help: 'Enter as JSON array of education objects (uses end_date instead of graduation_date)' }
      ]
    });

    // Skills
    sections.push({
      title: 'Skills',
      fields: [
        { name: 'skills', label: 'Skills (JSON object)', type: 'textarea', help: 'Enter as JSON object with skill categories' }
      ]
    });

    // Projects
    sections.push({
      title: 'Projects',
      fields: [
        { name: 'projects', label: 'Projects (JSON array)', type: 'textarea', help: 'Enter as JSON array of project objects' }
      ]
    });

    // Certifications
    sections.push({
      title: 'Certifications',
      fields: [
        { name: 'certifications', label: 'Certifications (JSON array)', type: 'textarea', help: 'Enter as JSON array of certification objects' }
      ]
    });

    // Languages
    sections.push({
      title: 'Languages',
      fields: [
        { name: 'languages', label: 'Languages (JSON array)', type: 'textarea', help: 'Enter as JSON array of language objects' }
      ]
    });

    return sections;
  }

  createFormField(field) {
    const fieldDiv = document.createElement('div');
    fieldDiv.className = 'form-group';

    const label = document.createElement('label');
    label.textContent = field.label;
    if (field.required) {
      label.innerHTML += ' <span style="color: red;">*</span>';
    }
    fieldDiv.appendChild(label);

    let input;
    if (field.type === 'textarea') {
      input = document.createElement('textarea');
      input.rows = 4;
    } else {
      input = document.createElement('input');
      input.type = field.type;
    }

    input.className = 'form-control';
    input.name = field.name;
    input.dataset.field = field.name;

    // Set value from current data (handle nested fields)
    const fieldValue = this.getNestedValue(this.cvData, field.name);
    if (fieldValue !== undefined) {
      if (typeof fieldValue === 'object') {
        input.value = JSON.stringify(fieldValue, null, 2);
      } else {
        input.value = fieldValue;
      }
    }

    fieldDiv.appendChild(input);

    if (field.help) {
      const helpText = document.createElement('small');
      helpText.style.color = '#6c757d';
      helpText.textContent = field.help;
      fieldDiv.appendChild(helpText);
    }

    return fieldDiv;
  }

  addFormEventListeners() {
    const formFields = document.querySelectorAll('.form-control');
    formFields.forEach(field => {
      field.addEventListener('input', (e) => {
        this.updateDataFromForm(e.target);
      });
    });
  }

  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  setNestedValue(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => {
      if (!current[key]) {
        current[key] = {};
      }
      return current[key];
    }, obj);
    target[lastKey] = value;
  }

  updateDataFromForm(field) {
    const fieldName = field.dataset.field;
    let value = field.value;

    // Try to parse JSON for complex fields
    if (field.tagName === 'TEXTAREA' && !fieldName.includes('.')) {
      try {
        value = JSON.parse(field.value);
      } catch (e) {
        // Keep as string if parsing fails
      }
    }

    this.setNestedValue(this.cvData, fieldName, value);

    // Save to localStorage whenever data changes
    this.saveToStorage('cvData', this.cvData);

    this.updateJSON();
    this.generatePreview();
  }

  updateJSON() {
    const jsonEditor = document.getElementById('jsonEditor');
    jsonEditor.value = JSON.stringify(this.cvData, null, 2);
  }

  updateFromJSON(jsonText) {
    try {
      const newData = JSON.parse(jsonText);
      this.cvData = newData;

      // Save to localStorage whenever JSON is updated
      this.saveToStorage('cvData', this.cvData);

      this.updateFormFromData();
      this.generatePreview();
    } catch (e) {
      // Invalid JSON, don't update
      this.showValidationMessage('❌ Invalid JSON format', 'error');
    }
  }

  updateFormFromData() {
    const formFields = document.querySelectorAll('.form-control');
    formFields.forEach(field => {
      const fieldName = field.dataset.field;
      const fieldValue = this.getNestedValue(this.cvData, fieldName);
      if (fieldValue !== undefined) {
        if (typeof fieldValue === 'object') {
          field.value = JSON.stringify(fieldValue, null, 2);
        } else {
          field.value = fieldValue;
        }
      }
    });
  }

  toggleView() {
    const formPanel = document.getElementById('formPanel');
    const jsonPanel = document.getElementById('jsonPanel');
    const toggleBtn = document.getElementById('toggleView');

    if (jsonPanel.style.display === 'none' || jsonPanel.style.display === '') {
      // Switch to JSON View
      formPanel.style.display = 'none';
      jsonPanel.style.display = 'flex';
      toggleBtn.innerHTML = '<i class="fas fa-edit"></i> Form View';
    } else {
      // Switch to Form View
      formPanel.style.display = 'flex';
      jsonPanel.style.display = 'none';
      toggleBtn.innerHTML = '<i class="fas fa-code"></i> JSON View';
    }
  }

  formatJSON() {
    const jsonEditor = document.getElementById('jsonEditor');
    try {
      const parsed = JSON.parse(jsonEditor.value);
      jsonEditor.value = JSON.stringify(parsed, null, 2);
    } catch (e) {
      this.showValidationMessage('Invalid JSON format', 'error');
    }
  }

  generateHTML() {
    // Register Handlebars helpers only once
    if (!Handlebars.helpers.join) {
      Handlebars.registerHelper('join', function(array, options) {
        if (!array || !Array.isArray(array)) return '';
        return array.join(', ');
      });
    }

    // Compile template and generate HTML
    const template = Handlebars.compile(this.template);
    return template(this.cvData);
  }

  generatePreview() {
    const previewContainer = document.getElementById('previewContainer');

    try {
      const html = this.generateHTML();

      // Update preview with isolated iframe to prevent style conflicts
      previewContainer.innerHTML = `
                <iframe 
                    id="previewFrame" 
                    style="width: 100%; height: auto; min-height: 400px; border: 1px solid #ddd; border-radius: 4px; display: block;"
                    srcdoc="${html.replace(/"/g, '&quot;')}"
                ></iframe>
            `;

      // Auto-resize iframe to hug content after it loads
      const iframe = document.getElementById('previewFrame');
      iframe.onload = () => {
        try {
          const doc = iframe.contentDocument || iframe.contentWindow.document;
          const body = doc.body;
          const htmlElement = doc.documentElement;

          // Get the actual content height
          const height = Math.max(
            body.scrollHeight,
            body.offsetHeight,
            htmlElement.clientHeight,
            htmlElement.scrollHeight,
            htmlElement.offsetHeight
          );

          // Set iframe height to exactly fit content (hug it)
          iframe.style.height = height + 'px';
        } catch (e) {
          // If cross-origin issues occur, keep default height
          console.warn('Could not auto-resize iframe:', e);
        }
      };

    } catch (error) {
      previewContainer.innerHTML = `
                <div class="preview-placeholder">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Error generating preview</p>
                    <small>${error.message}</small>
                </div>
            `;
    }
  }

  validateData() {
    const messages = document.getElementById('validationMessages');
    messages.innerHTML = '';

    // Simple validation without Ajv
    const errors = [];

    if (!this.cvData.profile || !this.cvData.profile.name) {
      errors.push('Name is required');
    }

    if (!this.cvData.profile || !this.cvData.profile.email) {
      errors.push('Email is required');
    }

    if (errors.length === 0) {
      this.showValidationMessage('✅ CV data looks good!', 'success');
    } else {
      errors.forEach(error => {
        this.showValidationMessage(`❌ ${error}`, 'error');
      });
    }
  }

  showValidationMessage(message, type) {
    const messages = document.getElementById('validationMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `validation-${type}`;
    messageDiv.textContent = message;
    messages.appendChild(messageDiv);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      messageDiv.remove();
    }, 5000);
  }

  downloadJSON() {
    const jsonData = JSON.stringify(this.cvData, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const filename = `cv-${new Date().toISOString().split('T')[0]}.json`;

    saveAs(blob, filename);
  }

  generatePDF() {
    try {
      const html = this.generateHTML();

      // Open new window with CV content
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>CV - ${this.cvData.profile && this.cvData.profile.name ? this.cvData.profile.name : 'CV'}</title>
                    <style>
                        body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
                        @media print { body { margin: 0; padding: 0; } }
                    </style>
                </head>
                <body>${html}</body>
                </html>
            `);
      printWindow.document.close();

      // Trigger print dialog
      setTimeout(() => {
        printWindow.print();
      }, 100);

    } catch (error) {
      console.error('PDF generation failed:', error);
      this.showValidationMessage('PDF generation failed. Please try again.', 'error');
    }
  }

  async loadFile(file) {
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      this.cvData = data;

      // Save loaded data to localStorage
      this.saveToStorage('cvData', this.cvData);

      this.updateFormFromData();
      this.updateJSON();
      this.generatePreview();

      this.showValidationMessage('✅ File loaded successfully!', 'success');
    } catch (error) {
      this.showValidationMessage('❌ Error loading file: ' + error.message, 'error');
    }
  }
}

  // Add postMessage listener for external CV JSON injection
window.addEventListener('message', (event) => {
  // Optionally, restrict allowed origins here (for MVP, accept all)
  // if (event.origin !== 'https://trusted-origin.com') return;

  const { type, data } = event.data || {};
  if (type === 'SET_CV_JSON' && typeof data === 'object' && data !== null) {
    // Simple validation: require at least profile.name and profile.email
    if (
      data.profile &&
      typeof data.profile.name === 'string' &&
      typeof data.profile.email === 'string'
    ) {
      try {
        // Save to localStorage
        localStorage.setItem('cvgen_cvData', JSON.stringify(data));
        // Update editor if already initialized
        if (window.cvEditorInstance) {
          window.cvEditorInstance.cvData = data;
          window.cvEditorInstance.updateFormFromData();
          window.cvEditorInstance.updateJSON();
          window.cvEditorInstance.generatePreview();
          window.cvEditorInstance.showValidationMessage('✅ CV loaded from external source!', 'success');
        } else {
          // If not initialized, will be loaded on next init
        }
      } catch (e) {
        // Optionally notify user
        if (window.cvEditorInstance) {
          window.cvEditorInstance.showValidationMessage('❌ Failed to load external CV data', 'error');
        }
      }
    } else {
      if (window.cvEditorInstance) {
        window.cvEditorInstance.showValidationMessage('❌ Invalid CV data received', 'error');
      }
    }
  }
});

// Initialize the editor when the page loads
document.addEventListener('DOMContentLoaded', () => {
  window.cvEditorInstance = new CVEditor();
});
