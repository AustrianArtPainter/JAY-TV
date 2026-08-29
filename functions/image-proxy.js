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

export async function onRequestGet({ request }) {
    const imageUrl = getAllowedImageUrl(new URL(request.url).searchParams.get('url'));
    if (!imageUrl) return new Response('Invalid image URL', { status: 400 });

    try {
        const response = await fetch(imageUrl.href, {
            redirect: 'manual',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/121.0.0.0 Safari/537.36',
                'Referer': 'https://movie.douban.com/',
                'Accept': 'image/avif,image/webp,image/png,image/jpeg,image/gif;q=0.8'
            }
        });
        if (!response.ok) return new Response('Image request failed', { status: 502 });

        const contentType = response.headers.get('content-type') || '';
        const imageBuffer = await response.arrayBuffer();
        if (!ALLOWED_IMAGE_TYPE.test(contentType) || imageBuffer.byteLength > MAX_IMAGE_BYTES) {
            return new Response('Invalid image response', { status: 502 });
        }

        return new Response(imageBuffer, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=604800, immutable'
            }
        });
    } catch {
        return new Response('Image request failed', { status: 502 });
    }
}
