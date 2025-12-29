# NextTranslation

基于大语言模型的智能翻译解决方案

[快速开始](#快速开始)

## 项目简介

NextTranslation 是一个现代化的全栈翻译平台，提供多种翻译模式和智能翻译引擎支持。

## 主要功能

- 多种翻译模式（简易翻译、Vibe翻译、Spec翻译）
- 多 AI 引擎支持（Anthropic兼容、OpenAI兼容）
- 翻译历史管理
- 个性化翻译设置

## 简易翻译
### 简易翻译截图
<img width="1855" height="1219" alt="image" src="https://github.com/user-attachments/assets/93e28694-8983-4b2c-84c0-1a2b42d7d0ae" />

## Vibe翻译
### Vibe翻译理念
<img width="2752" height="1536" alt="Gemini_Generated_Image_yx1e9jyx1e9jyx1e" src="https://github.com/user-attachments/assets/890fac8a-4db8-402b-afe0-7d2ba79e4b43" />

### Vibe翻译界面截图：
<img width="1859" height="2515" alt="image" src="https://github.com/user-attachments/assets/6a1ff924-9cf3-485c-844e-8e1f7d77d2d1" />


## Spec翻译
### spec翻译的理念：
<img width="2752" height="1536" alt="Gemini_Generated_Image_fvnxcsfvnxcsfvnx" src="https://github.com/user-attachments/assets/8ae90e58-7ee8-478e-a832-3957d1c90609" />

### spec翻译界面截图：
<img width="1856" height="4428" alt="image" src="https://github.com/user-attachments/assets/42a7dc4d-587d-4bae-b4a7-5d6263552c07" />


## 技术栈

### 前端
- **框架**: React 19 + TypeScript
- **构建工具**: Vite 7
- **路由**: TanStack Router
- **状态管理**: Zustand + shadcn/ui
- **UI 组件**: Radix UI
- **样式**: Tailwind CSS 4

### 后端
- **框架**: FastAPI
- **运行时**: Python 3.12+
- **服务器**: Uvicorn
- **AI 引擎**: Anthropic Claude + OpenAI
- **数据验证**: Pydantic

## 环境要求

- **Node.js**: 推荐 18+ 或更高版本
- **Python**: 3.12 或更高版本
- **包管理器**:
  - 前端: npm / pnpm / bun
  - 后端: uv

## 快速开始

### 1. 克隆项目

```bash
git clone <your-repository-url>
cd NextTranslation
```

### 2. 后端设置

#### 安装 uv（如果尚未安装）

**macOS/Linux:**
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows:**
```powershell
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
```

#### 安装后端依赖

```bash
cd backend
uv sync
```

#### 配置环境变量

```python
# 服务器配置（可选，有默认值）
HOST=0.0.0.0
PORT=8000
DEBUG=true
```

#### 启动后端服务

```bash
# 在 backend 目录下
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

后端服务将在 `http://localhost:8000` 启动

### 3. 前端设置

#### 安装前端依赖

```bash
cd frontend
npm install
# 或使用其他包管理器
# pnpm install
# bun install
```

#### 启动前端开发服务器

```bash
npm run dev
# 或
# pnpm dev
# bun dev
```

前端开发服务器将在 `http://localhost:5173` 启动

## 开发命令

### 后端

```bash
cd backend

# 启动开发服务器（热重载）
uv run uvicorn app.main:app --reload

# 添加新依赖
uv add package-name

# 移除依赖
uv remove package-name

# 查看已安装的依赖
uv pip list
```

### 前端

```bash
cd frontend

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview

# 代码检查
npm run lint
```

## 项目结构

```
NextTranslation/
├── backend/                 # 后端服务
│   ├── app/
│   │   ├── routers/        # API 路由
│   │   ├── services/       # 业务逻辑
│   │   ├── models/         # 数据模型
│   │   ├── engines/        # 翻译引擎
│   │   ├── prompts/        # AI 提示词
│   │   ├── config.py       # 配置文件
│   │   └── main.py         # 应用入口
│   ├── pyproject.toml      # Python 项目配置
│   └── uv.lock             # 依赖锁文件
│
└── frontend/               # 前端应用
    ├── src/
    │   ├── components/     # React 组件
    │   ├── pages/          # 页面组件
    │   ├── hooks/          # 自定义 Hooks
    │   ├── stores/         # Zustand 状态管理
    │   └── lib/            # 工具函数
    ├── package.json        # 项目配置
    └── vite.config.ts      # Vite 配置
```

## API 文档

启动后端服务后，可以访问以下地址查看 API 文档：

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## 开发注意事项

1. 确保后端服务在前端之前启动
2. 需要有效的 Anthropic 和 OpenAI API 密钥
3. 开发时后端和前端需要同时运行
4. 前端通过代理或 CORS 访问后端 API

## 常见问题

### 后端启动失败

- 检查 Python 版本是否为 3.12+
- 检查端口 8000 是否被占用

### 前端无法连接后端

- 确认后端服务已启动
- 检查 CORS 配置是否包含前端地址
- 查看浏览器控制台错误信息

### API 密钥错误

- 检查密钥是否有足够的配额

## 许可证
Apache License
Version 2.0, January 2004
http://www.apache.org/licenses/
