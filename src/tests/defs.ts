export const getDefaultTestDefs = () => [
    {
        id: crypto.randomUUID(),
        name: 'Health Endpoint Check',
        description: 'Verifies that the /api/health endpoint returns a healthy status.',
        category: 'API',
        severity: 'critical',
        is_active: 1,
        error_map: JSON.stringify({
            ' unhealthy': {
                meaning: 'The health endpoint is reporting an unhealthy status.',
                fix: 'Check the latest test results to identify the failing test.',
            },
        }),
    },
    {
        id: crypto.randomUUID(),
        name: 'OpenAPI JSON Check',
        description: 'Ensures the /openapi.json endpoint returns a valid OpenAPI 3.1.0 spec.',
        category: 'API',
        severity: 'high',
        is_active: 1,
        error_map: JSON.stringify({
            'invalid_json': {
                meaning: 'The /openapi.json endpoint did not return valid JSON.',
                fix: 'Check the OpenAPI generator for errors.',
            },
            'invalid_spec': {
                meaning: 'The /openapi.json endpoint did not return a valid OpenAPI 3.1.0 spec.',
                fix: 'Check the OpenAPI generator for compliance issues.',
            },
        }),
    },
    {
        id: crypto.randomUUID(),
        name: 'WebSocket Handshake',
        description: 'Tests the WebSocket handshake through the RoomDO.',
        category: 'WebSocket',
        severity: 'critical',
        is_active: 1,
        error_map: JSON.stringify({
            'handshake_failed': {
                meaning: 'The WebSocket handshake failed.',
                fix: 'Check the RoomDO implementation and the /ws endpoint.',
            },
        }),
    },
];