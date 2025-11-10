document.addEventListener('DOMContentLoaded', () => {
    // Shared nav loading
    fetch('nav.html')
        .then(response => response.text())
        .then(data => {
            document.body.insertAdjacentHTML('afterbegin', data);
        });

    // Intersection observer for animations
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.fade-in-up').forEach(el => observer.observe(el));

    // Health page logic
    if (document.getElementById('health-dashboard')) {
        const runTestsBtn = document.getElementById('run-tests-btn');
        const testDefsContainer = document.getElementById('test-defs');
        const resultsContainer = document.getElementById('results-container');

        async function fetchTestDefs() {
            const response = await fetch('/api/tests/defs');
            const defs = await response.json();
            testDefsContainer.innerHTML = '';
            defs.forEach(def => {
                const el = document.createElement('div');
                el.className = 'p-4 border rounded-lg bg-white';
                el.innerHTML = `
                    <div class="flex items-center justify-between">
                        <h3 class="font-semibold">${def.name}</h3>
                        <div id="spinner-${def.id}" class="hidden spinner border-t-2 border-indigo-500 rounded-full w-5 h-5 animate-spin"></div>
                    </div>
                    <p class="text-sm text-gray-600">${def.description}</p>
                `;
                testDefsContainer.appendChild(el);
            });
        }

        async function fetchLatestResults() {
            const response = await fetch('/api/tests/latest');
            const results = await response.json();
            renderResults(results);
        }

        function renderResults(results) {
            resultsContainer.innerHTML = '';
            if (!results) {
                resultsContainer.innerHTML = '<p>No test results yet.</p>';
                return;
            }
            const table = document.createElement('table');
            table.className = 'min-w-full divide-y divide-gray-200';
            table.innerHTML = `
                <thead class="bg-gray-50">
                    <tr>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Test</th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                </tbody>
            `;
            const tbody = table.querySelector('tbody');
            results.forEach(result => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="px-6 py-4 whitespace-nowrap">${result.test_fk}</td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${result.status === 'pass' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                            ${result.status}
                        </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">${result.duration_ms}ms</td>
                `;
                tbody.appendChild(row);
            });
            resultsContainer.appendChild(table);
        }

        runTestsBtn.addEventListener('click', async () => {
            // Show spinners
            document.querySelectorAll('.spinner').forEach(s => s.classList.remove('hidden'));

            const response = await fetch('/api/tests/run', { method: 'POST' });
            const { session_uuid } = await response.json();

            // Poll for results
            const interval = setInterval(async () => {
                const res = await fetch(`/api/tests/session/${session_uuid}`);
                const results = await res.json();
                if (results && results.length > 0) {
                     // Hide spinners
                    document.querySelectorAll('.spinner').forEach(s => s.classList.add('hidden'));
                    renderResults(results);
                    clearInterval(interval);
                }
            }, 2000);
        });

        fetchTestDefs();
        fetchLatestResults();
    }
});
