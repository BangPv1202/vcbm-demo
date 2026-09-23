import type { VercelRequest, VercelResponse } from '@vercel/node';

const TARGET = 'https://pro-api.ant-design-demo.workers.dev';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const path = Array.isArray(req.query.path)
      ? req.query.path.join('/')
      : req.query.path || '';

    const query = new URLSearchParams();

    Object.entries(req.query).forEach(([key, value]) => {
      if (key === 'path') return;

      if (Array.isArray(value)) {
        value.forEach(item => query.append(key, item));
      } else if (value !== undefined) {
        query.append(key, value);
      }
    });

    const targetUrl = `${TARGET}/api/${path}${
      query.toString() ? `?${query}` : ''
    }`;

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Content-Type': req.headers['content-type'] || 'application/json',
        Accept: 'application/json',
      },
      body:
        req.method === 'GET' || req.method === 'HEAD'
          ? undefined
          : JSON.stringify(req.body),
    });

    const data = await response.text();

    res.status(response.status);
    res.setHeader(
      'Content-Type',
      response.headers.get('content-type') || 'application/json',
    );

    res.send(data);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: 'Proxy error',
    });
  }
}
