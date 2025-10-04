class CVEditor {
  constructor() {
    this.cvData = {};
    this.template = '';
    this.init();
  }

  // ===========================================
  // INITIALIZATION & SETUP
  // ===========================================
  
  async init() {
    await this.preloadExamples();
    
    const cvId = this.getCurrentCvId();
    this.cvData = this.loadFromStorage(cvId) || this.loadFromStorage('backend-cv-schema') || {};
    
    await this.loadTemplate();
    this.generateForm();
    this.setupEventListeners();
    this.updateFormFromData();
    this.updateJSON();
    this.generatePreview();
  }
  
  getCurrentCvId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('data') || 'backend-cv-schema';
  }

  // ===========================================
  // DATA MANAGEMENT
  // ===========================================
  
  saveToStorage(cvId, data) {
    try {
      const storageKey = `cvgen_${cvId}`;
      localStorage.setItem(storageKey, JSON.stringify(data));
      this.showSavingIndicator();
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
      this.showValidationMessage('Failed to save data locally', 'error');
    }
  }
  
  loadFromStorage(cvId) {
    try {
      const storageKey = `cvgen_${cvId}`;
      const data = localStorage.getItem(storageKey);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.warn('Failed to load from localStorage:', error);
      this.showValidationMessage('Failed to load data from storage', 'error');
      return null;
    }
  }
  
  updateDataAndSave(newData) {
    this.cvData = newData;
    this.saveToStorage(this.getCurrentCvId(), this.cvData);
    this.updateFormFromData();
    this.updateJSON();
    this.generatePreview();
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

  // ===========================================
  // FORM MANAGEMENT
  // ===========================================

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
    // Store bound function reference to ensure proper cleanup
    if (!this.boundHandleFormInput) {
      this.boundHandleFormInput = this.handleFormInput.bind(this);
    }
    
    // Remove existing listeners to prevent memory leaks
    const existingFields = document.querySelectorAll('.form-control');
    existingFields.forEach(field => {
      field.removeEventListener('input', this.boundHandleFormInput);
    });
    
    // Add new listeners
    const formFields = document.querySelectorAll('.form-control');
    formFields.forEach(field => {
      field.addEventListener('input', this.boundHandleFormInput);
    });
  }
  
  handleFormInput(event) {
    const field = event.target;
    const fieldName = field.dataset.field;
    
    // Safety check for field name
    if (!fieldName) {
      console.warn('Form field missing dataset.field:', field);
      return;
    }
    
    let value = field.value;
    
    // Parse JSON for textarea fields
    if (field.tagName === 'TEXTAREA' && !fieldName.includes('.')) {
      try {
        value = JSON.parse(field.value);
      } catch (e) {
        // Keep as string if parsing fails
        console.warn('Failed to parse JSON in field:', fieldName, e.message);
      }
    }
    
    this.setNestedValue(this.cvData, fieldName, value);
    
    // Debounce expensive operations
    clearTimeout(this.updateTimeout);
    this.updateTimeout = setTimeout(() => {
      this.updateDataAndSave(this.cvData);
    }, 300);
  }


  // ===========================================
  // JSON MANAGEMENT
  // ===========================================
  
  updateJSON() {
    const jsonEditor = document.getElementById('jsonEditor');
    jsonEditor.value = JSON.stringify(this.cvData, null, 2);
  }
  
  updateFromJSON(jsonText) {
    try {
      const newData = JSON.parse(jsonText);
      this.updateDataAndSave(newData);
    } catch (e) {
      this.showValidationMessage('❌ Invalid JSON format', 'error');
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

  // ===========================================
  // PREVIEW MANAGEMENT
  // ===========================================
  
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
  
  generateHTML() {
    if (!Handlebars.helpers.join) {
      Handlebars.registerHelper('join', function(array) {
        return array ? array.join(', ') : '';
      });
    }
    const template = Handlebars.compile(this.template);
    return template(this.cvData);
  }
  
  generatePreview() {
    const previewContainer = document.getElementById('previewContainer');
    
    try {
      const html = this.generateHTML();
      this.updatePreviewContainer(html, previewContainer);
    } catch (error) {
      this.showPreviewError(error, previewContainer);
    }
  }
  
  updatePreviewContainer(html, container) {
    // Create iframe safely
    const iframe = document.createElement('iframe');
    iframe.id = 'previewFrame';
    iframe.style.cssText = 'width: 100%; height: auto; min-height: 400px; border: 1px solid #ddd; border-radius: 4px; display: block;';
    iframe.srcdoc = html; // Let browser handle escaping
    
    container.innerHTML = '';
    container.appendChild(iframe);
    
    // Auto-resize iframe
    iframe.onload = () => {
      try {
        const doc = iframe.contentDocument || iframe.contentWindow.document;
        const height = Math.max(
          doc.body.scrollHeight,
          doc.body.offsetHeight,
          doc.documentElement.clientHeight,
          doc.documentElement.scrollHeight,
          doc.documentElement.offsetHeight
        );
        iframe.style.height = height + 'px';
      } catch (e) {
        console.warn('Could not auto-resize iframe:', e);
      }
    };
  }
  
  showPreviewError(error, container) {
    container.innerHTML = `
      <div class="preview-placeholder">
        <i class="fas fa-exclamation-triangle"></i>
        <p>Error generating preview</p>
        <small>${error.message}</small>
      </div>
    `;
  }

  // ===========================================
  // UI MANAGEMENT
  // ===========================================
  
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


  showValidationMessage(message, type) {
    const messages = document.getElementById('validationMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `validation-${type}`;
    messageDiv.textContent = message;
    messages.appendChild(messageDiv);
    
    setTimeout(() => messageDiv.remove(), 5000);
  }
  
  showSavingIndicator() {
    let indicator = document.getElementById('savingIndicator');
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'savingIndicator';
      indicator.className = 'saving-indicator';
      indicator.innerHTML = '<i class="fas fa-save"></i> Saved';
      document.body.appendChild(indicator);
    }
    
    indicator.classList.add('show');
    clearTimeout(this.savingTimeout);
    this.savingTimeout = setTimeout(() => {
      indicator.classList.remove('show');
    }, 1500);
  }
  
  validateData() {
    const messages = document.getElementById('validationMessages');
    messages.innerHTML = '';
    
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

  // ===========================================
  // FILE OPERATIONS
  // ===========================================
  
  downloadJSON() {
    const jsonData = JSON.stringify(this.cvData, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const filename = `cv-${new Date().toISOString().split('T')[0]}.json`;
    
    saveAs(blob, filename);
  }
  
  generatePDF() {
    try {
      const html = this.generateHTML();
      
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>CV - ${this.cvData.profile?.name || 'CV'}</title>
          <style>
            body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
            @media print { body { margin: 0; padding: 0; } }
          </style>
        </head>
        <body>${html}</body>
        </html>
      `);
      printWindow.document.close();
      
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
      this.updateDataAndSave(data);
      this.showValidationMessage('✅ File loaded successfully!', 'success');
    } catch (error) {
      this.showValidationMessage('❌ Error loading file: ' + error.message, 'error');
    }
  }
  
  async preloadExamples() {
    const exampleFiles = ['backend-cv-schema', 'frontend-cv-schema'];
    
    for (const filename of exampleFiles) {
      const key = `cvgen_${filename}`;
      if (!localStorage.getItem(key)) {
        try {
          const response = await fetch(`cv-json-example/${filename}.json`);
          if (response.ok) {
            const data = await response.json();
            localStorage.setItem(key, JSON.stringify(data));
          }
        } catch (error) {
          console.warn(`Failed to preload ${filename}:`, error);
        }
      }
    }
  }

}

// ===========================================
// GLOBAL INITIALIZATION
// ===========================================

// PostMessage listener for external CV JSON injection
window.addEventListener('message', (event) => {
  const { type, data, cv_id } = event.data || {};
  if (type === 'SET_CV_JSON' && data && cv_id) {
    if (window.cvEditorInstance) {
      const newUrl = `${window.location.origin}${window.location.pathname}?data=${cv_id}`;
      window.history.replaceState({}, '', newUrl);
      window.cvEditorInstance.updateDataAndSave(data);
    } else {
      window.cvEditorInstance = new CVEditor();
    }
  }
});

// Initialize the editor when the page loads
document.addEventListener('DOMContentLoaded', () => {
  window.cvEditorInstance = new CVEditor();
});
