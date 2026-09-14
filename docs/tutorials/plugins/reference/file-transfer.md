---
title: "File Transfer plugin"
---

# File Transfer plugin

::: tip 先看人话
这页是从 OpenClaw 官方最新文档同步来的专题参考。新手不要一口气背完，先看标题和第一段；真正要配置这个功能时，再按步骤慢慢做。
:::

Fetch, list, and write files on paired nodes via dedicated node commands. Bypasses bash stdout truncation by using base64 over node.invoke for binaries up to 16 MB.

## Distribution

- Package: `@openclaw/file-transfer`
- Install route: included in OpenClaw

## Surface

contracts: tools

## 获取整个目录的边界

`dir_fetch` 会获取完整目录树，包括点文件和隐藏目录。文件传输策略逐一检查所有后代；任意一项被拒绝时，整个传输失败，不会悄悄过滤后继续。路径身份、符号链接、压缩包体积和解包限制仍然适用。传目录前先检查是否含凭据、缓存或其他不应传出的隐藏内容。
