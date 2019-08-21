export function decodeDataUri(uri) {
    const decodedUri = decodeURIComponent(uri);
    const re = /^data:.*?(;base64)?,(.*)$/;
    const result = re.exec(decodedUri);
    const isBase64 = !!result[1];
    let data = result[2];
    if (isBase64) {
        data = atob(data);
    }
    const buffer = new ArrayBuffer(data.length);
    let view = new Uint8Array(buffer);
    for (let i = 0; i < data.length; i++) {
        view[i] = data.charCodeAt(i);
    }
    return buffer;
}
