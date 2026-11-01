# ChatGPT 账户分发页面（success-action）

用中文交流。用户是理论物理博士后，正在转向 AI；解释要简短，只讲最主要的点。

## 用途

给几个朋友分发 ChatGPT Business 账户：每人输入自己的访问密码 + 图片验证码，看到自己账户的邮箱、密码和实时 6 位 2FA 验证码。不做自动登录。

- 网址：https://stephenliu1884-hub.github.io/success-action/
- 仓库：https://github.com/stephenliu1884-hub/success-action （Public，GitHub Pages 从 `main` 分支根目录部署）

## 结构（纯静态站点，没有后端）

- `index.html` — 朋友用的页面。用访问密码解密 `data.js` 里的记录，前端计算 TOTP
- `admin.html` — 只在本地用。填写账户、上传 2FA 二维码（jsQR 本地解码），生成加密后的 `data.js`
- `data.js` — 只含密文，可以公开。由 admin.html 生成，用户自己下载覆盖
- `crypto.js` — PBKDF2-SHA256（60 万次）+ AES-GCM；`unlockAny` 用同一密码逐条尝试，无需用户名
- `totp.js` — RFC 6238 TOTP
- `captcha.js` — 图片验证码，纯前端，只是装饰性的，不增加真正的安全性
- `test/` — `npm test`，用 RFC 官方测试向量验证

## 更新流程

1. 启动本地服务器：`python -m http.server 8000 --bind 127.0.0.1`（必须通过 http 打开，双击文件会导致 import 失败）
2. 用户在 http://127.0.0.1:8000/admin.html 重新填写**全部**账户（admin 不保存任何数据），下载 data.js 覆盖项目里的旧文件
3. 用户在 http://127.0.0.1:8000/index.html 测试（Ctrl+Shift+R 强制刷新）
4. 用户说「上传」后：`npm test`，然后 `git add -A`、commit、`git push`；约 30 秒后网站更新

## 规则

- 不要读取或索要真实的 ChatGPT 密码、2FA 密钥/二维码、访问密码；测试只用假数据
- 二维码图片不能放进仓库（`.gitignore` 已忽略图片）
- 访问密码至少 12 位（admin.html 中校验）

## 环境注意

- Windows + PowerShell 5.1。新装的 node/git 若不在 PATH，先刷新：
  `$env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User')`
- git 提交身份已在本仓库配置（GitHub 隐私邮箱）；推送凭据由 Windows 凭据管理器保存
