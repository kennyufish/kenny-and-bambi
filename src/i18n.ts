export type Language = 'en' | 'zh';

const chinese: Record<string, string> = {
  'Skip to content': '跳到主要内容', 'Work': '作品', 'About': '关于我', 'Resume': '简历', 'Contact': '联系',
  'Kenny Yu, backend software engineer': 'Kenny Yu，后端软件工程师',
  'Kenny coding beside his orange cat': 'Kenny 在橘猫旁边写代码',
  'A hand-drawn animated scene. Kenny types at a computer while Bambi looks around and follows the pointer.': '手绘动画场景：Kenny 在电脑前打字，Bambi 四处张望并跟随指针。',
  'I build dependable Java systems and useful tools, with care for evidence, performance, and the people using them.': '我构建可靠的 Java 系统和实用工具，重视依据、性能，以及真正使用它们的人。',
  'View work': '查看作品', 'Move your pointer. Bambi is watching.': '移动鼠标，Bambi 在看着你。', 'Selected work': '精选项目',
  'Four public projects that show how I measure, organize, and ship software.': '四个公开项目，展示我如何衡量性能、组织系统并交付软件。',
  'Featured web app': '精选 Web 应用',
  "Can't decide where to eat? A cat-shaped order printer picks a random nearby restaurant, filtered by category, cuisine and distance. No sign-up, and your location never leaves the device.": '不知道吃什么？一台猫咪造型的点单打印机帮你随机挑一家附近的餐厅，可按类别、菜系和距离筛选。无需注册，位置信息不会离开你的设备。',
  'Public demo. California only for now.': '公开 Demo，目前仅覆盖加州。',
  'Try the demo': '试玩 Demo',
  'What shall we eat today?': '今天吃什么好？',
  'One less decision at dinner.': '晚饭时少纠结一次。',
  "The demo runs entirely in the browser. Print a ticket for a nearby place, reprint it if you don't like it, or stamp it to keep it. Swipe left to discard, swipe right for details.": 'Demo 完全在浏览器中运行。为附近的餐厅打印一张点单，不满意就重新打印，满意就盖章留下。左滑放弃，右滑查看详情。',
  'Data pipeline': '数据管线', 'In the browser': '浏览器端',
  'A Python script reads the latest Overture Maps places release and writes about 2,800 static JSON tiles. OpenCC and OpenStreetMap supply Chinese names, and GitHub Actions deploys to GitHub Pages.': 'Python 脚本读取最新的 Overture Maps 地点数据，生成约 2,800 个静态 JSON 分片；OpenCC 和 OpenStreetMap 提供中文店名，GitHub Actions 部署到 GitHub Pages。',
  'Plain JavaScript loads only the tiles around you, filters them and draws one at random. There is no build step, no account and nothing saved about your location.': '原生 JavaScript 只加载你附近的分片，筛选后随机抽取一家；没有构建步骤，不需要账号，也不保存任何位置信息。',
  'Public demo, California only. The full version adds a personal restaurant library, dining history, opening hours and wider coverage.': '公开 Demo，仅覆盖加州。完整版将加入个人餐厅库、用餐记录、营业时间和更广的覆盖范围。',
  'Java performance engineering': 'Java 性能工程',
  'A reproducible Spring Boot lab for session reuse and PostgreSQL indexing, with committed methods, raw evidence, Docker verification, and CI.': '可复现的 Spring Boot 性能实验，研究会话复用与 PostgreSQL 索引；包含公开的方法、原始数据、Docker 验证和 CI。',
  'Authentication mean response': '身份验证平均响应时间', 'PostgreSQL median query': 'PostgreSQL 查询耗时中位数',
  'Observed locally under documented synthetic conditions. These are not production-capacity claims.': '以上数据来自有记录的本地合成测试条件，不代表生产环境承载能力。',
  'Local media infrastructure': '本地媒体基础设施',
  'An independent, unofficial variant with filesystem-shaped browsing, virtualized grids, incremental scanning, and a separate media worker.': '独立、非官方的衍生版本：按文件系统组织浏览，支持虚拟化网格、增量扫描和独立媒体处理进程。',
  'Windows desktop companion': 'Windows 桌面伙伴',
  'A transparent Electron pet with an animation state machine, alpha hit testing, restricted IPC, and persistent behavior.': '透明的 Electron 桌面宠物，包含动画状态机、透明区域命中检测、受限 IPC 和持久化行为。',
  'Beta. Broader installer, multi-monitor, and hands-on acceptance testing remain.': 'Beta 版本；仍需更全面的安装程序、多显示器和实际操作验收测试。',
  'Meet Bambi': '认识 Bambi',
  'Explore project': '查看项目', 'Less waiting. Same work.': '同样的工作，更少的等待。',
  'Your folders, in focus.': '让文件夹里的内容成为主角。',
  'A little company, while you code.': '写代码时，多一个小伙伴。',
  'Pause preview': '暂停预览', 'Play preview': '播放预览', 'Project notes': '项目笔记', 'Close': '关闭',
  'Measure, then improve.': '先测量，再改进。',
  'This lab examines two specific changes: reusing sessions and adding PostgreSQL indexes. The comparisons are useful alongside the committed method and raw evidence, not as standalone promises.': '这个实验研究两个具体改动：会话复用和 PostgreSQL 索引。对比结果需要结合公开的方法与原始依据理解，不能脱离测试条件视为性能承诺。',
  'What to look at': '关注什么', 'How to verify it': '如何验证',
  'Session reuse, query indexing, and the difference between authentication response time and database query time.': '会话复用、查询索引，以及身份验证响应时间与数据库查询时间的区别。',
  "Follow the repository's documented method, inspect the raw results, and use its Docker verification and CI checks.": '按仓库中记录的方法操作，检查原始结果，并使用 Docker 验证和 CI 检查。',
  'Keep the filesystem. Change the view.': '保留文件结构，换一种浏览方式。',
  'An independent, unofficial Foldergram variant, built around browsing media in the shape of the folders that already hold it.': '一个独立、非官方的 Foldergram 衍生版本，按照现有文件夹的结构浏览媒体。',
  'Browsing': '浏览体验', 'Behind the interface': '界面背后',
  'Filesystem-shaped navigation and virtualized grids organize the browsing experience.': '按文件系统组织的导航与虚拟化网格构成浏览体验。',
  'Incremental scanning and a separate media worker support the library, with SQLite WAL and FFmpeg in the stack.': '增量扫描和独立媒体处理进程支撑媒体库，技术栈包含 SQLite WAL 与 FFmpeg。',
  'A small companion. Real application boundaries.': '小小伙伴，清晰的应用边界。',
  "The playful surface sits on a transparent Electron window, with a state machine coordinating the pet's animations and persistent behavior.": '可爱的外表之下是透明的 Electron 窗口，通过状态机协调宠物动画和持久化行为。',
  'Interaction': '交互', 'Application boundaries': '应用边界',
  'Alpha hit testing distinguishes the visible pet from transparent space.': '透明区域命中检测区分可见的宠物与透明区域。',
  'Restricted IPC keeps the communication surface explicit. Broader installer, multi-monitor, and hands-on acceptance testing remain.': '受限 IPC 明确进程间通信范围；仍需更全面的安装程序、多显示器和实际操作验收测试。',
  'I am a backend software engineer who likes clear boundaries, measurable behavior, and software that explains itself.': '我是一名后端软件工程师，喜欢清晰的边界、可衡量的行为，以及易于理解的软件。',
  'My daily work centers on Java, Groovy, REST APIs, Oracle SQL, and JPA/EclipseLink. Independent projects let me explore performance, desktop software, and local-first tools.': '日常工作主要使用 Java、Groovy、REST API、Oracle SQL 和 JPA/EclipseLink；独立项目让我探索性能、桌面软件和本地优先工具。',
  'The common thread is simple: understand the real system, make the smallest useful change, and leave evidence behind.': '共同的原则很简单：理解真实系统，做最小且有效的改变，并留下可验证的依据。',
  'A concise view of my backend focus and selected tools.': '简要了解我的后端方向与常用工具。', 'Open PDF': '打开 PDF',
  'Focus': '专注领域', 'Backend systems': '后端系统', 'API design': 'API 设计', 'Performance evidence': '性能验证', 'Reliability': '可靠性',
  'Core stack': '核心技术栈', 'Java and Groovy': 'Java 与 Groovy', 'SQL and REST APIs': 'SQL 与 REST API', 'Spring Boot and PostgreSQL': 'Spring Boot 与 PostgreSQL',
  'Working style': '工作方式', 'Root-cause thinking': '追溯根因', 'Reproducible checks': '可复现的检查', 'Clear documentation': '清晰的文档', 'Privacy-aware delivery': '重视隐私的交付',
  'Find me here.': '在这里找到我。', 'GitHub for the code. LinkedIn for the conversation.': '在 GitHub 查看代码，在 LinkedIn 联系我。',
  'Kenny Yu, Backend Software Engineer': 'Kenny Yu，后端软件工程师',
  'Built with HTML, CSS, JavaScript, and one watchful cat.': '以 HTML、CSS、JavaScript 和一只认真监工的猫咪构建。'
};

type Swap = { node: Text; original: string; translated: string };

// Preserve the exact English source and the existing semantic portfolio markup.
function collectTextNodes(): Swap[] {
  const swaps: Swap[] = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node: Node | null;
  while ((node = walker.nextNode())) {
    if (node.parentElement?.closest('script, style, template, .language-toggle')) continue;
    const original = node.textContent ?? '', key = original.trim();
    if (chinese[key]) swaps.push({ node: node as Text, original, translated: original.replace(key, chinese[key]) });
  }
  return swaps;
}

export function savedLanguage(): Language {
  try { return localStorage.getItem('portfolio-language') === 'zh' ? 'zh' : 'en'; } catch { return 'en'; }
}

export function translatePortfolio(language: Language, swaps: Swap[]) {
  document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
  swaps.forEach(item => { item.node.textContent = language === 'zh' ? item.translated : item.original; });
}

// One header button switches homepage copy; the Bambi photo page stays English, as before.
export function setupLanguage() {
  const swaps = collectTextNodes();
  const button = document.querySelector<HTMLButtonElement>('.language-toggle');
  let language = savedLanguage();
  const apply = () => {
    translatePortfolio(language, swaps);
    if (button) {
      button.textContent = language === 'en' ? '中文' : 'EN';
      button.lang = language === 'en' ? 'zh-CN' : 'en';
      button.setAttribute('aria-label', language === 'en' ? '切换到中文' : 'Switch to English');
    }
    try { localStorage.setItem('portfolio-language', language); } catch { /* Language still works without storage. */ }
  };
  button?.addEventListener('click', () => { language = language === 'en' ? 'zh' : 'en'; apply(); });
  apply();
}
