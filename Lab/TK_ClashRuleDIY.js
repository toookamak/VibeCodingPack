// TK_ClashRuleDIY
// https://raw.githubusercontent.com/toookamak/FL_ruleSet/refs/heads/main/TK_ClashRuleDIY_0211.js
// 版本：v9.0.0 (0211优化版)
// 最后更新：2026-02-11  | 
// 
// ===================== 优化说明 =====================
// 1. 提取公共函数，消除重复代码
// 2. 硬编码字符串集中管理
// 3. 增强错误处理和配置验证
// 4. 正则表达式缓存优化
// 5. 函数拆分，降低复杂度
// 6. 使用Map结构优化配置
// 7. 添加调试日志系统
// 8. 完善的JSDoc类型注解
// 9. 规则优先级可配置化
// 10. 策略组构建器模式重构
// ===================================================

'use strict';

// ===================== 调试配置 =====================
const DEBUG_MODE = false;

/**
 * 日志输出函数
 * @param {...any} args - 日志内容
 */
function log(...args) {
    if (DEBUG_MODE) {
        console.log(`[TK RuleDIY]`, ...args);
    }
}

/**
 * 错误日志输出
 * @param {string} context - 错误上下文
 * @param {Error} error - 错误对象
 */
function logError(context, error) {
    console.error(`[TK RuleDIY Error] ${context}:`, error.message);
    if (DEBUG_MODE && error.stack) {
        console.error(error.stack);
    }
}

// ===================== 常量定义 =====================
/**
 * 策略组名称常量 - 集中管理所有策略组名称
 */
const STRATEGY_NAMES = Object.freeze({
    // 核心策略组
    GLOBAL_ROUTING: "🧭 代理模式",
    ALL_NODES: "🌍 全部节点",
    AUTO_SELECT: "⚡ 延迟优选",
    FAILOVER: "🚧 故障转移",
    LOAD_BALANCE_HASH: "⚖️ 负载均衡 · 散列",
    LOAD_BALANCE_ROUND: "🔁 负载均衡 · 轮询",

    // 线路特性组
    RESIDENTIAL_LINE: "🏠 家宽/原生线路",
    LOW_RATE_NODE: "💰 低倍率节点",
    NOTIFICATION_GROUP: "📢 机场通知",

    // 服务策略组
    OFFICE_MESSAGING: "办公通讯",
    AI_SERVICE: "AI服务",
    AD_BLOCKING: "广告拦截",
    HIGH_TRAFFIC_CHANNEL: "大流量通道",
    GOOGLE_SERVICE: "谷歌服务",
    MICROSOFT_SERVICE: "微软服务",
    UNREAL_ENGINE: "虚幻引擎",

    // 自定义与默认路由
    CUSTOM_PROXY_RULE: "自定义代理规则",
    CUSTOM_DIRECT_RULE: "自定义直连规则",
    DOMESTIC_TRAFFIC: "国内流量",
    GLOBAL_TRAFFIC: "国际流量",

    // 特殊标识
    REGION_OTHER: "🌐 其他地区",
    DIRECT: "DIRECT",
    REJECT: "REJECT"
});

/**
 * 过滤关键词常量
 */
const FILTER_KEYWORDS = Object.freeze({
    NOTIFICATION: "自动|故障|流量|官网|套餐|机场|订阅|年|月|失联|频道|Traffic|Expire|剩余|激励|分享|到期|续费|充值",
    RESIDENTIAL: "家宽|原生|residential|home",
    LOW_RATE: "低倍率|lowrate|低-rate|倍率",
    EXCLUDE_FILTER: "自动选择|手动选择"
});

/**
 * 策略组分类常量
 */
const GROUP_CATEGORIES = Object.freeze({
    CORE: "核心路由",
    REGION_ENTRY: "地区选择",
    REGION: "具体地区",
    LINE_TYPE: "线路特性",
    SERVICE: "服务专用",
    TRAFFIC: "流量管理",
    CUSTOM: "自定义规则",
    DEFAULT_ROUTE: "默认路由"
});

/**
 * 地区配置常量 - 使用Map优化查找性能
 */
const REGION_CONFIG = Object.freeze(new Map([
    ["HK", {
        code: "HK",
        name: "🇭🇰 香港",
        icon: "Hong_Kong.png",
        regex: /(香港|HK|Hong Kong|🇭🇰)/i
    }],
    ["SG", {
        code: "SG",
        name: "🇸🇬 新加坡",
        icon: "Singapore.png",
        regex: /(新加坡|狮城|SG|Singapore|🇸🇬)/i
    }],
    ["JP", {
        code: "JP",
        name: "🇯🇵 日本",
        icon: "Japan.png",
        regex: /(日本|JP|Japan|🇯🇵)/i
    }],
    ["US", {
        code: "US",
        name: "🇺🇸 美国",
        icon: "United_States.png",
        regex: /(美国|US|USA|United States|America|🇺🇸)/i
    }]
]));

// ===================== 配置管理中心 =====================
/**
 * 统一配置管理器 - 集中管理所有可配置参数
 */
const CONFIG_MANAGER = Object.freeze({
    // 基础配置
    TEST_URL: "http://www.gstatic.com/generate_204",

    // 更新间隔（秒）
    UPDATE_INTERVALS: {
        DEFAULT: 172800,    // 48小时
        CRITICAL: 86400,    // 24小时
        STATIC: 86400       // 24小时
    },

    // 代理组分类
    GROUP_CATEGORY: GROUP_CATEGORIES,

    // 自定义规则URL
    CUSTOM_RULES: {
        PROXY_URL: "https://raw.githubusercontent.com/toookamak/FL_ruleSet/refs/heads/main/OwnRules/OwnPROXYRules.list",
        DIRECT_URL: "https://raw.githubusercontent.com/toookamak/FL_ruleSet/refs/heads/main/OwnRules/OwnDIRECTRules.list",
        REJECT_URL: "https://raw.githubusercontent.com/toookamak/FL_ruleSet/refs/heads/main/OwnRules/OwnREJECTRules.list"
    },

    // CDN源配置
    CDN_SOURCES: {
        PRIMARY: "https://fastly.jsdelivr.net/gh/Koolson/Qure/IconSet/Color/",
        BACKUP: "https://ghproxy.com/https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/",
        LOCAL: "./icons/"
    },

    // 测速配置
    SPEED_TEST: {
        INTERVAL: 600,      // 测速间隔（秒）
        MAX_FAILED_TIMES: 3 // 最大失败次数
    }
});

// ===================== 图标配置 =====================
/**
 * 图标显示设置
 */
const ICONS_SETTINGS = Object.freeze({
    DISPLAY_ICONS: false
});

/**
 * 图标路径生成器
 */
const IconManager = {
    /**
     * 获取完整图标URL
     * @param {string} iconName - 图标文件名
     * @returns {string|undefined} 完整URL或undefined
     */
    get(iconName) {
        if (!ICONS_SETTINGS.DISPLAY_ICONS || !iconName) {
            return undefined;
        }
        return CONFIG_MANAGER.CDN_SOURCES.PRIMARY + iconName;
    },

    // 预定义图标映射
    ICONS: Object.freeze({
        GLOBAL_ROUTING: "Proxy.png",
        ALL_NODES: "World_Map.png",
        SPEED_TEST: "Speedtest.png",
        FAILOVER: "Final.png",
        LOAD_BALANCE: "Balance.png",
        HOME_NETWORK: "VIP.png",
        LOW_RATE: "Speedtest.png",
        NOTIFICATION: "Apple_Mail.png",
        OFFICE: "Notion.png",
        AI: "ChatGPT.png",
        CLOUD: "Server.png",
        VIDEO: "YouTube.png",
        GOOGLE: "Google_Search.png",
        MICROSOFT: "Microsoft.png",
        UNREAL: "Download.png",
        AD_BLOCK: "Advertising.png",
        TRACKING: "Reject.png",
        DOWNLOAD: "Download.png",
        CUSTOM_PROXY: "Proxy.png",
        CUSTOM_DIRECT: "Direct.png",
        DOMESTIC: "StreamingCN.png",
        INTERNATIONAL: "Streaming!CN.png"
    })
};

// ===================== 正则表达式缓存 =====================
/**
 * 正则表达式缓存管理器
 */
const RegexCache = {
    _cache: new Map(),

    /**
     * 获取或创建正则表达式
     * @param {string} pattern - 正则模式
     * @param {string} flags - 标志
     * @returns {RegExp} 正则表达式
     */
    get(pattern, flags = 'i') {
        const key = `${pattern}|${flags}`;
        if (!this._cache.has(key)) {
            this._cache.set(key, new RegExp(pattern, flags));
            log(`Compiled regex: ${pattern}`);
        }
        return this._cache.get(key);
    },

    /**
     * 构建包含关键词的正则
     * @param {string} keywords - 关键词（|分隔）
     * @returns {RegExp} 正则表达式
     */
    buildInclude(keywords) {
        return this.get(`(${keywords})`, 'i');
    },

    /**
     * 构建排除关键词的正则
     * @param {string} keywords - 关键词（|分隔）
     * @returns {RegExp} 正则表达式
     */
    buildExclude(keywords) {
        return this.get(`^(?!.*(?:${keywords})).*$`, 'i');
    },

    /**
     * 清空缓存
     */
    clear() {
        this._cache.clear();
    }
};

// 预编译常用正则表达式
const REGEX_PATTERNS = Object.freeze({
    NOTIFICATION: RegexCache.buildInclude(FILTER_KEYWORDS.NOTIFICATION),
    NOTIFICATION_EXCLUDE: RegexCache.buildExclude(FILTER_KEYWORDS.NOTIFICATION),
    RESIDENTIAL: RegexCache.buildInclude(FILTER_KEYWORDS.RESIDENTIAL),
    LOW_RATE: RegexCache.buildInclude(FILTER_KEYWORDS.LOW_RATE)
});

// ===================== 缓存管理 =====================
/**
 * 全局缓存对象
 */
const CACHE = {
    proxyGroups: null,
    availableRegions: null,
    residentialProxies: null,
    lowRateProxies: null,
    ruleProviders: null,

    /**
     * 清空所有缓存
     */
    clear() {
        this.proxyGroups = null;
        this.availableRegions = null;
        this.residentialProxies = null;
        this.lowRateProxies = null;
        this.ruleProviders = null;
        log('Cache cleared');
    }
};

// ===================== 配置验证 =====================
/**
 * 配置验证器
 */
const ConfigValidator = {
    /**
     * 验证配置参数
     * @param {Object} params - 配置参数
     * @returns {Array<string>} 错误列表
     */
    validate(params) {
        const errors = [];

        if (!params || typeof params !== 'object') {
            errors.push('params must be a valid object');
            return errors;
        }

        if (!Array.isArray(params.proxies)) {
            errors.push('params.proxies must be an array');
        } else if (params.proxies.length === 0) {
            errors.push('params.proxies is empty');
        }

        return errors;
    },

    /**
     * 验证代理节点
     * @param {Object} proxy - 代理节点
     * @returns {boolean} 是否有效
     */
    isValidProxy(proxy) {
        return proxy &&
            typeof proxy === 'object' &&
            typeof proxy.name === 'string' &&
            proxy.name.length > 0;
    }
};

// ===================== 主入口函数 =====================
/**
 * 主入口函数 - 处理Clash配置文件
 * @param {Object} params - Clash配置参数
 * @param {Array} params.proxies - 代理节点列表
 * @returns {Object} 处理后的配置
 */
const main = (params) => {
    log('Starting configuration processing...');

    // 配置验证
    const validationErrors = ConfigValidator.validate(params);
    if (validationErrors.length > 0) {
        logError('Configuration validation failed', new Error(validationErrors.join('; ')));
        return params;
    }

    try {
        // 依次处理各模块
        const processors = [
            { name: 'Basic Options', fn: overwriteBasicOptions },
            { name: 'Sniffer', fn: overwriteSniffer },
            { name: 'Proxy Groups', fn: overwriteProxyGroups },
            { name: 'Rules', fn: overwriteRules },
            { name: 'DNS', fn: overwriteDns },
            { name: 'TUN', fn: overwriteTunnel }
        ];

        processors.forEach(({ name, fn }) => {
            try {
                log(`Processing ${name}...`);
                fn(params);
                log(`${name} processed successfully`);
            } catch (error) {
                logError(`Failed to process ${name}`, error);
                // 继续处理其他模块
            }
        });

        // 清理缓存
        CACHE.clear();
        RegexCache.clear();

        log('Configuration processing completed');
        return params;

    } catch (error) {
        logError('Unexpected error in main', error);
        return params;
    }
};

// ===================== 基础设置模块 =====================
/**
 * 覆盖基础配置选项
 * @param {Object} params - 配置参数
 */
function overwriteBasicOptions(params) {
    const basicConfig = {
        "mixed-port": 7890,
        "allow-lan": true,
        "unified-delay": true,
        "tcp-concurrent": true,
        "geodata-mode": true,
        "geox-url": {
            "geoip": "https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/geoip.dat",
            "geosite": "https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/geosite.dat"
        },
        "find-process-mode": "strict",
        "global-client-fingerprint": "chrome",
        profile: {
            "store-selected": true,
            "store-fake-ip": true
        },
        ipv6: true,
        mode: "rule",
        "skip-auth-prefixes": ["127.0.0.1/32"],
        "lan-allowed-ips": ["0.0.0.0/0", "::/0"]
    };

    Object.assign(params, basicConfig);
    log('Basic options configured');
}

// ===================== 流量嗅探设置 =====================
/**
 * 覆盖流量嗅探配置
 * @param {Object} params - 配置参数
 */
function overwriteSniffer(params) {
    params.sniffer = {
        enable: true,
        "force-dns-mapping": true,
        "parse-pure-ip": true,
        "override-destination": false,
        sniff: {
            HTTP: {
                ports: ["80", "443"],
                "override-destination": false
            },
            TLS: {
                ports: ["443"]
            }
        },
        "skip-domain": ["+.push.apple.com"],
        "skip-dst-address": [
            "91.105.192.0/23", "91.108.4.0/22", "91.108.8.0/21",
            "91.108.16.0/21", "91.108.56.0/22", "95.161.64.0/20",
            "149.154.160.0/20", "185.76.151.0/24", "2001:67c:4e8::/48",
            "2001:b28:f23c::/47", "2001:b28:f23f::/48", "2a0a:f280:203::/48"
        ]
    };
    log('Sniffer configured');
}

// ===================== 代理组构建器 =====================
/**
 * 代理组构建器 - 简化策略组创建
 */
class ProxyGroupBuilder {
    constructor() {
        this.groups = [];
    }

    /**
     * 添加策略组
     * @param {string} name - 策略组名称
     * @param {string} type - 策略类型
     * @param {Object} options - 额外选项
     * @returns {ProxyGroupBuilder} 链式调用
     */
    add(name, type, options = {}) {
        const baseConfig = {
            name,
            type,
            category: options.category || GROUP_CATEGORIES.CORE,
            url: type !== "select" ? CONFIG_MANAGER.TEST_URL : undefined,
            interval: type !== "select" ? CONFIG_MANAGER.SPEED_TEST.INTERVAL : undefined
        };

        // 合并配置（不污染原始对象）
        const finalConfig = { ...baseConfig, ...options };

        // 负载均衡特殊配置
        if (type === "load-balance") {
            finalConfig["max-failed-times"] = CONFIG_MANAGER.SPEED_TEST.MAX_FAILED_TIMES;
            finalConfig.lazy = true;
        }

        // 图标处理
        if (!ICONS_SETTINGS.DISPLAY_ICONS) {
            delete finalConfig.icon;
        }

        this.groups.push(finalConfig);
        return this;
    }

    /**
     * 批量添加策略组
     * @param {Array<Object>} groups - 策略组配置数组
     * @returns {ProxyGroupBuilder} 链式调用
     */
    addBatch(groups) {
        groups.forEach(group => {
            this.add(group.name, group.type, group.options);
        });
        return this;
    }

    /**
     * 获取构建结果
     * @returns {Array} 策略组数组
     */
    build() {
        return this.groups;
    }
}

// ===================== 代理组配置模块 =====================
/**
 * 覆盖代理组配置
 * @param {Object} params - 配置参数
 */
function overwriteProxyGroups(params) {
    // 检查缓存
    if (CACHE.proxyGroups) {
        log('Using cached proxy groups');
        params["proxy-groups"] = CACHE.proxyGroups;
        params.__hasResidential = !!CACHE.residentialProxies?.length;
        params.__hasLowRate = !!CACHE.lowRateProxies?.length;
        return;
    }

    log('Building proxy groups...');

    // 分类处理节点
    const nodeClassification = classifyNodes(params);

    // 更新元数据标记
    params.__hasResidential = nodeClassification.hasResidential;
    params.__hasLowRate = nodeClassification.hasLowRate;
    params.__hasNotifications = nodeClassification.hasNotifications;

    // 缓存分类结果
    CACHE.residentialProxies = nodeClassification.residentialProxies;
    CACHE.lowRateProxies = nodeClassification.lowRateProxies;

    // 构建所有策略组
    const builder = new ProxyGroupBuilder();

    buildCoreGroups(builder, nodeClassification);
    buildRegionalGroups(builder, params, nodeClassification);
    buildLineTypeGroups(builder, nodeClassification);
    buildNotificationGroups(builder, nodeClassification);
    buildServiceGroups(builder, nodeClassification);
    buildTrafficGroups(builder, nodeClassification);
    buildCustomRuleGroups(builder, nodeClassification);
    buildDefaultRouteGroups(builder, nodeClassification);

    const allGroups = builder.build();

    // 缓存并赋值
    CACHE.proxyGroups = allGroups;
    params["proxy-groups"] = allGroups;

    log(`Built ${allGroups.length} proxy groups`);
}

/**
 * 节点分类结果
 * @typedef {Object} NodeClassification
 * @property {Array<string>} allProxies - 所有可用节点
 * @property {Set<string>} availableRegions - 可用地区集合
 * @property {Array<string>} residentialProxies - 家宽节点
 * @property {Array<string>} lowRateProxies - 低倍率节点
 * @property {Array<string>} notificationProxies - 通知节点
 * @property {Array<string>} otherProxies - 其他节点
 * @property {boolean} hasResidential - 是否有家宽节点
 * @property {boolean} hasLowRate - 是否有低倍率节点
 * @property {boolean} hasNotifications - 是否有通知节点
 * @property {boolean} hasOtherProxies - 是否有其他节点
 */

/**
 * 处理并分类代理节点
 * @param {Object} params - 配置参数
 * @returns {NodeClassification} 节点分类结果
 */
function classifyNodes(params) {
    log('Classifying proxy nodes...');

    const allProxies = getProxiesByRegex(params, REGEX_PATTERNS.NOTIFICATION_EXCLUDE);

    // 识别可用地区
    const availableRegions = new Set();
    params.proxies.forEach(proxy => {
        if (!ConfigValidator.isValidProxy(proxy)) return;

        for (const [, region] of REGION_CONFIG) {
            if (region.regex.test(proxy.name)) {
                availableRegions.add(region.name);
                break;
            }
        }
    });

    // 分类特殊节点
    const residentialProxies = getProxiesByRegex(params, REGEX_PATTERNS.RESIDENTIAL, []);
    const lowRateProxies = getProxiesByRegex(params, REGEX_PATTERNS.LOW_RATE, []);
    const notificationProxies = getProxiesByRegex(params, REGEX_PATTERNS.NOTIFICATION, []);

    // 识别其他节点
    const otherProxies = params.proxies
        .filter(proxy => {
            if (!ConfigValidator.isValidProxy(proxy)) return false;

            const isRegion = Array.from(REGION_CONFIG.values())
                .some(region => region.regex.test(proxy.name));

            return !isRegion &&
                !REGEX_PATTERNS.RESIDENTIAL.test(proxy.name) &&
                !REGEX_PATTERNS.LOW_RATE.test(proxy.name) &&
                !REGEX_PATTERNS.NOTIFICATION.test(proxy.name);
        })
        .map(proxy => proxy.name);

    log(`Classification complete: ${allProxies.length} nodes, ${availableRegions.size} regions`);

    return {
        allProxies: allProxies.length ? allProxies : [STRATEGY_NAMES.DIRECT],
        availableRegions,
        residentialProxies,
        lowRateProxies,
        notificationProxies,
        otherProxies,
        hasResidential: residentialProxies.length > 0,
        hasLowRate: lowRateProxies.length > 0,
        hasNotifications: notificationProxies.length > 0,
        hasOtherProxies: otherProxies.length > 0
    };
}

/**
 * 构建代理选项列表
 * @param {NodeClassification} classification - 节点分类结果
 * @param {Object} options - 选项配置
 * @param {boolean} options.includeCore - 是否包含核心策略
 * @param {boolean} options.includeDefaults - 是否包含默认选项
 * @param {boolean} options.includeReject - 是否包含REJECT
 * @returns {Array<string>} 选项列表
 */
function buildProxyOptions(classification, options = {}) {
    const {
        includeCore = true,
        includeDefaults = true,
        includeReject = false
    } = options;

    const opts = [];

    if (includeCore) {
        opts.push(STRATEGY_NAMES.GLOBAL_ROUTING);
    }

    if (includeDefaults) {
        opts.push(STRATEGY_NAMES.AUTO_SELECT, STRATEGY_NAMES.FAILOVER);
    }

    // 添加可用地区
    for (const [, region] of REGION_CONFIG) {
        if (classification.availableRegions.has(region.name)) {
            opts.push(region.name);
        }
    }

    // 添加特殊线路
    if (classification.hasResidential) {
        opts.push(STRATEGY_NAMES.RESIDENTIAL_LINE);
    }
    if (classification.hasLowRate) {
        opts.push(STRATEGY_NAMES.LOW_RATE_NODE);
    }
    if (classification.hasOtherProxies) {
        opts.push(STRATEGY_NAMES.REGION_OTHER);
    }
    if (classification.hasNotifications) {
        opts.push(STRATEGY_NAMES.NOTIFICATION_GROUP);
    }

    opts.push(STRATEGY_NAMES.ALL_NODES);

    if (includeDefaults) {
        opts.push(STRATEGY_NAMES.LOAD_BALANCE_HASH, STRATEGY_NAMES.LOAD_BALANCE_ROUND);
    }

    opts.push(STRATEGY_NAMES.DIRECT);

    if (includeReject) {
        opts.push(STRATEGY_NAMES.REJECT);
    }

    return opts;
}

/**
 * 构建核心策略组
 * @param {ProxyGroupBuilder} builder - 构建器
 * @param {NodeClassification} classification - 节点分类
 */
function buildCoreGroups(builder, classification) {
    // 避免“代理模式”策略组包含自身，导致 ProxyGroup loop
    const baseOptions = buildProxyOptions(classification, {
        includeCore: false,
        includeReject: true
    });

    builder
        .add(STRATEGY_NAMES.GLOBAL_ROUTING, "select", {
            category: GROUP_CATEGORIES.CORE,
            proxies: baseOptions,
            icon: IconManager.get(IconManager.ICONS.GLOBAL_ROUTING)
        })
        .add(STRATEGY_NAMES.AUTO_SELECT, "url-test", {
            category: GROUP_CATEGORIES.CORE,
            "exclude-filter": FILTER_KEYWORDS.EXCLUDE_FILTER,
            proxies: classification.allProxies,
            icon: IconManager.get(IconManager.ICONS.SPEED_TEST),
            hidden: true
        })
        .add(STRATEGY_NAMES.FAILOVER, "fallback", {
            category: GROUP_CATEGORIES.CORE,
            "exclude-filter": FILTER_KEYWORDS.EXCLUDE_FILTER,
            proxies: classification.allProxies,
            icon: IconManager.get(IconManager.ICONS.FAILOVER),
            hidden: true
        })
        .add(STRATEGY_NAMES.LOAD_BALANCE_HASH, "load-balance", {
            category: GROUP_CATEGORIES.CORE,
            strategy: "consistent-hashing",
            "exclude-filter": FILTER_KEYWORDS.EXCLUDE_FILTER,
            proxies: classification.allProxies,
            icon: IconManager.get(IconManager.ICONS.LOAD_BALANCE),
            hidden: true
        })
        .add(STRATEGY_NAMES.LOAD_BALANCE_ROUND, "load-balance", {
            category: GROUP_CATEGORIES.CORE,
            strategy: "round-robin",
            "exclude-filter": FILTER_KEYWORDS.EXCLUDE_FILTER,
            proxies: classification.allProxies,
            icon: IconManager.get(IconManager.ICONS.LOAD_BALANCE),
            hidden: true
        })
        .add(STRATEGY_NAMES.ALL_NODES, "select", {
            category: GROUP_CATEGORIES.CORE,
            proxies: classification.allProxies,
            icon: IconManager.get(IconManager.ICONS.ALL_NODES),
            hidden: false
        });
}

/**
 * 构建地区策略组
 * @param {ProxyGroupBuilder} builder - 构建器
 * @param {Object} params - 配置参数
 * @param {NodeClassification} classification - 节点分类
 */
function buildRegionalGroups(builder, params, classification) {
    for (const [, region] of REGION_CONFIG) {
        if (!classification.availableRegions.has(region.name)) continue;

        const regionProxies = params.proxies
            .filter(proxy => {
                if (!ConfigValidator.isValidProxy(proxy)) return false;
                return region.regex.test(proxy.name) &&
                    !REGEX_PATTERNS.RESIDENTIAL.test(proxy.name) &&
                    !REGEX_PATTERNS.LOW_RATE.test(proxy.name) &&
                    !REGEX_PATTERNS.NOTIFICATION.test(proxy.name);
            })
            .map(proxy => proxy.name);

        if (regionProxies.length > 0) {
            builder.add(region.name, "select", {
                category: GROUP_CATEGORIES.REGION,
                proxies: regionProxies,
                icon: IconManager.get(region.icon),
                hidden: false
            });
        }
    }

    // 其他地区
    if (classification.hasOtherProxies) {
        builder.add(STRATEGY_NAMES.REGION_OTHER, "select", {
            category: GROUP_CATEGORIES.REGION,
            proxies: classification.otherProxies,
            icon: IconManager.get(IconManager.ICONS.ALL_NODES),
            hidden: false
        });
    }
}

/**
 * 构建线路特性策略组
 * @param {ProxyGroupBuilder} builder - 构建器
 * @param {NodeClassification} classification - 节点分类
 */
function buildLineTypeGroups(builder, classification) {
    if (classification.hasResidential) {
        builder.add(STRATEGY_NAMES.RESIDENTIAL_LINE, "select", {
            category: GROUP_CATEGORIES.LINE_TYPE,
            icon: IconManager.get(IconManager.ICONS.HOME_NETWORK),
            proxies: classification.residentialProxies,
            hidden: false
        });
    }

    if (classification.hasLowRate) {
        builder.add(STRATEGY_NAMES.LOW_RATE_NODE, "select", {
            category: GROUP_CATEGORIES.LINE_TYPE,
            icon: IconManager.get(IconManager.ICONS.LOW_RATE),
            proxies: classification.lowRateProxies,
            hidden: false
        });
    }
}

/**
 * 构建通知策略组
 * @param {ProxyGroupBuilder} builder - 构建器
 * @param {NodeClassification} classification - 节点分类
 */
function buildNotificationGroups(builder, classification) {
    if (classification.hasNotifications) {
        builder.add(STRATEGY_NAMES.NOTIFICATION_GROUP, "select", {
            category: GROUP_CATEGORIES.CUSTOM,
            icon: IconManager.get(IconManager.ICONS.NOTIFICATION),
            proxies: classification.notificationProxies,
            hidden: false
        });
    }
}

/**
 * 构建服务策略组
 * @param {ProxyGroupBuilder} builder - 构建器
 * @param {NodeClassification} classification - 节点分类
 */
function buildServiceGroups(builder, classification) {
    const serviceOptions = buildProxyOptions(classification, { includeReject: true });

    const services = [
        { name: STRATEGY_NAMES.OFFICE_MESSAGING, icon: IconManager.ICONS.OFFICE },
        { name: STRATEGY_NAMES.AI_SERVICE, icon: IconManager.ICONS.AI },
        { name: STRATEGY_NAMES.GOOGLE_SERVICE, icon: IconManager.ICONS.GOOGLE },
        { name: STRATEGY_NAMES.MICROSOFT_SERVICE, icon: IconManager.ICONS.MICROSOFT },
        { name: STRATEGY_NAMES.UNREAL_ENGINE, icon: IconManager.ICONS.UNREAL }
    ];

    services.forEach(service => {
        builder.add(service.name, "select", {
            category: GROUP_CATEGORIES.SERVICE,
            proxies: serviceOptions,
            icon: IconManager.get(service.icon)
        });
    });

    // 广告拦截特殊处理
    builder.add(STRATEGY_NAMES.AD_BLOCKING, "select", {
        category: GROUP_CATEGORIES.SERVICE,
        proxies: [STRATEGY_NAMES.REJECT, STRATEGY_NAMES.DIRECT],
        icon: IconManager.get(IconManager.ICONS.AD_BLOCK)
    });
}

/**
 * 构建流量管理策略组
 * @param {ProxyGroupBuilder} builder - 构建器
 * @param {NodeClassification} classification - 节点分类
 */
function buildTrafficGroups(builder, classification) {
    const trafficOptions = buildProxyOptions(classification);

    builder.add(STRATEGY_NAMES.HIGH_TRAFFIC_CHANNEL, "select", {
        category: GROUP_CATEGORIES.TRAFFIC,
        proxies: trafficOptions,
        icon: IconManager.get(IconManager.ICONS.DOWNLOAD)
    });
}

/**
 * 构建自定义规则策略组
 * @param {ProxyGroupBuilder} builder - 构建器
 * @param {NodeClassification} classification - 节点分类
 */
function buildCustomRuleGroups(builder, classification) {
    const customOptions = buildProxyOptions(classification, { includeReject: true });

    builder
        .add(STRATEGY_NAMES.CUSTOM_PROXY_RULE, "select", {
            category: GROUP_CATEGORIES.CUSTOM,
            proxies: customOptions,
            icon: IconManager.get(IconManager.ICONS.CUSTOM_PROXY)
        })
        .add(STRATEGY_NAMES.CUSTOM_DIRECT_RULE, "select", {
            category: GROUP_CATEGORIES.CUSTOM,
            proxies: [STRATEGY_NAMES.DIRECT, ...customOptions.filter(p => p !== STRATEGY_NAMES.DIRECT)],
            icon: IconManager.get(IconManager.ICONS.CUSTOM_DIRECT)
        });
}

/**
 * 构建默认路由策略组
 * @param {ProxyGroupBuilder} builder - 构建器
 * @param {NodeClassification} classification - 节点分类
 */
function buildDefaultRouteGroups(builder, classification) {
    const defaultOptions = buildProxyOptions(classification);

    builder
        .add(STRATEGY_NAMES.DOMESTIC_TRAFFIC, "select", {
            category: GROUP_CATEGORIES.DEFAULT_ROUTE,
            proxies: defaultOptions,
            icon: IconManager.get(IconManager.ICONS.DOMESTIC)
        })
        .add(STRATEGY_NAMES.GLOBAL_TRAFFIC, "select", {
            category: GROUP_CATEGORIES.DEFAULT_ROUTE,
            proxies: defaultOptions,
            icon: IconManager.get(IconManager.ICONS.INTERNATIONAL)
        });
}

// ===================== 规则配置模块 =====================
/**
 * 规则优先级配置
 */
const RULE_PRIORITIES = [
    {
        type: 'ad-block', group: STRATEGY_NAMES.AD_BLOCKING, rules: [
            'Reject_no_ip', 'Reject_domainset', 'Reject_no_ip_drop',
            'Reject_no_ip_no_drop', 'Reject_ip', 'CustomRejectRules'
        ]
    },
    {
        type: 'direct', group: STRATEGY_NAMES.DIRECT, rules: [
            'GEOSITE,cn', 'Lan_ip', 'SteamCN_ip', 'Domestic_no_ip'
        ]
    },
    {
        type: 'traffic', group: STRATEGY_NAMES.HIGH_TRAFFIC_CHANNEL, rules: [
            'applications'
        ]
    },
    {
        type: 'custom', rules: [
            { name: 'CustomProxyRules', group: STRATEGY_NAMES.CUSTOM_PROXY_RULE },
            { name: 'CustomDirectRules', group: STRATEGY_NAMES.CUSTOM_DIRECT_RULE }
        ]
    },
    {
        type: 'office', group: STRATEGY_NAMES.OFFICE_MESSAGING, rules: [
            'Figma_ip', 'Notion_ip', 'Github', 'OneDrive', 'Dropbox',
            'Telegram_ip', 'Telegram_no_ip'
        ]
    },
    {
        type: 'ai', group: STRATEGY_NAMES.AI_SERVICE, rules: [
            'OpenAI', 'AI_no_ip', 'Gemini'
        ]
    },
    {
        type: 'google', group: STRATEGY_NAMES.GOOGLE_SERVICE, rules: [
            'YouTube', 'GoogleFCM_ip', 'Google', 'GoogleFCM_no_ip'
        ]
    },
    {
        type: 'microsoft', group: STRATEGY_NAMES.MICROSOFT_SERVICE, rules: [
            'Microsoft_no_ip'
        ]
    },
    {
        type: 'cdn', group: STRATEGY_NAMES.HIGH_TRAFFIC_CHANNEL, rules: [
            'MicrosoftCDN_no_ip', 'CDN_domainset', 'CDN_no_ip',
            'Download_domainset', 'Download_no_ip', 'GameDownload', 'Stream_ip'
        ]
    },
    {
        type: 'unreal', group: STRATEGY_NAMES.UNREAL_ENGINE, rules: [
            'UnrealRules'
        ]
    },
    {
        type: 'geoip', group: STRATEGY_NAMES.DOMESTIC_TRAFFIC, rules: [
            'GEOIP,CN'
        ]
    },
    {
        type: 'final', group: STRATEGY_NAMES.GLOBAL_TRAFFIC, rules: [
            'MATCH'
        ]
    }
];

/**
 * 覆盖规则配置
 * @param {Object} params - 配置参数
 */
function overwriteRules(params) {
    log('Building rules...');

    const rules = [];

    RULE_PRIORITIES.forEach(priority => {
        if (priority.rules) {
            priority.rules.forEach(rule => {
                if (typeof rule === 'string') {
                    if (rule === 'MATCH') {
                        rules.push(`MATCH,${priority.group}`);
                    } else if (rule.startsWith('GEOIP,')) {
                        const parts = rule.split(',');
                        const lastPart = parts[parts.length - 1].toLowerCase();
                        if (lastPart === 'no-resolve') {
                            const geoipTarget = parts.slice(1, -1).join(',');
                            rules.push(`GEOIP,${geoipTarget},${priority.group},no-resolve`);
                        } else {
                            const geoipTarget = parts.slice(1).join(',');
                            rules.push(`GEOIP,${geoipTarget},${priority.group}`);
                        }
                    } else if (rule.includes(',')) {
                        // GEOSITE/GEOIP/MATCH 规则
                        rules.push(`${rule},${priority.group}`);
                    } else {
                        // RULE-SET 规则
                        rules.push(`RULE-SET,${rule},${priority.group}`);
                    }
                } else if (rule.name && rule.group) {
                    // 自定义规则
                    rules.push(`RULE-SET,${rule.name},${rule.group}`);
                }
            });
        }
    });

    params.rules = rules;
    params["rule-providers"] = createRuleProviders();

    log(`Built ${rules.length} rules`);
}

// ===================== 规则提供器配置 =====================
/**
 * 规则提供器定义
 */
const RULE_PROVIDER_DEFINITIONS = {
    // REJECT规则
    Reject_ip: {
        url: "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/REJECT/ip/Reject_ip.yaml",
        path: "./ruleset/toookamak/Reject_ip.yaml"
    },
    Reject_no_ip: {
        url: "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/REJECT/no_ip/Reject_no_ip.yaml",
        path: "./ruleset/toookamak/Reject_no_ip.yaml"
    },
    Reject_domainset: {
        url: "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/REJECT/no_ip/Reject_domainset.yaml",
        path: "./ruleset/toookamak/Reject_domainset.yaml"
    },
    Reject_no_ip_drop: {
        url: "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/REJECT/no_ip/Reject_no_ip_drop.yaml",
        path: "./ruleset/toookamak/Reject_no_ip_drop.yaml"
    },
    Reject_no_ip_no_drop: {
        url: "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/REJECT/no_ip/Reject_no_ip_no_drop.yaml",
        path: "./ruleset/toookamak/Reject_no_ip_no_drop.yaml"
    },

    // DIRECT规则
    GoogleFCM_ip: {
        url: "https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/Ruleset/GoogleFCM.list",
        path: "./ruleset/toookamak/GoogleFCM.list",
        format: "text"
    },
    Lan_ip: {
        url: "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/DIRECT/ip/Lan_ip.yaml",
        path: "./ruleset/toookamak/Lan_ip.yaml"
    },
    SteamCN_ip: {
        url: "https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/Ruleset/SteamCN.list",
        path: "./ruleset/toookamak/SteamCN.list",
        format: "text"
    },
    Domestic_no_ip: {
        url: "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/DIRECT/no_ip/Domestic_no_ip.yaml",
        path: "./ruleset/toookamak/Domestic_no_ip.yaml"
    },
    GoogleFCM_no_ip: {
        url: "https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/Ruleset/GoogleFCM.list",
        path: "./ruleset/toookamak/GoogleFCM.list",
        format: "text"
    },
    MicrosoftCDN_no_ip: {
        url: "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/DIRECT/no_ip/MicrosoftCDN_no_ip.yaml",
        path: "./ruleset/toookamak/MicrosoftCDN_no_ip.yaml"
    },

    // PROXY规则
    Stream_ip: {
        url: "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/PROXY/ip/Stream_ip.yaml",
        path: "./ruleset/toookamak/Stream_ip.yaml"
    },
    Telegram_ip: {
        url: "https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/Ruleset/Telegram.list",
        path: "./ruleset/toookamak/Telegram.list",
        format: "text"
    },
    AI_no_ip: {
        url: "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/PROXY/no_ip/AI_no_ip.yaml",
        path: "./ruleset/toookamak/AI_no_ip.yaml"
    },
    CDN_domainset: {
        url: "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/PROXY/no_ip/CDN_domainset.yaml",
        path: "./ruleset/toookamak/CDN_domainset.yaml"
    },
    CDN_no_ip: {
        url: "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/PROXY/no_ip/CDN_no_ip.yaml",
        path: "./ruleset/toookamak/CDN_no_ip.yaml"
    },
    Download_domainset: {
        url: "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/PROXY/no_ip/Download_domainset.yaml",
        path: "./ruleset/toookamak/Download_domainset.yaml"
    },
    Download_no_ip: {
        url: "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/PROXY/no_ip/Download_no_ip.yaml",
        path: "./ruleset/toookamak/Download_no_ip.yaml"
    },
    Microsoft_no_ip: {
        url: "https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/Ruleset/Microsoft.list",
        path: "./ruleset/toookamak/Microsoft.list",
        format: "text"
    },
    Telegram_no_ip: {
        url: "https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/Ruleset/Telegram.list",
        path: "./ruleset/toookamak/Telegram.list",
        format: "text"
    },

    // 第三方规则
    Figma_ip: {
        url: "https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/refs/heads/master/rule/Clash/Figma/Figma.yaml",
        path: "./ruleset/toookamak/Figma_ip.yaml"
    },
    Notion_ip: {
        url: "https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/refs/heads/master/rule/Clash/Notion/Notion.yaml",
        path: "./ruleset/toookamak/Notion_ip.yaml"
    },
    Github: {
        url: "https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/refs/heads/master/rule/Clash/GitHub/GitHub.yaml",
        path: "./ruleset/toookamak/Github.yaml"
    },
    OneDrive: {
        url: "https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/Ruleset/OneDrive.list",
        path: "./ruleset/toookamak/OneDrive.list",
        format: "text"
    },
    YouTube: {
        url: "https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/Ruleset/YouTube.list",
        path: "./ruleset/toookamak/YouTube.list",
        format: "text"
    },
    Google: {
        url: "https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/Ruleset/Google.list",
        path: "./ruleset/toookamak/Google.list",
        format: "text"
    },
    Gemini: {
        url: "https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/refs/heads/master/rule/Clash/Gemini/Gemini.yaml",
        path: "./ruleset/toookamak/Gemini.yaml"
    },
    OpenAI: {
        url: "https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/Ruleset/OpenAI.list",
        path: "./ruleset/toookamak/OpenAI.list",
        format: "text"
    },
    GameDownload: {
        url: "https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/refs/heads/master/rule/Clash/Game/GameDownload/GameDownload.yaml",
        path: "./ruleset/toookamak/GameDownload.yaml"
    },
    UnrealRules: {
        url: "https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/refs/heads/master/rule/Clash/Epic/Epic.yaml",
        path: "./ruleset/toookamak/UnrealRules.yaml"
    },
    Dropbox: {
        url: "https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/refs/heads/master/rule/Clash/Dropbox/Dropbox.yaml",
        path: "./ruleset/toookamak/Dropbox.yaml"
    }
};

/**
 * 创建规则提供器配置
 * @returns {Object} 规则提供器配置对象
 */
function createRuleProviders() {
    if (CACHE.ruleProviders) {
        return CACHE.ruleProviders;
    }

    log('Creating rule providers...');

    const providers = {};

    // 生成标准规则提供器
    Object.entries(RULE_PROVIDER_DEFINITIONS).forEach(([name, config]) => {
        providers[name] = {
            type: "http",
            behavior: "classical",
            format: "yaml",
            interval: CONFIG_MANAGER.UPDATE_INTERVALS.DEFAULT,
            url: config.url,
            path: config.path
        };
    });

    // 自定义规则（text格式）
    const customProviders = {
        CustomProxyRules: CONFIG_MANAGER.CUSTOM_RULES.PROXY_URL,
        CustomDirectRules: CONFIG_MANAGER.CUSTOM_RULES.DIRECT_URL,
        CustomRejectRules: CONFIG_MANAGER.CUSTOM_RULES.REJECT_URL
    };

    Object.entries(customProviders).forEach(([name, url]) => {
        providers[name] = {
            type: "http",
            behavior: "classical",
            format: "text",
            interval: CONFIG_MANAGER.UPDATE_INTERVALS.STATIC,
            url: url,
            path: `./ruleset/toookamak/${name}.list`
        };
    });

    // 应用程序规则
    providers.applications = {
        type: "http",
        behavior: "classical",
        format: "text",
        interval: CONFIG_MANAGER.UPDATE_INTERVALS.STATIC,
        url: "https://raw.githubusercontent.com/Loyalsoldier/clash-rules/release/applications.txt",
        path: "./ruleset/toookamak/applications.list"
    };

    CACHE.ruleProviders = providers;
    log(`Created ${Object.keys(providers).length} rule providers`);

    return providers;
}

// ===================== 辅助函数 =====================
/**
 * 根据正则表达式获取代理节点
 * @param {Object} params - 配置参数
 * @param {RegExp} regex - 正则表达式
 * @param {Array<string>} fallback - 默认值
 * @returns {Array<string>} 匹配的节点名称列表
 */
function getProxiesByRegex(params, regex, fallback = [STRATEGY_NAMES.DIRECT]) {
    if (!params.proxies || !Array.isArray(params.proxies)) {
        return fallback;
    }

    const matched = params.proxies
        .filter(proxy => ConfigValidator.isValidProxy(proxy) && regex.test(proxy.name))
        .map(proxy => proxy.name);

    return matched.length ? matched : fallback;
}

// ===================== DNS配置模块 =====================
/**
 * 覆盖DNS配置
 * @param {Object} params - 配置参数
 */
function overwriteDns(params) {
    params.dns = {
        enable: true,
        listen: "0.0.0.0:1053",
        "enhanced-mode": "fake-ip",
        "fake-ip-range": "198.18.0.1/16",
        "use-hosts": true,
        "use-system-hosts": true,
        ipv6: true,
        "fake-ip-filter": [
            "*.lan", "*.local",
            "time.*.com", "ntp.*.com",
            "*.xiaomi.com",
            "*.apple.com",
            "localhost.ptlogin2.qq.com",
            "localhost.sec.qq.com",
            "*.qq.com", "*.tencent.com",
            "*.msftconnecttest.com",
            "*.msftncsi.com"
        ],
        "default-nameserver": [
            "223.5.5.5",
            "119.29.29.29",
            "1.1.1.1",
            "8.8.8.8"
        ],
        // 默认DNS（仅使用国外DNS，防止未知域名泄露给国内DNS）
        nameserver: [
            "https://dns.cloudflare.com/dns-query",
            "https://dns.google/dns-query"
        ],
        // 代理节点域名解析（必须使用干净的DNS，防止被污染）
        "proxy-server-nameserver": [
            "https://dns.cloudflare.com/dns-query",
            "https://dns.google/dns-query"
        ],
        // 分流策略
        "nameserver-policy": {
            // 国内域名 -> 国内DNS (阿里/腾讯)
            'geosite:cn,private,apple': [
                'https://dns.alidns.com/dns-query',
                'https://doh.pub/dns-query'
            ],
            // 显式指定非CN域名 -> 国外DNS
            'geosite:geolocation-!cn': [
                'https://dns.cloudflare.com/dns-query',
                'https://dns.google/dns-query'
            ]
        }
    };
    log('DNS configured (Privacy Optimized)');
}

// ===================== TUN配置模块 =====================
/**
 * 覆盖TUN配置
 * @param {Object} params - 配置参数
 */
function overwriteTunnel(params) {
    params.tun = {
        enable: true,
        stack: "mixed",
        device: "Mihomo",
        "dns-hijack": ["any:53"],
        "auto-route": true,
        "auto-redirect": false,
        "auto-detect-interface": true,
        "strict-route": false,
        "route-exclude-address": [],
        mtu: 1500
    };
    log('TUN configured');
}
