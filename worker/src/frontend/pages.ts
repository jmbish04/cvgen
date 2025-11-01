import { Hono } from 'hono';
import { Env } from '../types';

export function createFrontendRoutes(app: Hono<{ Bindings: Env }>) {
  // Main editor page (copy of docs/index.html but adapted for worker)
  app.get('/', (c) => {
    const html = getEditorHTML();
    return c.html(html);
  });

  // History page
  app.get('/history', (c) => {
    const html = getHistoryHTML();
    return c.html(html);
  });

  // Chat page
  app.get('/chat', (c) => {
    const html = getChatHTML();
    return c.html(html);
  });

  return app;
}

function getEditorHTML(): string {
  // Return a simplified version that works with the API
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CVGen - Professional CV Generator</title>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Urbanist:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Urbanist', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 { font-size: 2.5em; margin-bottom: 10px; }
        .nav {
            background: #f8f9fa;
            padding: 15px 30px;
            display: flex;
            gap: 20px;
            border-bottom: 1px solid #dee2e6;
        }
        .nav a {
            color: #667eea;
            text-decoration: none;
            padding: 8px 16px;
            border-radius: 8px;
            transition: all 0.3s;
        }
        .nav a:hover, .nav a.active {
            background: #667eea;
            color: white;
        }
        .content {
            padding: 40px;
        }
        .editor-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-top: 20px;
        }
        .panel {
            background: #f8f9fa;
            border-radius: 12px;
            padding: 20px;
            min-height: 400px;
        }
        .panel h2 {
            color: #667eea;
            margin-bottom: 20px;
            font-size: 1.5em;
        }
        textarea {
            width: 100%;
            min-height: 500px;
            padding: 15px;
            border: 2px solid #dee2e6;
            border-radius: 8px;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            resize: vertical;
        }
        .btn {
            background: #667eea;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            font-weight: 600;
            transition: all 0.3s;
        }
        .btn:hover {
            background: #5568d3;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }
        .btn-group {
            display: flex;
            gap: 15px;
            margin-bottom: 20px;
        }
        .preview-frame {
            width: 100%;
            min-height: 600px;
            border: 2px solid #dee2e6;
            border-radius: 8px;
            background: white;
        }
        .status {
            margin-top: 15px;
            padding: 12px;
            border-radius: 8px;
            display: none;
        }
        .status.success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
            display: block;
        }
        .status.error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
            display: block;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1><i class="fas fa-file-alt"></i> CVGen</h1>
            <p>Professional CV Generator powered by Cloudflare Workers</p>
        </div>
        
        <div class="nav">
            <a href="/" class="active"><i class="fas fa-edit"></i> Editor</a>
            <a href="/history"><i class="fas fa-history"></i> History</a>
            <a href="/chat"><i class="fas fa-comments"></i> AI Assistant</a>
            <a href="/openapi.json" target="_blank"><i class="fas fa-code"></i> API Docs</a>
        </div>
        
        <div class="content">
            <div class="btn-group">
                <button class="btn" onclick="generateCV()">
                    <i class="fas fa-magic"></i> Generate CV
                </button>
                <button class="btn" onclick="loadExample()">
                    <i class="fas fa-file-import"></i> Load Example
                </button>
                <button class="btn" onclick="clearEditor()">
                    <i class="fas fa-eraser"></i> Clear
                </button>
            </div>
            
            <div class="editor-grid">
                <div class="panel">
                    <h2><i class="fas fa-code"></i> CV Data (JSON)</h2>
                    <textarea id="cvDataInput" placeholder="Paste your CV JSON data here..."></textarea>
                </div>
                
                <div class="panel">
                    <h2><i class="fas fa-eye"></i> Preview</h2>
                    <iframe id="preview" class="preview-frame"></iframe>
                </div>
            </div>
            
            <div id="status" class="status"></div>
        </div>
    </div>

    <script>
        const exampleCV = {
            "profile": {
                "name": "John Doe",
                "position": "Full Stack Developer",
                "email": "john.doe@example.com",
                "phone": "+1 (555) 123-4567",
                "location": "San Francisco, CA",
                "linkedin": "https://linkedin.com/in/johndoe",
                "github": "https://github.com/johndoe"
            },
            "summary": "Experienced full-stack developer with 5+ years of expertise in building scalable web applications. Passionate about clean code and modern technologies.",
            "experiences": [
                {
                    "company": "Tech Corp",
                    "position": "Senior Developer",
                    "location": "San Francisco, CA",
                    "start_date": "01/2020",
                    "end_date": "Present",
                    "description": "Leading development of cloud-based solutions",
                    "achievements": [
                        "Architected microservices platform serving 1M+ users",
                        "Reduced API response time by 60%",
                        "Mentored team of 5 junior developers"
                    ]
                }
            ],
            "education": [
                {
                    "institution": "University of California",
                    "degree": "Bachelor of Science",
                    "field_of_study": "Computer Science",
                    "end_date": "05/2018",
                    "gpa": "3.8"
                }
            ],
            "skills": {
                "programming_languages": ["JavaScript", "TypeScript", "Python"],
                "frameworks": ["React", "Node.js", "Express"],
                "databases": ["PostgreSQL", "MongoDB", "Redis"],
                "cloud": ["AWS", "Cloudflare Workers"]
            }
        };

        function loadExample() {
            document.getElementById('cvDataInput').value = JSON.stringify(exampleCV, null, 2);
            showStatus('Example CV loaded successfully!', 'success');
        }

        function clearEditor() {
            document.getElementById('cvDataInput').value = '';
            document.getElementById('preview').srcdoc = '';
            hideStatus();
        }

        async function generateCV() {
            const input = document.getElementById('cvDataInput').value;
            
            try {
                const cvData = JSON.parse(input);
                showStatus('Generating CV...', 'success');
                
                const response = await fetch('/api/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(cvData)
                });
                
                if (!response.ok) {
                    throw new Error('Failed to generate CV');
                }
                
                const result = await response.json();
                showStatus(\`CV generated successfully! <a href="\${result.html_url}" target="_blank">View HTML</a> | <a href="\${result.pdf_url}" target="_blank">Download PDF</a>\`, 'success');
                
                // Load preview
                const htmlResponse = await fetch(result.html_url);
                const html = await htmlResponse.text();
                document.getElementById('preview').srcdoc = html;
                
            } catch (error) {
                showStatus('Error: ' + error.message, 'error');
            }
        }

        function showStatus(message, type) {
            const status = document.getElementById('status');
            status.innerHTML = message;
            status.className = 'status ' + type;
        }

        function hideStatus() {
            const status = document.getElementById('status');
            status.style.display = 'none';
        }

        // Load example on page load
        window.addEventListener('load', () => {
            loadExample();
        });
    </script>
</body>
</html>`;
}

function getHistoryHTML(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CVGen - History</title>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Urbanist:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Urbanist', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 { font-size: 2.5em; margin-bottom: 10px; }
        .nav {
            background: #f8f9fa;
            padding: 15px 30px;
            display: flex;
            gap: 20px;
            border-bottom: 1px solid #dee2e6;
        }
        .nav a {
            color: #667eea;
            text-decoration: none;
            padding: 8px 16px;
            border-radius: 8px;
            transition: all 0.3s;
        }
        .nav a:hover, .nav a.active {
            background: #667eea;
            color: white;
        }
        .content {
            padding: 40px;
        }
        .cv-list {
            display: grid;
            gap: 20px;
        }
        .cv-card {
            background: #f8f9fa;
            border-radius: 12px;
            padding: 20px;
            border: 2px solid #dee2e6;
            transition: all 0.3s;
        }
        .cv-card:hover {
            border-color: #667eea;
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
        }
        .cv-header {
            display: flex;
            justify-content: space-between;
            align-items: start;
            margin-bottom: 15px;
        }
        .cv-title {
            color: #667eea;
            font-size: 1.3em;
            font-weight: 600;
        }
        .cv-date {
            color: #6c757d;
            font-size: 0.9em;
        }
        .cv-links {
            display: flex;
            gap: 10px;
            margin-top: 15px;
        }
        .cv-link {
            background: #667eea;
            color: white;
            text-decoration: none;
            padding: 8px 16px;
            border-radius: 6px;
            font-size: 0.9em;
            transition: all 0.3s;
        }
        .cv-link:hover {
            background: #5568d3;
        }
        .loading {
            text-align: center;
            padding: 40px;
            color: #6c757d;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1><i class="fas fa-file-alt"></i> CVGen</h1>
            <p>Professional CV Generator powered by Cloudflare Workers</p>
        </div>
        
        <div class="nav">
            <a href="/"><i class="fas fa-edit"></i> Editor</a>
            <a href="/history" class="active"><i class="fas fa-history"></i> History</a>
            <a href="/chat"><i class="fas fa-comments"></i> AI Assistant</a>
            <a href="/openapi.json" target="_blank"><i class="fas fa-code"></i> API Docs</a>
        </div>
        
        <div class="content">
            <h2 style="margin-bottom: 20px;">Your CV History</h2>
            <div id="cvList" class="cv-list">
                <div class="loading">
                    <i class="fas fa-spinner fa-spin fa-3x"></i>
                    <p>Loading CVs...</p>
                </div>
            </div>
        </div>
    </div>

    <script>
        async function loadCVs() {
            try {
                const response = await fetch('/api/cvs');
                const data = await response.json();
                
                const listEl = document.getElementById('cvList');
                
                if (data.cvs.length === 0) {
                    listEl.innerHTML = '<p class="loading">No CVs generated yet. <a href="/">Create your first CV</a></p>';
                    return;
                }
                
                listEl.innerHTML = data.cvs.map(cv => \`
                    <div class="cv-card">
                        <div class="cv-header">
                            <div>
                                <div class="cv-title">\${cv.request_data.profile.name}</div>
                                <div>\${cv.request_data.profile.position}</div>
                            </div>
                            <div class="cv-date">
                                <i class="fas fa-calendar"></i>
                                \${new Date(cv.created_at).toLocaleDateString()}
                            </div>
                        </div>
                        <div class="cv-links">
                            <a href="\${cv.html_url}" target="_blank" class="cv-link">
                                <i class="fas fa-code"></i> HTML
                            </a>
                            <a href="\${cv.pdf_url}" target="_blank" class="cv-link">
                                <i class="fas fa-file-pdf"></i> PDF
                            </a>
                            <a href="\${cv.markdown_url}" target="_blank" class="cv-link">
                                <i class="fas fa-file-alt"></i> Markdown
                            </a>
                        </div>
                    </div>
                \`).join('');
            } catch (error) {
                document.getElementById('cvList').innerHTML = '<p class="loading">Error loading CVs: ' + error.message + '</p>';
            }
        }

        window.addEventListener('load', loadCVs);
    </script>
</body>
</html>`;
}

function getChatHTML(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CVGen - AI Assistant</title>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Urbanist:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Urbanist', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            overflow: hidden;
            display: flex;
            flex-direction: column;
            height: 90vh;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 { font-size: 2.5em; margin-bottom: 10px; }
        .nav {
            background: #f8f9fa;
            padding: 15px 30px;
            display: flex;
            gap: 20px;
            border-bottom: 1px solid #dee2e6;
        }
        .nav a {
            color: #667eea;
            text-decoration: none;
            padding: 8px 16px;
            border-radius: 8px;
            transition: all 0.3s;
        }
        .nav a:hover, .nav a.active {
            background: #667eea;
            color: white;
        }
        .chat-container {
            flex: 1;
            display: flex;
            flex-direction: column;
            padding: 20px;
            overflow: hidden;
        }
        .messages {
            flex: 1;
            overflow-y: auto;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 12px;
            margin-bottom: 20px;
        }
        .message {
            margin-bottom: 20px;
            display: flex;
            gap: 10px;
        }
        .message.user {
            justify-content: flex-end;
        }
        .message-content {
            max-width: 70%;
            padding: 15px;
            border-radius: 12px;
            line-height: 1.6;
        }
        .message.user .message-content {
            background: #667eea;
            color: white;
        }
        .message.assistant .message-content {
            background: white;
            border: 1px solid #dee2e6;
        }
        .input-area {
            display: flex;
            gap: 10px;
        }
        .input-area input {
            flex: 1;
            padding: 15px;
            border: 2px solid #dee2e6;
            border-radius: 8px;
            font-size: 16px;
        }
        .input-area button {
            background: #667eea;
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            font-weight: 600;
            transition: all 0.3s;
        }
        .input-area button:hover {
            background: #5568d3;
        }
        .typing-indicator {
            display: none;
            padding: 10px;
            color: #6c757d;
            font-style: italic;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1><i class="fas fa-file-alt"></i> CVGen</h1>
            <p>Professional CV Generator powered by Cloudflare Workers</p>
        </div>
        
        <div class="nav">
            <a href="/"><i class="fas fa-edit"></i> Editor</a>
            <a href="/history"><i class="fas fa-history"></i> History</a>
            <a href="/chat" class="active"><i class="fas fa-comments"></i> AI Assistant</a>
            <a href="/openapi.json" target="_blank"><i class="fas fa-code"></i> API Docs</a>
        </div>
        
        <div class="chat-container">
            <div id="messages" class="messages">
                <div class="message assistant">
                    <div class="message-content">
                        👋 Hello! I'm your AI career advisor. I can help you with:
                        <ul style="margin-top: 10px;">
                            <li>Reviewing your CV history</li>
                            <li>Suggesting improvements</li>
                            <li>Finding specific experiences or skills</li>
                            <li>Answering questions about your career progression</li>
                        </ul>
                        What would you like to know?
                    </div>
                </div>
            </div>
            
            <div class="typing-indicator" id="typingIndicator">
                <i class="fas fa-circle-notch fa-spin"></i> AI is thinking...
            </div>
            
            <div class="input-area">
                <input 
                    type="text" 
                    id="messageInput" 
                    placeholder="Ask me anything about your CVs..."
                    onkeypress="if(event.key==='Enter') sendMessage()"
                />
                <button onclick="sendMessage()">
                    <i class="fas fa-paper-plane"></i> Send
                </button>
            </div>
        </div>
    </div>

    <script>
        let conversationHistory = [];

        function addMessage(content, role) {
            const messagesEl = document.getElementById('messages');
            const messageEl = document.createElement('div');
            messageEl.className = 'message ' + role;
            messageEl.innerHTML = \`<div class="message-content">\${content}</div>\`;
            messagesEl.appendChild(messageEl);
            messagesEl.scrollTop = messagesEl.scrollHeight;
        }

        async function sendMessage() {
            const input = document.getElementById('messageInput');
            const message = input.value.trim();
            
            if (!message) return;
            
            // Add user message
            addMessage(message, 'user');
            conversationHistory.push({ role: 'user', content: message });
            input.value = '';
            
            // Show typing indicator
            document.getElementById('typingIndicator').style.display = 'block';
            
            try {
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message,
                        conversation_history: conversationHistory
                    })
                });
                
                const data = await response.json();
                
                // Add assistant message
                addMessage(data.message, 'assistant');
                conversationHistory.push({ role: 'assistant', content: data.message });
                
                // Show sources if available
                if (data.sources && data.sources.length > 0) {
                    const sourcesText = '<br><br><small><strong>Sources:</strong> ' + 
                        data.sources.map(s => s.request_data.profile.name).join(', ') + 
                        '</small>';
                    const lastMessage = document.querySelector('.messages .message:last-child .message-content');
                    lastMessage.innerHTML += sourcesText;
                }
                
            } catch (error) {
                addMessage('Sorry, I encountered an error: ' + error.message, 'assistant');
            } finally {
                document.getElementById('typingIndicator').style.display = 'none';
            }
        }
    </script>
</body>
</html>`;
}
