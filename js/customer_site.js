// 额外内置源扩展。七七资源因 TLS 接口已不可用而移除。
const CUSTOMER_SITES = {};

// 调用全局方法合并
if (window.extendAPISites) {
    window.extendAPISites(CUSTOMER_SITES);
} else {
    console.error("错误：请先加载 config.js！");
}
