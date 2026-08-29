import fetch from 'node-fetch';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPE = /^image\/(?:avif|webp|png|jpe?g|gif)$/i;

function getAllowedImageUrl(rawUrl) {
    try {
        const imageUrl = new URL(rawUrl);
        if (imageUrl.protocol !== 'https:') return null;
        if (!/^img\d+\.doubanio\.com$/i.test(imageUrl.hostname)) return null;
        return imageUrl;
    } catch {
        return null;
    }
}

export const handler = async (event) => {
    if (event.httpMethod !== 'GET') return { statusCode: 405, body: 'Method Not Allowed' };

    const imageUrl = getAllowedImageUrl(event.queryStringParameters?.url);
    if (!imageUrl) return { statusCode: 400, body: 'Invalid image URL' };

    try {
        const response = await fetch(imageUrl.href, {
            redirect: 'error',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/121.0.0.0 Safari/537.36',
                'Referer': 'https://movie.douban.com/',
                'Accept': 'image/avif,image/webp,image/png,image/jpeg,image/gif;q=0.8'
            }
        });
        if (!response.ok) return { statusCode: 502, body: 'Image request failed' };

        const contentType = response.headers.get('content-type') || '';
        const imageBuffer = Buffer.from(await response.arrayBuffer());
        if (!ALLOWED_IMAGE_TYPE.test(contentType) || imageBuffer.length > MAX_IMAGE_BYTES) {
            return { statusCode: 502, body: 'Invalid image response' };
        }

        return {
            statusCode: 200,
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=604800, immutable'
            },
            body: imageBuffer.toString('base64'),
            isBase64Encoded: true
        };
    } catch {
        return { statusCode: 502, body: 'Image request failed' };
    }
};
