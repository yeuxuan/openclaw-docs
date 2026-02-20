---
title: "脚本约定"
sidebarTitle: "脚本约定"
---

# 脚本约定（Script Conventions）

OpenClaw 允许你通过自定义脚本扩展 Agent 的能力。遵循本页的约定，能让你的脚本与 OpenClaw 更好地协作。

---

## 脚本放置位置

OpenClaw 会从以下两个位置加载脚本：

| 位置 | 说明 |
|------|------|
| `~/.openclaw/scripts/` | 全局脚本，对所有 Agent 可用 |
| `<workspace>/scripts/` | 工作区脚本，仅对当前 Agent 工作区可用 |

工作区路径通常为 `~/.openclaw/workspaces/<agent-name>/scripts/`。

---

## 推荐格式

OpenClaw 支持以下脚本语言：

- **Bash / Shell**（`.sh`）—— 适合系统操作、文件处理
- **Python**（`.py`）—— 适合数据处理、复杂逻辑
- **Node.js**（`.js` / `.ts`）—— 适合 Web 相关操作

所有脚本文件必须有可执行权限：

```bash
chmod +x ~/.openclaw/scripts/my-script.sh
chmod +x ~/.openclaw/scripts/my-tool.py
```

---

## 命名规范

- 使用描述性名称，能从名称判断脚本用途
- 用连字符（`-`）分隔单词，**避免使用空格**
- 建议带上动词前缀：`fetch-`、`process-`、`send-` 等

```text
# 好的命名
fetch-weather-data.sh
process-user-input.py
send-notification.sh

# 不好的命名
script1.sh
my script.sh    # 有空格，会导致调用问题
temp.py
```

---

## 脚本模板

::: details Bash 脚本模板
```bash
#!/usr/bin/env bash
set -euo pipefail

# 脚本说明：<描述这个脚本做什么>
# 用法：./script-name.sh [参数]

# 使用环境变量而非硬编码路径
OPENCLAW_HOME="${OPENCLAW_HOME:-$HOME/.openclaw}"

# 主逻辑
main() {
  echo "开始执行..."
  # 你的逻辑
}

main "$@"
```
:::

::: details Python 脚本模板
```python
#!/usr/bin/env python3
"""
脚本说明：<描述这个脚本做什么>
用法：python script-name.py [参数]
"""

import os
import sys

# 使用环境变量而非硬编码路径
OPENCLAW_HOME = os.environ.get("OPENCLAW_HOME", os.path.expanduser("~/.openclaw"))


def main():
    print("开始执行...")
    # 你的逻辑


if __name__ == "__main__":
    main()
```
:::

---

## 最佳实践

**1. 脚本应该是幂等的（Idempotent）**

同一个脚本多次执行，产生的结果应该与执行一次相同。避免每次执行都追加数据或创建重复资源。

```bash
# 好：检查后再创建
if [ ! -d "$TARGET_DIR" ]; then
  mkdir -p "$TARGET_DIR"
fi

# 不好：直接创建，第二次执行会报错
mkdir "$TARGET_DIR"
```

**2. 做好错误处理**

Bash 脚本开头加 `set -euo pipefail`，遇到错误立即退出，避免静默失败。Python 脚本中使用 `try/except` 捕获异常并输出有用的错误信息。

**3. 避免硬编码路径**

使用环境变量代替绝对路径，让脚本在不同机器和用户环境下都能正常运行：

```bash
# 好：使用环境变量
CONFIG_PATH="${OPENCLAW_CONFIG:-$HOME/.openclaw/config.json5}"

# 不好：硬编码绝对路径
CONFIG_PATH="/Users/alice/.openclaw/config.json5"
```

**4. 输出清晰的状态信息**

脚本执行时应输出必要的进度信息，方便调试：

```bash
echo "[INFO] 正在获取数据..."
echo "[SUCCESS] 数据处理完成，共 $COUNT 条"
echo "[ERROR] 无法连接到 $URL" >&2
```

---

::: info 脚本权限问题
如果脚本执行时报 `Permission denied`，检查文件权限：
```bash
ls -la ~/.openclaw/scripts/
# 确保有 x（可执行）权限
chmod +x ~/.openclaw/scripts/your-script.sh
```
:::

---

_下一步：[测试指南](./testing)_
