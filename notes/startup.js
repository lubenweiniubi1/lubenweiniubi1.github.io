const express = require("express");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

const NOTES_DIR = __dirname;
const PORT = process.env.PORT || 3001;

// ============================================================
// 1. 扫描 notes 目录，返回按文件夹分组的 md 文件列表
// ============================================================
function scanNotes(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const folders = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith("_") || entry.name === "node_modules") continue;

    const folderPath = path.join(dirPath, entry.name);
    const { files, groups } = scanFolder(folderPath);

    folders.push({ folder: entry.name, files, groups });
  }

  folders.sort((a, b) => a.folder.localeCompare(b.folder));
  return folders;
}

/**
 * 扫描单层目录，区分顶层 .md 文件和子目录分组
 */
function scanFolder(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const files = [];
  const groups = [];

  for (const entry of entries) {
    if (entry.name.startsWith("_") || entry.name === "node_modules") continue;
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      const groupFiles = fs.readdirSync(fullPath)
        .filter(f => f.endsWith(".md"))
        .sort();
      if (groupFiles.length > 0) {
        groups.push({ name: entry.name, files: groupFiles });
      }
    } else if (entry.name.endsWith(".md")) {
      files.push(entry.name);
    }
  }

  files.sort();
  return { files, groups };
}

// ============================================================
// 2. 文件夹图标映射
// ============================================================
const FOLDER_ICONS = {
  "基础概念": { icon: "📘", bg: "#eef1ff" },
  "高级使用": { icon: "📙", bg: "#fff3e0" },
  "redux":     { icon: "📗", bg: "#e8f5e9" },
  "原理":      { icon: "📓", bg: "#fce4ec" },
  "webpack":   { icon: "📦", bg: "#e3f2fd" },
  "babel":     { icon: "🔧", bg: "#f3e5f5" },
  "面试题":    { icon: "🎯", bg: "#fff8e1" },
  "工具":      { icon: "🛠️", bg: "#e0f2f1" },
};

function getFolderStyle(folderName) {
  for (const [key, val] of Object.entries(FOLDER_ICONS)) {
    if (folderName.includes(key)) return val;
  }
  return { icon: "📂", bg: "#f0f3f8" };
}

// ============================================================
// 3. 生成 HTML（服务端渲染）
// ============================================================
function renderPage(folders) {
  let totalFiles = 0;
  let nonEmpty = 0;
  folders.forEach(f => {
    const count = f.files.length + f.groups.reduce((s, g) => s + g.files.length, 0);
    totalFiles += count;
    if (count) nonEmpty++;
  });

  function renderFileList(folderName, groupName, fileList, groupPrefix) {
    let html = '<ul class="file-list">';
    fileList.forEach(file => {
      const name = file.replace(/\.md$/, "");
      const href = "/" + encodeURIComponent(folderName) + "/"
        + (groupPrefix ? encodeURIComponent(groupPrefix) + "/" : "")
        + encodeURIComponent(file);
      html += `
        <li class="file-item" data-keywords="${folderName} ${groupName} ${name} ${file}">
          <a class="file-link" href="${href}">
            <span class="file-icon md">📄</span>
            <span class="file-name">${name}</span>
            <span class="file-arrow">→</span>
          </a>
        </li>`;
    });
    html += '</ul>';
    return html;
  }

  let sectionsHtml = "";
  folders.forEach(sec => {
    const secFileCount = sec.files.length;
    const secGroupCount = sec.groups.reduce((s, g) => s + g.files.length, 0);
    const totalCount = secFileCount + secGroupCount;
    const isEmpty = totalCount === 0;
    const { icon, bg } = getFolderStyle(sec.folder);

    sectionsHtml += `
      <div class="section${isEmpty ? " section-empty" : ""}" data-folder="${sec.folder}">
        <div class="section-header">
          <div class="section-icon" style="background:${bg}">${icon}</div>
          <span class="section-title">${sec.folder}</span>
          <span class="section-count">${totalCount} 篇</span>
        </div>`;

    // 顶层直连的 .md 文件
    if (secFileCount > 0) {
      sectionsHtml += renderFileList(sec.folder, "", sec.files, "");
    }

    // 子目录分组（默认折叠）
    sec.groups.forEach(group => {
      sectionsHtml += `
        <div class="sub-section">
          <div class="sub-section-header toggle-trigger">
            <span class="toggle-icon">▶</span>
            <span class="sub-section-icon">📂</span>
            <span class="sub-section-title">${group.name.replace(/^\d+-/, "")}</span>
            <span class="section-count">${group.files.length} 篇</span>
          </div>
          <div class="toggle-body">`;
      sectionsHtml += renderFileList(sec.folder, group.name, group.files, group.name);
      sectionsHtml += '</div></div>';
    });

    sectionsHtml += '</div>';
  });

  return '<!DOCTYPE html>\n' +
'<html lang="zh-CN">\n' +
'<head>\n' +
'  <meta charset="UTF-8">\n' +
'  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
'  <title>📒 学习笔记导航</title>\n' +
'  <style>\n' +
'    :root {\n' +
'      --bg: #f8f9fb; --card-bg: #ffffff; --text: #2c3e50;\n' +
'      --text-secondary: #6b7c93; --border: #e8ecf1;\n' +
'      --accent: #4f6ef7; --tag-bg: #f0f3f8;\n' +
'      --shadow: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);\n' +
'      --shadow-hover: 0 4px 12px rgba(0,0,0,0.08);\n' +
'    }\n' +
'    * { margin:0; padding:0; box-sizing:border-box; }\n' +
'    body {\n' +
'      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,\n' +
'        "Helvetica Neue", Arial, "Noto Sans SC", sans-serif;\n' +
'      background: var(--bg); color: var(--text); line-height: 1.6; min-height: 100vh;\n' +
'    }\n' +
'    .header {\n' +
'      background: linear-gradient(135deg, #4f6ef7, #7c5cfc);\n' +
'      color: #fff; padding: 48px 24px 40px; text-align: center;\n' +
'    }\n' +
'    .header h1 { font-size: 2rem; font-weight: 700; letter-spacing: -0.5px; margin-bottom: 6px; }\n' +
'    .header p  { opacity: 0.85; font-size: 0.95rem; }\n' +
'    .search-wrapper {\n' +
'      max-width: 520px; margin: -20px auto 0; padding: 0 24px; position: relative; z-index: 10;\n' +
'    }\n' +
'    .search-box {\n' +
'      width: 100%; padding: 14px 20px 14px 48px; border: 1.5px solid var(--border);\n' +
'      border-radius: 50px; font-size: 1rem; background: var(--card-bg);\n' +
'      box-shadow: var(--shadow); outline: none;\n' +
'      transition: border-color 0.2s, box-shadow 0.2s;\n' +
'    }\n' +
'    .search-box:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(79,110,247,0.15); }\n' +
'    .search-icon { position: absolute; left: 42px; top: 50%; transform: translateY(-50%); color: #9aa5b8; pointer-events: none; font-size: 1.1rem; }\n' +
'    .container { max-width: 900px; margin: 0 auto; padding: 36px 24px 64px; }\n' +
'    .stats { display: flex; gap: 16px; margin-bottom: 32px; flex-wrap: wrap; }\n' +
'    .stat-card { flex: 1; min-width: 100px; background: var(--card-bg); border-radius: 8px; padding: 16px 20px; text-align: center; box-shadow: var(--shadow); }\n' +
'    .stat-card .num { font-size: 1.8rem; font-weight: 700; color: var(--accent); }\n' +
'    .stat-card .label { font-size: 0.8rem; color: var(--text-secondary); margin-top: 2px; }\n' +
'    .section { margin-bottom: 32px; }\n' +
'    .section-header { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }\n' +
'    .section-icon { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; }\n' +
'    .section-title { font-size: 1.15rem; font-weight: 600; }\n' +
'    .section-count { font-size: 0.8rem; color: var(--text-secondary); background: var(--tag-bg); padding: 2px 10px; border-radius: 20px; margin-left: auto; }\n' +
'    .section-empty .section-title { color: #bcc3ce; }\n' +
'    .section-empty .section-icon { opacity: 0.4; }\n' +
'    .sub-section { margin: 0 0 10px 14px; padding-left: 14px; border-left: 2px solid var(--border); }\n' +
'    .sub-section-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; padding-top: 2px; }\n' +
'    .toggle-trigger { cursor: pointer; user-select: none; }\n' +
'    .toggle-trigger:hover .sub-section-title { color: var(--accent); }\n' +
'    .toggle-icon { font-size: 0.65rem; color: #9aa5b8; transition: transform 0.2s; flex-shrink: 0; width: 12px; text-align: center; }\n' +
'    .toggle-body.collapsed { display: none; }\n' +
'    .sub-section-icon { font-size: 0.95rem; flex-shrink: 0; }\n' +
'    .sub-section-title { font-size: 0.95rem; font-weight: 500; color: var(--text-secondary); }\n' +
'    .file-list { list-style: none; display: grid; gap: 6px; }\n' +
'    .file-item { background: var(--card-bg); border-radius: 8px; box-shadow: var(--shadow); transition: box-shadow 0.2s, transform 0.15s; }\n' +
'    .file-item:hover { box-shadow: var(--shadow-hover); transform: translateY(-1px); }\n' +
'    .file-link { display: flex; align-items: center; gap: 12px; padding: 12px 18px; text-decoration: none; color: var(--text); border-radius: 8px; }\n' +
'    .file-icon { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 1rem; flex-shrink: 0; }\n' +
'    .file-icon.md { background: #eef1ff; }\n' +
'    .file-name { font-size: 0.95rem; font-weight: 500; flex: 1; }\n' +
'    .file-arrow { color: #c0c7d2; font-size: 0.85rem; transition: color 0.2s, transform 0.2s; }\n' +
'    .file-link:hover .file-arrow { color: var(--accent); transform: translateX(3px); }\n' +
'    .hidden { display: none !important; }\n' +
'    .footer { text-align: center; color: var(--text-secondary); font-size: 0.8rem; padding: 32px 0 24px; border-top: 1px solid var(--border); margin-top: 16px; }\n' +
'    @media (max-width: 640px) {\n' +
'      .header { padding: 36px 16px 32px; } .header h1 { font-size: 1.5rem; }\n' +
'      .container { padding: 24px 16px 48px; } .stat-card { padding: 12px 14px; } .stat-card .num { font-size: 1.4rem; }\n' +
'    }\n' +
'  </style>\n' +
'</head>\n' +
'<body>\n' +
'\n' +
'<header class="header">\n' +
'  <h1>📒 学习笔记</h1>\n' +
'  <p>React · Redux · Webpack · Babel · 面试题</p>\n' +
'</header>\n' +
'\n' +
'<div class="search-wrapper">\n' +
'  <span class="search-icon">🔍</span>\n' +
'  <input type="text" class="search-box" id="searchInput" placeholder="搜索笔记..." autocomplete="off">\n' +
'</div>\n' +
'\n' +
'<main class="container">\n' +
'  <div class="stats">\n' +
'    <div class="stat-card"><div class="num">' + nonEmpty + '</div><div class="label">分类</div></div>\n' +
'    <div class="stat-card"><div class="num">' + totalFiles + '</div><div class="label">笔记</div></div>\n' +
'    <div class="stat-card"><div class="num">' + folders.length + '</div><div class="label">模块</div></div>\n' +
'  </div>\n' +
'  <div id="sectionsArea">' + sectionsHtml + '</div>\n' +
'</main>\n' +
'\n' +
'<footer class="footer">\n' +
'  <p>🔄 Express 服务端渲染 — 每次刷新自动扫描最新笔记</p>\n' +
'</footer>\n' +
'\n' +
'<script>\n' +
'(function(){\n' +
'  // 子目录折叠切换\n' +
'  document.querySelectorAll(".toggle-trigger").forEach(function(h){\n' +
'    h.addEventListener("click",function(){\n' +
'      var body=this.nextElementSibling;\n' +
'      var icon=this.querySelector(".toggle-icon");\n' +
'      if(body){body.classList.toggle("collapsed");}\n' +
'      if(icon){icon.textContent=body&&body.classList.contains("collapsed")?"▶":"▼";}\n' +
'    });\n' +
'    // 默认折叠\n' +
'    var body=h.nextElementSibling;\n' +
'    if(body){body.classList.add("collapsed");}\n' +
'  });\n' +
'  // 搜索过滤\n' +
'  var i=document.getElementById("searchInput");\n' +
'  i.addEventListener("input",function(){\n' +
'    var q=i.value.trim().toLowerCase();\n' +
'    document.querySelectorAll(".section").forEach(function(s){\n' +
'      var v=0;\n' +
'      s.querySelectorAll(".file-item").forEach(function(t){\n' +
'        var k=(t.getAttribute("data-keywords")||"").toLowerCase();\n' +
'        if(!q||k.indexOf(q)!==-1){t.classList.remove("hidden");v++;}else{t.classList.add("hidden");}\n' +
'      });\n' +
'      s.classList.toggle("hidden",!!q&&v===0);\n' +
'    });\n' +
'    // 搜索时自动展开匹配的子目录\n' +
'    if(q){\n' +
'      document.querySelectorAll(".toggle-trigger").forEach(function(h){\n' +
'        var body=h.nextElementSibling;\n' +
'        var hasVisible=body&&body.querySelector(".file-item:not(.hidden)");\n' +
'        if(hasVisible){body.classList.remove("collapsed");h.querySelector(".toggle-icon").textContent="▼";}\n' +
'      });\n' +
'    }\n' +
'  });\n' +
'})();\n' +
'</script>\n' +
'\n' +
'</body>\n' +
'</html>';
}

// ============================================================
// 4. Express 应用
// ============================================================
const app = express();

// 首页路由 — 服务端渲染
app.get(["/", "/index.html", "/startup.html"], (_req, res, next) => {
  try {
    const folders = scanNotes(NOTES_DIR);
    res.type("html").send(renderPage(folders));
  } catch (err) {
    next(err);
  }
});

// 静态文件服务 — 托管 .md / _assets 等
app.use(express.static(NOTES_DIR, {
  setHeaders(res, filePath) {
    if (filePath.endsWith(".md")) {
      res.set("Content-Type", "text/markdown; charset=utf-8");
    }
  }
}));

// 404
app.use((_req, res) => {
  res.status(404).type("html").send('<!DOCTYPE html>\n<html lang="zh-CN"><head><meta charset="UTF-8"><title>404</title></head>\n<body style="font-family:sans-serif;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;background:#f8f9fb;">\n<div style="text-align:center"><h1 style="font-size:4rem;color:#4f6ef7;margin:0">404</h1>\n<p style="color:#6b7c93">页面未找到</p>\n<a href="/" style="color:#4f6ef7">← 返回首页</a></div></body></html>');
});

// 错误处理
app.use((err, _req, res, _next) => {
  console.error("服务器错误:", err);
  res.status(500).type("text").send("服务器错误: " + err.message);
});

// ============================================================
// 5. 启动
// ============================================================
app.listen(PORT, () => {
  const url = "http://localhost:" + PORT;
  console.log("✅ 笔记导航已启动: " + url);
  console.log("📁 扫描目录: " + NOTES_DIR);
  console.log("🔁 按 Ctrl+C 停止\n");

  // 自动打开浏览器
  exec(`open ${url}`);
});
