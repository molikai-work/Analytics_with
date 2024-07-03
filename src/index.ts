import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { checkUrl, getUrlData } from './lib/util';
import { insertAndReturnId, insert } from './lib/dbutil';

type Bindings = {
  DB: D1Database
}

const app = new Hono<{ Bindings: Bindings }>();

// 首页路由
app.get("/", (c) => {
  const getHomeHTML = ``;
  return c.text(getHomeHTML, 200, {
    'Content-Type': 'text/html'
  });
});

// 设置CORS
app.use("/api/*", cors());

// API路由
app.post("/api/visit", async (c) => {
  const times = Date.now();

  if (c.req.method !== 'POST') {
    return c.json({ code: 405, message: "Method Not Allowed", data: null, times }, 405);
  }

  try {
    // 获取访客IP
    const visitorIP = c.req.header("CF-Connecting-IP");

    // 获取请求数据
    const body = await c.req.json();

    // 解构请求数据
    const { visitorUrl, visitorHostName, visitorReferrer, pvEnable, uvEnable } = body;

    // 处理合并referrer主机名和路径
    let referrer_url = "";
    if (visitorReferrer && checkUrl(visitorReferrer)) {
      const referrerData = getUrlData(visitorReferrer);
      referrer_url = `${referrerData.hostname}${referrerData.pathname}`;
    }

    // 查询数据库中的网站信息
    const website = await c.env.DB
      .prepare("SELECT id, domain FROM website_records WHERE domain = ?")
      .bind(visitorHostName)
      .first();

    let websiteId;
    if (website) {
      // 插入访客数据
      await insert(
        c.env.DB,
        "INSERT INTO access_records (website_id, url_path, referrer_url, visitor_ip) VALUES (?, ?, ?, ?)",
        [website.id, visitorUrl, referrer_url, visitorIP]
      );
      websiteId = Number(website.id);
    } else {
      // 插入网站数据并返回网站ID
      websiteId = await insertAndReturnId(
        c.env.DB,
        "INSERT INTO website_records (domain) VALUES (?)",
        [visitorHostName]
      );
      // 插入访客数据
      await insert(
        c.env.DB,
        "INSERT INTO access_records (website_id, url_path, referrer_url, visitor_ip) VALUES (?, ?, ?, ?)",
        [websiteId, visitorUrl, referrer_url, visitorIP]
      );
    }

    const resData: Record<string, number> = {};
    if (pvEnable) {
      // 页面访问次数
      const total = await c.env.DB
        .prepare("SELECT COUNT(*) AS total FROM access_records WHERE website_id = ? AND url_path = ?")
        .bind(websiteId, visitorUrl)
        .first("total");
      resData["pagePv"] = Number(total);
    }
    if (uvEnable) {
      // 页面独立访客数
      const total = await c.env.DB
        .prepare("SELECT COUNT(*) AS total FROM (SELECT DISTINCT visitor_ip FROM access_records WHERE website_id = ? AND url_path = ?) t")
        .bind(websiteId, visitorUrl)
        .first("total");
      resData["pageUv"] = Number(total);
    }

    return c.json({ code: 200, message: "success", times, data: resData }, 200);
  } catch (e) {
    console.error(e);
    return c.json({ code: 500, message: e.message, data: null, times: Date.now() }, 500);
  }
});

// 错误处理
app.onError((err, c) => {
  console.error(err);
  return c.json({ code: 500, message: err.message, data: null, times: Date.now() }, 500);
});

// 处理404
app.notFound((c) => c.text(null, 404));

export default app;
