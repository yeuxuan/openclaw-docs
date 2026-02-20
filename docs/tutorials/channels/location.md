---
title: "通道位置解析"
sidebarTitle: "通道位置解析"
---

# 通道位置解析

OpenClaw 将聊天通道中分享的位置信息标准化为：

- 追加到入站消息正文的人类可读文本，以及
- 自动回复上下文负载中的结构化字段。

目前支持：

- **Telegram**（位置标记 + 地点 + 实时位置）
- **WhatsApp**（locationMessage + liveLocationMessage）
- **Matrix**（`m.location` 与 `geo_uri`）

---

## 文本格式

位置以友好的行格式呈现，不带括号：

- 标记：
  - `📍 48.858844, 2.294351 ±12m`
- 命名地点：
  - `📍 Eiffel Tower — Champ de Mars, Paris (48.858844, 2.294351 ±12m)`
- 实时分享：
  - `🛰 Live location: 48.858844, 2.294351 ±12m`

如果通道包含标题/评论，会追加在下一行：

```text
📍 48.858844, 2.294351 ±12m
Meet here
```

---

## 上下文字段

当存在位置信息时，以下字段会添加到 `ctx` 中：

- `LocationLat`（number）
- `LocationLon`（number）
- `LocationAccuracy`（number，米；可选）
- `LocationName`（string；可选）
- `LocationAddress`（string；可选）
- `LocationSource`（`pin | place | live`）
- `LocationIsLive`（boolean）

---

## 通道说明

- **Telegram**：地点映射到 `LocationName/LocationAddress`；实时位置使用 `live_period`。
- **WhatsApp**：`locationMessage.comment` 和 `liveLocationMessage.caption` 作为标题行追加。
- **Matrix**：`geo_uri` 被解析为标记位置；忽略海拔，`LocationIsLive` 始终为 false。
