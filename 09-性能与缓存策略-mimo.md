# 性能与缓存策略

- **日期**：2026-08-21
- **版本**：v1.0
- **适用范围**：适用于中小型 Web 应用的性能优化与缓存策略设计。本文使用通用场景示例（博客平台、电商后台等），不绑定特定项目，方法论不限于特定技术栈。

---

## 第一篇：方法论

性能优化不是凭感觉的"让代码跑快一点"，而是基于数据的系统性工程。本篇建立性能优化的基本思维框架，帮助你在面对性能问题时知道该做什么、先做什么。

### 第一章：性能思维

#### 1.1 先测量再优化

**核心原则**：不要凭感觉优化，用数据说话。

性能优化最常见的错误是"我觉得这里慢"。在没有测量数据的情况下进行优化，可能浪费时间在不是瓶颈的地方，甚至可能让性能变得更差。

**正确流程**：

1. **测量当前性能**：使用工具获取基准数据
2. **识别瓶颈**：找到真正拖慢系统的地方
3. **优化瓶颈**：针对具体问题进行优化
4. **验证效果**：确认优化确实有效

> **示例——博客平台场景**：页面加载慢，你"感觉"是图片太大。但测量后发现，真正的问题是某个 JavaScript 库占用了 80% 的加载时间。优化图片只能改善 5% 的加载时间，而替换那个库可以改善 40%。

**常用测量工具**：

| 环节 | 工具 | 测量内容 |
|------|------|----------|
| 前端加载 | Chrome DevTools Network | 资源加载时间、体积 |
| 前端渲染 | Chrome DevTools Performance | 渲染阻塞、重排重绘 |
| 前端综合 | Lighthouse | 综合性能评分 |
| 后端响应 | APM 工具（如 New Relic） | 接口响应时间、数据库查询时间 |
| 数据库 | EXPLAIN 分析 | 查询执行计划、索引使用情况 |

#### 1.2 性能指标

性能指标分两类：**客观指标**和**主观感受**。两者都需要关注。

**客观指标**（可通过工具测量）：

| 指标 | 全称 | 含义 | 目标值 |
|------|------|------|--------|
| FCP | First Contentful Paint | 首次内容绘制，用户看到第一个像素的时间 | < 1.8s |
| LCP | Largest Contentful Paint | 最大内容绘制，主要内容可见的时间 | < 2.5s |
| TTI | Time to Interactive | 可交互时间，用户可以开始操作的时间 | < 3.8s |
| CLS | Cumulative Layout Shift | 累积布局偏移，页面布局稳定性 | < 0.1 |
| FID | First Input Delay | 首次输入延迟，用户操作的响应速度 | < 100ms |

**主观感受**：

- **流畅度**：滚动、动画是否卡顿
- **响应速度**：点击按钮后多久有反馈
- **等待感知**：加载过程中是否有进度提示

**测量方法**：

```javascript
// 前端性能测量示例
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    console.log(`${entry.name}: ${entry.startTime}ms`);
  }
});
observer.observe({ entryTypes: ['paint', 'largest-contentful-paint'] });
```

#### 1.3 性能优化三阶段

性能优化是一个迭代过程，分为三个阶段：

```
发现瓶颈 → 定位原因 → 针对优化
   ↑                    ↓
   └────── 验证效果 ←───┘
```

**阶段一：发现瓶颈**

- 收集用户反馈（"页面加载慢"、"操作卡顿"）
- 分析监控数据（响应时间、错误率）
- 进行性能测试（压测、基准测试）

**阶段二：定位原因**

- 使用分析工具定位具体问题
- 区分是前端问题还是后端问题
- 区分是加载问题、渲染问题还是数据问题

**阶段三：针对优化**

- 根据原因选择合适的优化策略
- 评估优化成本和收益
- 实施优化并验证效果

#### 1.4 性能优化决策树

从发现问题到定位原因的决策流程：

```
性能问题
├── 加载慢？
│   ├── 首屏加载慢？
│   │   ├── 资源体积大？→ 优化包体积（代码拆分、压缩）
│   │   ├── 请求数量多？→ 合并请求、使用 CDN
│   │   └── 服务器响应慢？→ 优化后端、使用缓存
│   └── 后续加载慢？
│       ├── 数据加载慢？→ 优化查询、添加索引
│       └── 渲染阻塞？→ 优化渲染逻辑、使用 Web Worker
├── 渲染卡顿？
│   ├── 动画卡顿？→ 使用 GPU 加速、减少重排
│   ├── 列表卡顿？→ 使用虚拟列表
│   └── 重渲染过多？→ 使用 memo、优化状态管理
├── 交互延迟？
│   ├── 点击响应慢？→ 优化事件处理、减少同步操作
│   ├── 输入延迟？→ 优化输入处理、使用防抖
│   └── 页面切换慢？→ 路由懒加载、预加载
└── 内存问题？
    ├── 内存泄漏？→ 检查事件监听、定时器清理
    └── 内存占用高？→ 优化数据结构、分页加载
```

---

### 第一篇快速参考卡

- [ ] 遇到性能问题时，先测量数据，不凭感觉优化
- [ ] 使用 Lighthouse 获取客观性能指标（FCP < 1.8s, LCP < 2.5s, TTI < 3.8s）
- [ ] 性能优化三阶段：发现瓶颈 → 定位原因 → 针对优化
- [ ] 使用决策树快速定位问题类型（加载/渲染/交互/内存）
- [ ] 优化后必须验证效果，确保改进有效

---

## 第二篇：优化实践

本篇提供具体的优化技术，覆盖加载性能、渲染性能和数据性能三个维度。每个优化点都给出实践方法和注意事项。

### 第二章：加载性能

加载性能决定了用户等待的时间。目标是让关键内容尽快显示，非关键内容按需加载。

#### 2.1 包体积控制

包体积直接影响加载速度。每减少 100KB，3G 网络下加载时间减少约 1 秒。

**代码拆分**：

将代码按功能模块拆分，用户只加载当前需要的代码。

```javascript
// ❌ 不好：一次性加载所有功能
import { Dashboard } from './Dashboard';
import { Settings } from './Settings';
import { Reports } from './Reports';

// ✅ 好：按需加载
const Dashboard = lazy(() => import('./Dashboard'));
const Settings = lazy(() => import('./Settings'));
const Reports = lazy(() => import('./Reports'));
```

**Tree Shaking**：

移除未使用的代码。确保构建工具启用 Tree Shaking。

```javascript
// ❌ 不好：导入整个库
import _ from 'lodash';
_.debounce(fn, 300);

// ✅ 好：只导入需要的函数
import debounce from 'lodash/debounce';
debounce(fn, 300);
```

**动态导入**：

根据用户操作或路由切换动态加载代码。

```javascript
// 路由懒加载
const routes = [
  {
    path: '/dashboard',
    component: () => import('./pages/Dashboard')
  },
  {
    path: '/settings',
    component: () => import('./pages/Settings')
  }
];
```

**体积监控**：

- 使用 `webpack-bundle-analyzer` 分析包体积
- 设置体积预算（如：主包 < 200KB，总包 < 500KB）
- 在 CI 中监控体积变化

#### 2.2 懒加载策略

懒加载将非关键资源延迟到需要时再加载。

**图片懒加载**：

```html
<!-- 使用原生 lazy loading -->
<img src="product.jpg" loading="lazy" alt="产品图片" />

<!-- 或使用 Intersection Observer -->
<img data-src="product.jpg" class="lazy" alt="产品图片" />
```

```javascript
// Intersection Observer 实现
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target;
      img.src = img.dataset.src;
      observer.unobserve(img);
    }
  });
});

document.querySelectorAll('.lazy').forEach(img => observer.observe(img));
```

**路由懒加载**：

```javascript
// React 路由懒加载
const OrderList = React.lazy(() => import('./features/orders/OrderList'));
const ProductDetail = React.lazy(() => import('./features/products/ProductDetail'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/orders" element={<OrderList />} />
        <Route path="/products/:id" element={<ProductDetail />} />
      </Routes>
    </Suspense>
  );
}
```

**组件懒加载**：

对于不常用的组件（如模态框、富文本编辑器），按需加载。

```javascript
// 使用时才加载
async function openEditor() {
  const { default: RichTextEditor } = await import('./RichTextEditor');
  // 渲染编辑器
}
```

**预加载**：

对于用户很可能访问的资源，提前加载。

```html
<!-- 预加载关键资源 -->
<link rel="preload" href="/fonts/main.woff2" as="font" type="font/woff2" crossorigin />
<link rel="preload" href="/api/data" as="fetch" crossorigin />
```

#### 2.3 资源优化

**图片压缩**：

- 使用 WebP 格式（比 JPEG 小 25-34%）
- 根据显示尺寸选择合适分辨率
- 使用响应式图片（`srcset`）

```html
<picture>
  <source srcset="image.webp" type="image/webp" />
  <img src="image.jpg" alt="图片" width="400" height="300" />
</picture>
```

**字体优化**：

- 只加载需要的字重
- 使用 `font-display: swap` 避免文字隐藏
- 考虑系统字体栈作为备选

```css
@font-face {
  font-family: 'CustomFont';
  src: url('/fonts/custom.woff2') format('woff2');
  font-display: swap;
}

body {
  font-family: 'CustomFont', -apple-system, BlinkMacSystemFont, sans-serif;
}
```

**CDN 策略**：

- 静态资源使用 CDN
- 启用 Gzip/Brotli 压缩
- 设置合理的缓存头

```
# Nginx 配置示例
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

---

### 第三章：渲染性能

渲染性能决定了页面是否流畅。目标是保持 60fps 的渲染帧率。

#### 3.1 重渲染控制

React 应用中，不必要的重渲染是常见的性能问题。

**React.memo**：

当组件的 props 不变时，避免重新渲染。

```javascript
// ❌ 不好：每次父组件渲染，子组件都重新渲染
function OrderList({ orders }) {
  return (
    <div>
      {orders.map(order => <OrderCard key={order.id} order={order} />)}
    </div>
  );
}

// ✅ 好：使用 React.memo 包装子组件
const OrderCard = React.memo(({ order }) => {
  return (
    <div className="order-card">
      <h3>{order.title}</h3>
      <p>{order.status}</p>
    </div>
  );
});
```

**useMemo**：

缓存计算结果，避免重复计算。

```javascript
function OrderList({ orders, filter }) {
  // ❌ 不好：每次渲染都重新计算
  const filteredOrders = orders.filter(o => o.status === filter);

  // ✅ 好：使用 useMemo 缓存计算结果
  const filteredOrders = useMemo(() => {
    return orders.filter(o => o.status === filter);
  }, [orders, filter]);

  return (
    <div>
      {filteredOrders.map(order => <OrderCard key={order.id} order={order} />)}
    </div>
  );
}
```

**useCallback**：

缓存函数引用，避免子组件不必要的重渲染。

```javascript
function OrderList({ orders }) {
  // ❌ 不好：每次渲染都创建新函数
  const handleSelect = (id) => {
    console.log('Selected:', id);
  };

  // ✅ 好：使用 useCallback 缓存函数
  const handleSelect = useCallback((id) => {
    console.log('Selected:', id);
  }, []);

  return (
    <div>
      {orders.map(order => (
        <OrderCard
          key={order.id}
          order={order}
          onSelect={handleSelect}
        />
      ))}
    </div>
  );
}
```

**使用时机**：

| 方法 | 适用场景 | 不适用场景 |
|------|----------|------------|
| React.memo | 纯展示组件、props 不常变化 | 组件频繁更新、props 每次都变 |
| useMemo | 计算代价高、依赖不常变化 | 简单计算、依赖频繁变化 |
| useCallback | 传递给子组件的回调函数 | 函数只在当前组件使用 |

#### 3.2 虚拟列表

当列表数据量很大（>1000 条）时，一次性渲染所有项会导致性能问题。虚拟列表只渲染可见区域的项。

**实现原理**：

```
┌─────────────────────────────────┐
│  可见区域（渲染 10-20 项）        │
├─────────────────────────────────┤
│  上方不可见区域（占位高度）        │
├─────────────────────────────────┤
│  下方不可见区域（占位高度）        │
└─────────────────────────────────┘
```

**使用 react-window**：

```javascript
import { FixedSizeList } from 'react-window';

function OrderList({ orders }) {
  const Row = ({ index, style }) => (
    <div style={style} className="order-row">
      <OrderCard order={orders[index]} />
    </div>
  );

  return (
    <FixedSizeList
      height={600}
      width="100%"
      itemCount={orders.length}
      itemSize={80}
    >
      {Row}
    </FixedSizeList>
  );
}
```

**注意事项**：

- 需要固定行高（或使用 VariableSizeList）
- 搜索/筛选需要重置滚动位置
- 键盘导航需要特殊处理

#### 3.3 动画优化

流畅的动画需要保持 60fps（每帧 16.67ms）。

**GPU 加速**：

使用 `transform` 和 `opacity` 进行动画，这两个属性可以被 GPU 加速。

```css
/* ❌ 不好：触发重排 */
.box {
  animation: move 1s ease;
}
@keyframes move {
  from { left: 0; }
  to { left: 100px; }
}

/* ✅ 好：使用 transform，只触发合成 */
.box {
  animation: move 1s ease;
}
@keyframes move {
  from { transform: translateX(0); }
  to { transform: translateX(100px); }
}
```

**will-change 属性**：

提前告知浏览器某个元素将要进行动画。

```css
.box {
  will-change: transform;
  transition: transform 0.3s ease;
}
.box:hover {
  transform: scale(1.1);
}
```

**避免重排**：

重排（Reflow）是性能杀手。批量读写 DOM。

```javascript
// ❌ 不好：交替读写 DOM
element.style.width = '100px';
console.log(element.offsetHeight); // 触发重排
element.style.height = '100px';

// ✅ 好：批量读取，批量写入
const width = element.offsetWidth;
const height = element.offsetHeight;
element.style.width = width + 'px';
element.style.height = height + 'px';
```

---

### 第四章：数据性能

数据性能决定了业务操作的响应速度。目标是快速查询、快速展示、快速同步。

#### 4.1 数据库查询优化

**索引优化**：

为经常查询的字段添加索引。

```sql
-- ❌ 不好：全表扫描
SELECT * FROM orders WHERE customer_name = '张三';

-- ✅ 好：添加索引
CREATE INDEX idx_customer_name ON orders(customer_name);
SELECT * FROM orders WHERE customer_name = '张三';
```

**索引设计原则**：

- 为 WHERE、JOIN、ORDER BY 子句中的字段添加索引
- 复合索引遵循最左前缀原则
- 避免在索引列上使用函数
- 控制索引数量（每个表不超过 5-6 个）

**查询优化**：

```sql
-- ❌ 不好：SELECT *
SELECT * FROM orders WHERE status = 'pending';

-- ✅ 好：只查询需要的字段
SELECT id, title, status, created_at
FROM orders
WHERE status = 'pending';
```

**批量操作**：

```javascript
// ❌ 不好：逐条插入
for (const item of items) {
  await db.insert('orders', item);
}

// ✅ 好：批量插入
await db.batchInsert('orders', items);
```

#### 4.2 搜索性能

**全文搜索**：

对于文本搜索，使用数据库的全文搜索功能。

```sql
-- PostgreSQL 全文搜索
SELECT * FROM articles
WHERE to_tsvector('english', title || ' ' || content)
  @@ to_tsquery('english', 'search term');
```

**模糊搜索优化**：

```sql
-- ❌ 不好：前缀通配符无法使用索引
SELECT * FROM products WHERE name LIKE '%手机%';

-- ✅ 好：后缀通配符可以使用索引
SELECT * FROM products WHERE name LIKE '手机%';

-- 或使用全文搜索
SELECT * FROM products
WHERE to_tsvector('simple', name) @@ to_tsquery('simple', '手机');
```

**搜索建议**：

- 使用防抖减少请求频率（300ms）
- 实现搜索结果缓存
- 提供搜索历史和热门搜索

#### 4.3 同步引擎优化

**增量同步**：

只同步变化的数据，而不是全量同步。

```javascript
// 增量同步：只获取变化的数据
const lastSyncTime = await getLastSyncTime();
const changes = await fetch('/api/sync', {
  method: 'POST',
  body: JSON.stringify({ since: lastSyncTime })
});
```

**批量同步**：

将多次操作合并为一次请求。

```javascript
// ❌ 不好：逐条同步
for (const item of changes) {
  await syncItem(item);
}

// ✅ 好：批量同步
await batchSync(changes);
```

**冲突处理**：

- 最后写入胜出（Last Write Wins）
- 版本向量（Vector Clocks）
- 操作转换（Operational Transformation）

---

### 第二篇快速参考卡

**加载性能**：

- [ ] 代码拆分：按功能模块拆分，用户只加载需要的代码
- [ ] Tree Shaking：移除未使用的代码
- [ ] 懒加载：图片、路由、组件按需加载
- [ ] 资源优化：WebP 图片、字体优化、CDN 加速

**渲染性能**：

- [ ] React.memo：避免纯展示组件不必要的重渲染
- [ ] useMemo：缓存高代价计算结果
- [ ] useCallback：缓存传递给子组件的回调函数
- [ ] 虚拟列表：大数据量列表只渲染可见区域
- [ ] GPU 加速：使用 transform 和 opacity 进行动画

**数据性能**：

- [ ] 索引优化：为查询字段添加索引
- [ ] 查询优化：只查询需要的字段，避免 SELECT *
- [ ] 批量操作：批量插入、批量更新
- [ ] 增量同步：只同步变化的数据

---

## 第三篇：缓存策略

缓存是用空间换时间的经典策略。合理的缓存设计可以显著提升性能，但不合理的缓存会导致数据不一致和用户体验问题。

### 第五章：缓存分层设计

#### 5.1 缓存层级

现代 Web 应用通常使用多层缓存，从近到远：

| 层级 | 位置 | 存储内容 | 有效期 | 特点 |
|------|------|----------|--------|------|
| 第一层 | 内存（变量） | 计算结果、查询结果 | 会话期间 | 速度最快，容量最小 |
| 第二层 | 本地数据库（IndexedDB） | 用户数据、配置 | 长期 | 持久化，支持查询 |
| 第三层 | Service Worker | 静态资源、API 响应 | 可配置 | 离线可用，拦截请求 |
| 第四层 | HTTP 缓存 | 静态资源、API 响应 | 可配置 | 浏览器自动管理 |

**选择策略**：

- **频繁访问、不常变化** → 内存缓存（如配置数据）
- **需要持久化、需要查询** → 本地数据库（如用户数据）
- **需要离线访问** → Service Worker（如页面资源）
- **可以被浏览器自动管理** → HTTP 缓存（如静态资源）

#### 5.2 缓存分层架构图

```
用户请求
    │
    ▼
┌─────────────────────────────────────────────────────┐
│  第一层：内存缓存（变量/Map）                          │
│  - 计算结果缓存                                      │
│  - 查询结果缓存                                      │
│  - 有效期：会话期间                                   │
└─────────────────────────────────────────────────────┘
    │ 未命中
    ▼
┌─────────────────────────────────────────────────────┐
│  第二层：本地数据库缓存（IndexedDB）                   │
│  - 用户数据                                          │
│  - 应用配置                                          │
│  - 离线数据                                          │
└─────────────────────────────────────────────────────┘
    │ 未命中
    ▼
┌─────────────────────────────────────────────────────┐
│  第三层：Service Worker 缓存                         │
│  - 静态资源（JS/CSS/图片）                           │
│  - API 响应                                          │
│  - 支持离线访问                                       │
└─────────────────────────────────────────────────────┘
    │ 未命中
    ▼
┌─────────────────────────────────────────────────────┐
│  第四层：HTTP 缓存                                   │
│  - 浏览器缓存（强缓存/协商缓存）                      │
│  - CDN 缓存                                          │
│  - 由服务器缓存头控制                                 │
└─────────────────────────────────────────────────────┘
    │ 未命中
    ▼
┌─────────────────────────────────────────────────────┐
│  服务器                                              │
│  - 业务逻辑处理                                      │
│  - 数据库查询                                        │
│  - 生成响应并设置缓存头                               │
└─────────────────────────────────────────────────────┘
```

**数据流向**：

```
请求 → 内存缓存 → 本地数据库 → Service Worker → HTTP 缓存 → 服务器
       ↓ 命中    ↓ 命中        ↓ 命中           ↓ 命中
       直接返回  直接返回      拦截返回         直接返回
```

#### 5.3 TTL 设计

TTL（Time To Live）决定缓存的有效期。不同类型的数据需要不同的 TTL。

| 数据类型 | TTL 策略 | 示例 |
|----------|----------|------|
| 静态资源（版本化） | 长期（1年+） | `app.abc123.js`、`style.def456.css` |
| 静态资源（未版本化） | 短期（1小时） | `logo.png`、`favicon.ico` |
| API 响应（实时性要求高） | 短期（0-5分钟） | 订单列表、库存信息 |
| API 响应（实时性要求低） | 中期（5-60分钟） | 商品详情、文章内容 |
| 用户配置 | 长期（24小时+） | 用户偏好、界面设置 |
| 会话数据 | 会话期间 | 登录状态、购物车 |

**TTL 设置示例**：

```javascript
// 静态资源：使用文件哈希，长期缓存
// 文件名：app.abc123.js → 缓存 1 年

// API 响应：根据实时性设置 TTL
const cacheConfig = {
  '/api/orders': { ttl: 5 * 60 * 1000 },      // 5 分钟
  '/api/products': { ttl: 30 * 60 * 1000 },    // 30 分钟
  '/api/config': { ttl: 24 * 60 * 60 * 1000 }  // 24 小时
};
```

#### 5.4 缓存失效机制

数据更新时，需要主动刷新相关缓存。

**主动失效**：

```javascript
// 数据更新后，主动清除相关缓存
async function updateOrder(orderId, data) {
  await api.updateOrder(orderId, data);

  // 清除相关缓存
  cache.delete(`/api/orders/${orderId}`);
  cache.delete('/api/orders');
  cache.delete('/api/dashboard/stats');
}
```

**版本标记**：

```javascript
// 使用版本号标记缓存
const cacheKey = `orders_v${version}`;
```

**时间戳策略**：

```javascript
// 使用更新时间戳
const cacheKey = `orders_${lastUpdateTime}`;
```

#### 5.5 多层缓存一致性

多层缓存之间需要保持数据一致性。

**策略一：写穿透（Write-Through）**

数据更新时，同时更新所有缓存层。

```
更新请求 → 更新内存缓存 → 更新本地数据库 → 更新服务器
```

**优点**：数据一致性好
**缺点**：写入延迟高

**策略二：写回（Write-Back）**

数据更新时，先更新内存缓存，异步更新其他层。

```
更新请求 → 更新内存缓存 → 异步更新本地数据库 → 异步更新服务器
```

**优点**：写入延迟低
**缺点**：数据一致性风险

**策略三：失效通知（Cache Invalidation）**

数据更新时，通知其他层失效。

```
更新请求 → 更新服务器 → 发送失效通知 → 其他层缓存失效
```

**最佳实践**：

- 读多写少的场景：使用写穿透
- 写多读少的场景：使用写回
- 实时性要求高的场景：使用失效通知

#### 5.6 缓存对用户体验的影响

缓存设计需要在加载速度和数据新鲜度之间权衡。

**速度优先场景**：

- 静态资源：长期缓存，使用文件哈希
- 历史数据：中期缓存，定期刷新
- 用户配置：长期缓存，同步更新

**新鲜度优先场景**：

- 实时数据（库存、价格）：不缓存或短 TTL
- 用户操作结果（下单、支付）：立即生效
- 通知消息：实时推送，不使用缓存

**平衡策略**：

```javascript
// 使用 stale-while-revalidate 策略
async function fetchData(key) {
  const cached = await cache.get(key);
  if (cached && !isStale(cached)) {
    return cached.data;
  }

  // 后台更新，立即返回旧数据
  updateCache(key).then(newData => {
    cache.set(key, newData);
  });

  return cached?.data || await fetchFromServer(key);
}
```

**用户体验优化**：

- 加载中显示骨架屏，而不是空白
- 数据更新时显示过渡动画
- 提供手动刷新按钮
- 区分"加载中"和"已是最新"

---

### 第三篇快速参考卡

**缓存分层**：

- [ ] 内存缓存：频繁访问、不常变化的数据
- [ ] 本地数据库：需要持久化、需要查询的数据
- [ ] Service Worker：需要离线访问的资源
- [ ] HTTP 缓存：可以被浏览器自动管理的资源

**TTL 设计**：

- [ ] 静态资源（版本化）：长期缓存（1年+）
- [ ] API 响应（实时性高）：短期缓存（0-5分钟）
- [ ] 用户配置：长期缓存（24小时+）

**缓存失效**：

- [ ] 数据更新时主动清除相关缓存
- [ ] 使用版本号或时间戳标记缓存
- [ ] 根据场景选择写穿透、写回或失效通知

**用户体验**：

- [ ] 加载中显示骨架屏
- [ ] 数据更新时显示过渡动画
- [ ] 提供手动刷新按钮
- [ ] 区分"加载中"和"已是最新"

---

## 附录：性能检查清单

### 开发阶段

- [ ] 代码拆分：按功能模块拆分，避免单一大包
- [ ] Tree Shaking：移除未使用的代码
- [ ] 懒加载：图片、路由、组件按需加载
- [ ] 类型安全：避免 any，使用 unknown
- [ ] 组件优化：使用 React.memo、useMemo、useCallback

### 上线前

- [ ] Lighthouse 测试：FCP < 1.8s，LCP < 2.5s，TTI < 3.8s
- [ ] 包体积检查：主包 < 200KB，总包 < 500KB
- [ ] 图片优化：使用 WebP，压缩图片
- [ ] 字体优化：只加载需要的字重，使用 font-display: swap
- [ ] CDN 配置：静态资源使用 CDN，启用压缩

### 数据库

- [ ] 索引优化：为查询字段添加索引
- [ ] 查询优化：只查询需要的字段，避免 SELECT *
- [ ] 批量操作：批量插入、批量更新
- [ ] 连接池：使用连接池管理数据库连接

### 缓存

- [ ] 缓存分层：内存、本地数据库、Service Worker、HTTP 缓存
- [ ] TTL 设置：根据数据类型设置合理的过期时间
- [ ] 缓存失效：数据更新时主动清除相关缓存
- [ ] 一致性保障：根据场景选择合适的缓存更新策略

### 监控

- [ ] 性能监控：收集 FCP、LCP、TTI 等指标
- [ ] 错误监控：收集前端错误和 API 错误
- [ ] 用户体验监控：收集用户操作和反馈
- [ ] 告警设置：设置性能阈值告警