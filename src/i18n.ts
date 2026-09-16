export type Language = 'en' | 'zh';
export const labels = {
  en: {
    scroll: 'Browse', orbit: 'Rotate', pan: 'Pan', settings: 'Scene controls', close: 'Close controls',
    hint: 'Scroll down for selected work', touch: 'Browse scrolls the page. Rotate / Pan enables touch control; pinch to zoom.',
    mouse: 'Browse keeps this view fixed. Choose Rotate / Pan to explore. Wheel scrolls the page.',
    keys: 'Click or tap Bambi for a random action. Enter / Space: play with Bambi · Arrows: rotate · Shift + arrows: pan · + / −: zoom · R: reset',
    zoomIn: 'Zoom in', zoomOut: 'Zoom out', reset: 'Reset view', capture: 'Screenshot', full: 'Fullscreen', exit: 'Exit fullscreen',
    native: 'Native', pixel: '2px pixel', time: 'Time of day', cycle: 'Play day cycle', stopCycle: 'Pause day cycle',
    pause: 'Pause motion', resume: 'Resume motion', sunrise: 'Sunrise', noon: 'Noon', sunset: 'Sunset', night: 'Night',
    bambiActions: 'Bambi', bambiButtons: { run: 'Run around', play: 'Play ball', sleep: 'Take a nap' },
    bambiTap: 'Tap Bambi for a surprise: a run, a nap, or a little playtime. Wait for him to return before tapping again.',
    bambiStates: { watch: 'Watching you. Little adventures play automatically.', jump: 'Hopping between the desk and floor…', run: 'Stretching those little legs…', play: 'One ball. Two very busy paws.', sleep: 'Heading to bed for a little nap.' },
    loading: 'Opening the workspace…', error: '3D is unavailable. Your projects, resume and contact links are still below.',
    captureError: 'The screenshot could not be saved. Please try again.', saved: 'Scene screenshot saved.',
    fullError: 'Fullscreen is not available in this browser. You can still explore the scene here.',
    description: 'Kenny typing at his desk beside coffee and Bambi, in a miniature 3D workspace. Use the scene controls or scroll down to the portfolio.'
  },
  zh: {
    scroll: '浏览', orbit: '旋转', pan: '平移', settings: '场景控制', close: '收起控制',
    hint: '向下滚动，浏览精选项目', touch: '浏览模式可滑动网页。选择旋转或平移后可操作场景，双指缩放。',
    mouse: '浏览模式固定当前画面。选择旋转或平移后可拖动，滚轮仍浏览网页。',
    keys: '点击 Bambi，随机做一个动作。Enter / 空格：和 Bambi 互动 · 方向键旋转 · Shift + 方向键平移 · + / − 缩放 · R 重置',
    zoomIn: '放大', zoomOut: '缩小', reset: '重置视角', capture: '截图', full: '全屏', exit: '退出全屏',
    native: '原生', pixel: '2px 像素', time: '一天中的时间', cycle: '播放昼夜', stopCycle: '暂停昼夜',
    pause: '暂停动画', resume: '继续动画', sunrise: '日出', noon: '正午', sunset: '日落', night: '夜晚',
    bambiActions: 'Bambi 动作', bambiButtons: { run: '跑一圈', play: '玩球', sleep: '睡一会儿' },
    bambiTap: '也可以直接点 Bambi，随机跑一圈、睡一觉或玩球。等他回到桌上，再来一次。',
    bambiStates: { watch: '正在看着你，也会自动出去活动一下。', jump: '正在桌面和地面之间跳跃…', run: '正在活动小短腿…', play: '一颗球，两只忙碌的小爪子。', sleep: '去猫窝里，打个小盹。' },
    loading: '正在打开工作空间…', error: '当前无法显示 3D。你仍可在下方浏览项目、简历和联系方式。',
    captureError: '截图未能保存，请重试。', saved: '场景截图已保存。',
    fullError: '当前浏览器不支持全屏，仍可在这里操作场景。',
    description: '微缩三维工作室：Kenny 在电脑前打字，桌上有咖啡和橘猫 Bambi。可使用场景控制，或向下滚动浏览作品集。'
  }
} as const;
const chinese: Record<string, string> = {
  'Skip to content': '跳到主要内容', 'Work': '作品', 'About': '关于我', 'Resume': '简历', 'Contact': '联系',
  'Backend software engineer': '后端软件工程师',
  'I build dependable Java systems and useful tools, with care for evidence, performance, and the people using them.': '我构建可靠的 Java 系统和实用工具，重视依据、性能，以及真正使用它们的人。',
  'View work': '查看作品', 'Selected work': '精选项目',
  'Three public projects that show how I measure, organize, and ship software.': '三个公开项目，展示我如何衡量性能、组织系统并交付软件。',
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
// Preserve the exact English source and the existing semantic portfolio markup.
const textNodes: { node: Text; original: string; translated: string }[] = [];
const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
let node: Node | null;
while ((node = walker.nextNode())) {
  if (node.parentElement?.closest('#scene-root, script, style, template')) continue;
  const original = node.textContent ?? '', key = original.trim();
  if (chinese[key]) textNodes.push({ node: node as Text, original, translated: original.replace(key, chinese[key]) });
}
export function translatePortfolio(language: Language) {
  document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
  textNodes.forEach(item => { item.node.textContent = language === 'zh' ? item.translated : item.original; });
}
