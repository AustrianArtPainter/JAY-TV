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

export default async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).send('Method Not Allowed');

    const imageUrl = getAllowedImageUrl(req.query.url);
    if (!imageUrl) return res.status(400).send('Invalid image URL');

    try {
        const response = await fetch(imageUrl.href, {
            redirect: 'error',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/121.0.0.0 Safari/537.36',
                'Referer': 'https://movie.douban.com/',
                'Accept': 'image/avif,image/webp,image/png,image/jpeg,image/gif;q=0.8'
            }
        });
        if (!response.ok) return res.status(502).send('Image request failed');

        const contentType = response.headers.get('content-type') || '';
        const imageBuffer = Buffer.from(await response.arrayBuffer());
        if (!ALLOWED_IMAGE_TYPE.test(contentType) || imageBuffer.length > MAX_IMAGE_BYTES) {
            return res.status(502).send('Invalid image response');
        }

        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
        return res.status(200).send(imageBuffer);
    } catch {
        return res.status(502).send('Image request failed');
    }
}
