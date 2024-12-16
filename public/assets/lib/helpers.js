async function get(path) {
    const response = await fetch(path);

    console.log('GET', response);
    return response;
}

async function post(path, bodyJSON) {
    const response = await fetch(path, {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyJSON)
    });

    console.log('POST', response);
    return response;
}

async function put(path, bodyJSON) {
    const response = await fetch(path, {
        method: "PUT",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyJSON)
    });

    console.log('PUT', response);
    return response;
}

function escapeHTML(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}