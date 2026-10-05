export {};

type WikiResultItem = {
  site: string;
  siteName: string;
  title: string;
  score: number;
  url: string;
  extract: string;
};

type WikiCacheEntry = {
  ts: number;
  results: WikiResultItem[];
};

const CACHE_TTL = 24 * 60 * 60 * 1000;

function init() {
  const script_option = { type: 'script' as const, script_id: getScriptId() };

  const WikiResultSchema = z.object({
    site: z.string().default(''),
    siteName: z.string().default(''),
    title: z.string().default(''),
    score: z.coerce.number().default(0),
    url: z.string().default(''),
    extract: z.string().default(''),
  });

  const Settings = z
    .object({
      启用: z.boolean().default(true),
      代理地址: z.string().default('http://127.0.0.1:8787'),
      最大词条: z.coerce.number().int().min(1).max(10).default(3),
      每站条数: z.coerce.number().int().min(1).max(5).default(1),
      每条字数: z.coerce.number().int().min(50).max(4000).default(600),
      指令深度: z.coerce.number().int().min(0).max(100).default(1),
      显示查询提示: z.boolean().default(true),
    })
    .prefault({});

  const WikiCacheSchema = z.record(
    z.string(),
    z.object({
      ts: z.coerce.number().default(0),
      results: z.array(WikiResultSchema).default([]),
    }),
  );

  function readSettings(): z.output<typeof Settings> {
    try {
      return Settings.parse(getVariables(script_option));
    } catch (error) {
      console.error('[维基查询] 配置解析失败, 使用默认值:', error);
      return Settings.parse({});
    }
  }

  const settings = ref(readSettings());
  const memory_cache = new Map<string, WikiCacheEntry>();
  const pending: Array<{ word: string; results: WikiResultItem[] }> = [];

  function saveSettings() {
    const current = getVariables(script_option);
    replaceVariables({ ...current, ...klona(settings.value) }, script_option);
  }

  function loadCacheToMemory() {
    try {
      const parsed = WikiCacheSchema.parse(getVariables(script_option)['wiki_cache'] ?? {});
      memory_cache.clear();
      for (const [word, entry] of Object.entries(parsed)) {
        memory_cache.set(word, entry);
      }
    } catch (error) {
      console.warn('[维基查询] 缓存读取失败:', error);
    }
  }

  function persistCache() {
    const raw: Record<string, WikiCacheEntry> = {};
    for (const [word, entry] of memory_cache) {
      raw[word] = entry;
    }
    const current = getVariables(script_option);
    replaceVariables({ ...current, wiki_cache: klona(raw) }, script_option);
  }

  function parseWikiTags(text: string): { words: string[]; cleaned: string } {
    const words: string[] = [];
    const wiki_tag_re = /<wiki\b[^>]*?(?:\/>|>[\s\S]*?<\/wiki>)/gi;
    const cleaned = text.replace(wiki_tag_re, tag => {
      const attr_match = tag.match(/\bq\s*=\s*["']([^"']*)["']/i);
      let raw = attr_match?.[1] ?? '';
      if (!attr_match) {
        const inner_match = tag.match(/>([\s\S]*?)<\s*\/\s*wiki\s*>/i);
        raw = inner_match?.[1] ?? '';
      }
      for (const part of raw.split(/[|｜]/)) {
        const word = part.trim();
        if (word) {
          words.push(word);
        }
      }
      return '';
    });
    return {
      words,
      cleaned: cleaned.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trimEnd(),
    };
  }

  async function getCoveredNames(): Promise<Set<string>> {
    const names = new Set<string>();
    try {
      const char_worldbooks = getCharWorldbookNames('current');
      const worldbook_names = [char_worldbooks.primary, ...char_worldbooks.additional].filter(
        (name): name is string => !!name,
      );
      for (const name of worldbook_names) {
        try {
          const entries = await getWorldbook(name);
          for (const entry of entries) {
            names.add(entry.name);
          }
        } catch (error) {
          console.warn(`[维基查询] 读取世界书「${name}」失败:`, error);
        }
      }
    } catch (error) {
      console.warn('[维基查询] 获取角色世界书失败:', error);
    }
    return names;
  }

  async function fetchLookup(word: string): Promise<WikiResultItem[]> {
    const config = settings.value;
    const base = config.代理地址.trim().replace(/\/+$/, '');
    const params = new URLSearchParams({
      q: word,
      limit: String(config.每站条数 * 3),
      chars: String(config.每条字数),
      perSite: String(config.每站条数),
    });
    const response = await fetch(`${base}/lookup?${params.toString()}`);
    if (!response.ok) {
      throw Error(`代理返回 HTTP ${response.status}`);
    }
    const data: any = await response.json();
    const results: any[] = Array.isArray(data?.results) ? data.results : [];
    return results.map(item => WikiResultSchema.parse(item));
  }

  async function processWords(input_words: string[]) {
    const config = settings.value;
    if (!config.启用) {
      return;
    }
    const words = _.uniq(input_words.map(word => word.trim()).filter(Boolean)).slice(0, config.最大词条);
    if (words.length === 0) {
      return;
    }

    const covered = await getCoveredNames();
    const now = Date.now();
    const picked: string[] = [];

    for (const word of words) {
      if (covered.has(word)) {
        continue;
      }
      const cached = memory_cache.get(word);
      if (cached && now - cached.ts < CACHE_TTL) {
        picked.push(word);
        continue;
      }
      try {
        const results = await fetchLookup(word);
        memory_cache.set(word, { ts: now, results });
        picked.push(word);
      } catch (error) {
        console.warn(`[维基查询] 检索「${word}」失败:`, error);
      }
    }

    if (picked.length === 0) {
      return;
    }
    persistCache();

    let added = false;
    for (const word of picked) {
      const results = memory_cache.get(word)?.results ?? [];
      if (results.length === 0) {
        continue;
      }
      pending.push({ word, results });
      added = true;
    }

    if (added && settings.value.显示查询提示) {
      toastr.info(`已检索: ${picked.join('、')}`, '维基查询');
    }
  }

  function truncate(text: string, max: number): string {
    const value = (text ?? '').trim();
    return value.length > max ? `${value.slice(0, max)}…` : value;
  }

  function injectPendingResults() {
    if (!settings.value.启用) {
      pending.length = 0;
      return;
    }
    if (pending.length === 0) {
      return;
    }
    const max_chars = settings.value.每条字数;
    const lines = pending.flatMap(({ word, results }) =>
      results.map(
        result => `- 词条《${word}》（${result.siteName || result.site}）：${truncate(result.extract, max_chars)}`,
      ),
    );
    pending.length = 0;
    if (lines.length === 0) {
      return;
    }
    injectPrompts(
      [
        {
          id: 'wiki_ref',
          position: 'in_chat',
          depth: 0,
          role: 'system',
          content: ['【原作资料·仅供校正设定与文风, 避免 OOC; 不必逐字引用, 不得在正文暴露】', ...lines].join('\n'),
        },
      ],
      { once: true },
    );
  }

  function makeToolContent(): string {
    return dedent`
      【原作资料查询工具】
      当你在创作中遇到当前世界书未覆盖、或表述模糊的原作专有名词（人物、组织、事件、概念等），且你确实不确定其准确设定时，可以在本次回复的最末尾单独一行输出以下标签来请求检索：
      <wiki q="词1|词2|词3"/>
      要求：
      - 只请求你真正不确定或缺失的词，不要请求已知内容，避免重复请求；
      - 一次最多请求 ${settings.value.最大词条} 个词，用 | 分隔；
      - 该标签必须放在回复最末尾、单独占一行，正文中不得出现该标签；
      - 检索结果会在你下一次生成前提供，届时请据此校正设定与文风，不得逐字照抄，也不得在正文中暴露检索行为。
    `;
  }

  function reinjectTool() {
    uninjectPrompts(['wiki_tool']);
    if (!settings.value.启用) {
      return;
    }
    injectPrompts([
      {
        id: 'wiki_tool',
        position: 'in_chat',
        depth: Number(settings.value.指令深度),
        role: 'system',
        content: makeToolContent(),
      },
    ]);
  }

  async function handleMessageReceived(message_id: number) {
    try {
      const chat_message = getChatMessages(message_id)[0] ?? getChatMessages(-1)[0];
      if (!chat_message || chat_message.role !== 'assistant') {
        return;
      }
      const { words, cleaned } = parseWikiTags(chat_message.message);
      if (words.length === 0) {
        return;
      }
      if (cleaned !== chat_message.message) {
        await setChatMessages([{ message_id: chat_message.message_id, message: cleaned }]);
      }
      await processWords(words);
    } catch (error) {
      console.warn('[维基查询] 处理接收消息失败:', error);
    }
  }

  async function checkHealth() {
    const base = settings.value.代理地址.trim().replace(/\/+$/, '');
    try {
      const response = await fetch(`${base}/health`);
      if (!response.ok) {
        throw Error(`HTTP ${response.status}`);
      }
      const data: any = await response.json();
      if (data?.ok) {
        toastr.success('代理健康: ok', '维基查询');
      } else {
        toastr.warning(`代理返回异常: ${JSON.stringify(data)}`, '维基查询');
      }
    } catch (error) {
      console.warn('[维基查询] 健康检查失败:', error);
      toastr.error('无法连接本地代理, 请确认代理已启动', '维基查询');
    }
  }

  function handleButton() {
    const choice = prompt(
      [
        '维基查询',
        `启用: ${settings.value.启用 ? '是' : '否'}`,
        `缓存词条: ${memory_cache.size}`,
        '',
        '1 = 切换启用/停用',
        '2 = 清空缓存',
        '3 = 检查代理健康',
      ].join('\n'),
      '',
    );
    if (choice === null) {
      return;
    }
    const value = choice.trim();
    if (value === '1') {
      settings.value.启用 = !settings.value.启用;
      toastr.info(settings.value.启用 ? '维基查询已启用' : '维基查询已停用', '维基查询');
    } else if (value === '2') {
      memory_cache.clear();
      persistCache();
      toastr.info('维基查询缓存已清空', '维基查询');
    } else if (value === '3') {
      void checkHealth();
    } else if (value !== '') {
      toastr.warning('未知选项', '维基查询');
    }
  }

  loadCacheToMemory();
  watchEffect(saveSettings);
  watch(settings, () => reinjectTool(), { deep: true });

  replaceScriptButtons([{ name: '维基查询', visible: true }]);
  eventOn(getButtonEvent('维基查询'), () => errorCatched(handleButton)());

  eventOn(tavern_events.MESSAGE_RECEIVED, message_id => {
    void handleMessageReceived(message_id);
  });

  eventOn(tavern_events.GENERATION_AFTER_COMMANDS, (_type, _option, dry_run) => {
    if (dry_run) {
      return;
    }
    injectPendingResults();
  });

  eventOn(tavern_events.CHAT_CHANGED, () => {
    pending.length = 0;
    reinjectTool();
  });

  reinjectTool();
  console.info('[维基查询] 已加载');
}

$(() => {
  errorCatched(init)();
});
